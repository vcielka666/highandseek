import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import { awardXP } from '@/lib/xp'
import { getActionEffect } from '@/lib/grow/simulation'
import { calculateAttributes, phOptimalRange } from '@/lib/grow/attributes'
import type { GrowStage } from '@/lib/grow/simulation'

const ActionSchema = z.object({
  type: z.enum(['water', 'feed', 'lst', 'defoliate', 'lollipop', 'ph_check', 'ph_adjust', 'top', 'flush', 'topdress', 'light_raise', 'light_lower', 'light_height', 'fan_speed', 'flip_12_12']),
  value: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  }
  const { type } = parsed.data

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  // Persistent dynamic state — read once, used in all handlers
  const storedWatering  = grow.attributes?.watering?.value  ?? 70
  const storedNutrients = grow.attributes?.nutrients?.value ?? 50

  // Handle fan speed
  if (type === 'fan_speed') {
    const speed = Math.min(100, Math.max(0, parsed.data.value ?? 100));
    (grow.environment as { exhaustFanSpeed?: number }).exhaustFanSpeed = speed

    const newAttributes = calculateAttributes(
      grow.setup as Parameters<typeof calculateAttributes>[0],
      grow.environment as Parameters<typeof calculateAttributes>[1],
      grow.stage as GrowStage,
      storedWatering,
      storedNutrients,
    )
    grow.set('attributes', newAttributes)
    grow.markModified('attributes')
    const effDesc = `Fan set to ${speed}% — ${speed >= 80 ? 'strong airflow, lower humidity' : speed >= 40 ? 'moderate airflow' : 'low airflow, humidity rising'}`
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 0, effect: effDesc })
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: effDesc })
  }

  // Handle pH adjust
  if (type === 'ph_adjust') {
    const [low, high] = phOptimalRange((grow.setup as { medium: string }).medium)
    const optimal = Math.round(((low + high) / 2) * 10) / 10
    const currentPh = (grow.environment as { ph?: number }).ph ?? 6.5
    const targetPh = parsed.data.value !== undefined
      ? Math.max(4.0, Math.min(8.5, Math.round(parsed.data.value * 10) / 10))
      : optimal
    ;(grow.environment as { ph?: number }).ph = targetPh
    grow.markModified('environment')
    const newAttributes = calculateAttributes(
      grow.setup as Parameters<typeof calculateAttributes>[0],
      grow.environment as Parameters<typeof calculateAttributes>[1],
      grow.stage as GrowStage,
      storedWatering,
      storedNutrients,
    )
    grow.set('attributes', newAttributes)
    grow.markModified('attributes')
    const inRange = targetPh >= low && targetPh <= high
    const medium = (grow.setup as { medium: string }).medium
    const effectMsg = inRange
      ? `pH adjusted to ${targetPh} — in optimal range for ${medium} (${low}–${high})`
      : `pH adjusted to ${targetPh} — still outside optimal range (${low}–${high})`
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 5, effect: effectMsg })
    await awardXP(session.user.id, 'WATER_PLANT', 5)
    grow.xpEarned += 5
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: effectMsg })
  }

  // Handle light height adjustments
  if (type === 'light_raise' || type === 'light_lower' || type === 'light_height') {
    const current = (grow.environment as { lightHeight?: number }).lightHeight ?? 67
    let newHeight: number
    if (type === 'light_height' && parsed.data.value !== undefined) {
      newHeight = Math.min(67, Math.max(30, parsed.data.value))
    } else {
      const delta = type === 'light_raise' ? 10 : -10
      newHeight = Math.min(67, Math.max(30, current + delta))
    }
    ;(grow.environment as { lightHeight?: number }).lightHeight = newHeight

    const newAttributes = calculateAttributes(
      grow.setup as Parameters<typeof calculateAttributes>[0],
      grow.environment as Parameters<typeof calculateAttributes>[1],
      grow.stage as GrowStage,
      storedWatering,
      storedNutrients,
    )
    grow.set('attributes', newAttributes)
    grow.markModified('attributes')
    const effectMsg = type === 'light_height'
      ? `Light set to ${newHeight}cm from canopy`
      : type === 'light_raise'
        ? `Light raised to ${newHeight}cm — less canopy heat`
        : `Light lowered to ${newHeight}cm — more intensity, more heat`
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 0, effect: effectMsg })
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: grow.actions[grow.actions.length - 1].effect })
  }

  // Handle 12/12 flip
  if (type === 'flip_12_12') {
    if (grow.stage !== 'veg') {
      return NextResponse.json({ error: 'Flip to 12/12 only available during veg stage' }, { status: 400 })
    }
    const day = grow.currentDay
    ;(grow as typeof grow & { manualFlipDay?: number | null }).manualFlipDay = day
    if (grow.environment) grow.environment.lightHours = 12
    grow.stage = 'flower'

    // Yield impact based on veg days (not total days — clones enter veg at day 5, seeds at day 8)
    const seedlingEnd = (grow as typeof grow & { isClone?: boolean }).isClone ? 4 : 7
    const vegDays = day - seedlingEnd
    let yieldMult = 1.0
    let impactMsg = 'Optimal timing — no yield penalty.'
    if (vegDays < 10)       { yieldMult = 0.75; impactMsg = 'Very early flip — yield −25%. Plant was not ready.' }
    else if (vegDays < 17)  { yieldMult = 0.85; impactMsg = 'Early flip — yield −15%. Some stretch expected.' }
    else if (vegDays <= 28) { yieldMult = 1.0;  impactMsg = 'Perfect timing — no yield penalty.' }
    else if (vegDays <= 35) { yieldMult = 0.90; impactMsg = 'Late flip — yield −10%. Canopy management needed.' }
    else                    { yieldMult = 0.80; impactMsg = 'Very late flip — yield −20%. Defoliate to manage canopy.' }

    if (yieldMult < 1.0) {
      grow.yieldProjection = Math.round(grow.yieldProjection * yieldMult)
    }

    const effectMsg = `Flipped to 12/12 on Day ${day}. ${impactMsg}`
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 0, effect: effectMsg })
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: effectMsg })
  }

  // Handle defoliation — stage-aware yield consequences
  if (type === 'defoliate') {
    const stage = grow.stage as GrowStage
    const seedlingEnd = (grow as typeof grow & { isClone?: boolean }).isClone ? 4 : 7
    const vegDays = grow.currentDay - seedlingEnd
    const prevDefoCount = grow.actions.filter((a: { type: string }) => a.type === 'defoliate').length

    let humidityDelta = 0
    let xpEarned = 15
    let effectMsg = ''

    if (stage === 'seedling') {
      // Severely harmful — allowed if user force-confirmed client-side
      grow.yieldProjection = Math.round(grow.yieldProjection * 0.80)
      humidityDelta = -3
      xpEarned = 0
      effectMsg = '⚠️ Seedling defoliated — severe stress, yield −20%'
    } else if (stage === 'veg' && vegDays < 14) {
      // Early veg — no yield benefit, minor humidity improvement from first defo
      humidityDelta = prevDefoCount === 0 ? -4 : 0
      xpEarned = 5
      const humNote = humidityDelta < 0 ? `, humidity ${humidityDelta}%` : ''
      effectMsg = `Early veg defoliation — no yield bonus${humNote}`
    } else if ((stage === 'late_flower' || stage === 'harvest') && prevDefoCount >= 2) {
      // Over-defoliation in late flower stresses buds
      grow.yieldProjection = Math.round(grow.yieldProjection * 0.95)
      humidityDelta = -15
      xpEarned = 5
      effectMsg = '⚠️ Over-defoliation — bud stress, yield −5%, humidity −15%'
    } else {
      // Normal stage-appropriate defoliation
      let humidityNote = ''
      if (prevDefoCount === 0) {
        humidityDelta = -6
        humidityNote = 'humidity −6%'
      } else if (prevDefoCount === 1) {
        humidityDelta = -3
        humidityNote = 'humidity −3%'
      } else if (stage === 'late_flower' || stage === 'harvest') {
        humidityDelta = -20
        humidityNote = 'heavy late-flower defoliation — humidity −20%'
      } else {
        humidityNote = 'canopy already open — no humidity effect'
      }
      const yieldBonus = prevDefoCount < 2 ? 0.05 : 0
      if (yieldBonus > 0) {
        grow.yieldProjection = Math.round(grow.yieldProjection * (1 + yieldBonus))
      }
      effectMsg = `Defoliated — ${humidityNote}${yieldBonus > 0 ? ', yield +5%' : ''}`
    }

    if (humidityDelta !== 0) {
      const env = grow.environment as { humidity: number }
      env.humidity = Math.max(0, Math.min(100, env.humidity + humidityDelta))
      grow.markModified('environment')
    }

    const newAttributes = calculateAttributes(
      grow.setup as Parameters<typeof calculateAttributes>[0],
      grow.environment as Parameters<typeof calculateAttributes>[1],
      stage,
      storedWatering,
      storedNutrients,
    )
    grow.set('attributes', newAttributes)
    grow.markModified('attributes')

    grow.actions.push({ type, timestamp: new Date(), xpEarned, effect: effectMsg })
    if (xpEarned > 0) {
      await awardXP(session.user.id, 'DEFOLIATION', xpEarned)
      grow.xpEarned += xpEarned
    }
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: effectMsg })
  }

  // Handle lollipop — one-time, removes bottom branches, improves humidity/ventilation
  if (type === 'lollipop') {
    const stage = grow.stage as GrowStage
    if (stage === 'seedling' || stage === 'veg') {
      return NextResponse.json({ error: 'Lollipopping only available from flower stage' }, { status: 400 })
    }
    const alreadyDone = (grow as typeof grow & { hasLollipoped?: boolean }).hasLollipoped
    if (alreadyDone) {
      return NextResponse.json({ error: 'Already lollipopped this grow' }, { status: 400 })
    }
    ;(grow as typeof grow & { hasLollipoped?: boolean }).hasLollipoped = true
    grow.markModified('hasLollipoped')

    // Removes dense lower canopy → humidity drops, ventilation improves
    const env = grow.environment as { humidity: number }
    env.humidity = Math.max(0, env.humidity - 8)
    grow.markModified('environment')

    const newAttributes = calculateAttributes(
      grow.setup as Parameters<typeof calculateAttributes>[0],
      grow.environment as Parameters<typeof calculateAttributes>[1],
      stage,
      storedWatering,
      storedNutrients,
    )
    grow.set('attributes', newAttributes)
    grow.markModified('attributes')

    const effectMsg = 'Lollipopped — bottom branches removed, humidity −8%, ventilation improved'
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 20, effect: effectMsg })
    await awardXP(session.user.id, 'DEFOLIATION', 20)
    grow.xpEarned += 20
    await grow.save()
    return NextResponse.json({ grow: grow.toObject(), effect: effectMsg })
  }

  const effect = getActionEffect(type, grow.stage as GrowStage)

  // Apply deltas to persistent dynamic state
  const currentWatering  = effect.wateringDelta
    ? Math.min(100, Math.max(0, storedWatering  + effect.wateringDelta))
    : storedWatering
  const currentNutrients = effect.nutrientsDelta !== undefined
    ? Math.min(100, Math.max(0, storedNutrients + effect.nutrientsDelta))
    : storedNutrients

  // Apply yield bonus
  if (effect.yieldBonus) {
    grow.yieldProjection = Math.round(grow.yieldProjection * (1 + effect.yieldBonus))
  }

  // Recalculate all attributes — both watering and nutrients are dynamic now
  const newAttributes = calculateAttributes(
    grow.setup as Parameters<typeof calculateAttributes>[0],
    grow.environment as Parameters<typeof calculateAttributes>[1],
    grow.stage as GrowStage,
    currentWatering,
    currentNutrients,
  )

  grow.set('attributes', newAttributes)
  grow.markModified('attributes')

  // Record action
  grow.actions.push({
    type,
    timestamp: new Date(),
    xpEarned:  effect.xp,
    effect:    effect.effectDesc,
  })

  // Award XP
  if (effect.xp > 0) {
    const xpKey = type === 'water' ? 'WATER_PLANT'
      : type === 'feed'  ? 'FEED_PLANT'
      : type === 'lst'   ? 'LST_APPLIED'
      : type === 'top'   ? 'TOP_PLANT'
      : type === 'flush' ? 'FLUSH_PLANT'
      : 'WATER_PLANT'
    await awardXP(session.user.id, xpKey, effect.xp)
    grow.xpEarned += effect.xp
  }

  await grow.save()

  return NextResponse.json({ grow: grow.toObject(), effect: effect.effectDesc })
}
