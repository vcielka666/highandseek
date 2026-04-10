import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import { awardXP } from '@/lib/xp'
import { getActionEffect } from '@/lib/grow/simulation'
import { calculateAttributes } from '@/lib/grow/attributes'
import type { GrowStage } from '@/lib/grow/simulation'

const ActionSchema = z.object({
  type: z.enum(['water', 'feed', 'lst', 'defoliate', 'ph_check', 'top', 'flush', 'topdress', 'light_raise', 'light_lower', 'light_height', 'fan_speed', 'flip_12_12']),
  value: z.number().min(0).max(100).optional(),
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

  // Handle light height adjustments
  if (type === 'light_raise' || type === 'light_lower' || type === 'light_height') {
    const current = (grow.environment as { lightHeight?: number }).lightHeight ?? 60
    let newHeight: number
    if (type === 'light_height' && parsed.data.value !== undefined) {
      newHeight = Math.min(100, Math.max(20, parsed.data.value))
    } else {
      const delta = type === 'light_raise' ? 10 : -10
      newHeight = Math.min(100, Math.max(20, current + delta))
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

    // Yield impact based on timing
    let yieldMult = 1.0
    let impactMsg = 'Optimal timing — no yield penalty.'
    if (day < 21)       { yieldMult = 0.75; impactMsg = 'Very early flip — yield −25%. Plant was not ready.' }
    else if (day < 28)  { yieldMult = 0.85; impactMsg = 'Early flip — yield −15%. Some stretch expected.' }
    else if (day <= 35) { yieldMult = 1.0;  impactMsg = 'Perfect timing — no yield penalty.' }
    else if (day <= 42) { yieldMult = 0.90; impactMsg = 'Late flip — yield −10%. Canopy management needed.' }
    else                { yieldMult = 0.80; impactMsg = 'Very late flip — yield −20%. Defoliate to manage canopy.' }

    if (yieldMult < 1.0) {
      grow.yieldProjection = Math.round(grow.yieldProjection * yieldMult)
    }

    const effectMsg = `Flipped to 12/12 on Day ${day}. ${impactMsg}`
    grow.actions.push({ type, timestamp: new Date(), xpEarned: 0, effect: effectMsg })
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
    await awardXP(session.user.id, type === 'water' ? 'WATER_PLANT' :
      type === 'feed' ? 'FEED_PLANT' :
      type === 'lst'  ? 'LST_APPLIED' :
      type === 'defoliate' ? 'DEFOLIATION' : 'WATER_PLANT', effect.xp)
    grow.xpEarned += effect.xp
  }

  await grow.save()

  return NextResponse.json({ grow: grow.toObject(), effect: effect.effectDesc })
}
