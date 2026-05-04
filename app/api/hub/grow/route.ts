import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import User from '@/lib/db/models/User'
import { calculateAttributes } from '@/lib/grow/attributes'
import { advanceDay } from '@/lib/grow/simulation'
import type { Setup, Environment, GrowStage } from '@/lib/grow/attributes'
import type { Warning } from '@/lib/grow/simulation'

// Max catch-up per GET — 1500 covers a full day of 1-min grows
const MAX_CATCHUP = 1500

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const byId = searchParams.get('id')

  const [growDoc, userDoc] = await Promise.all([
    byId
      ? VirtualGrow.findOne({ _id: byId, userId: session.user.id })
      : VirtualGrow.findOne({ userId: session.user.id, status: 'active' }),
    User.findById(session.user.id).select('credits').lean<{ credits: number }>(),
  ])

  const credits = userDoc?.credits ?? 0

  if (!growDoc) return NextResponse.json({ grow: null, credits })

  // Auto-advance all missed days on page load — grow progresses even when browser is closed
  if (growDoc.status === 'active' && growDoc.stage !== 'harvest') {
    const dayDurationSeconds = (growDoc as typeof growDoc & { dayDurationSeconds?: number }).dayDurationSeconds ?? 86400
    const intervalMs  = dayDurationSeconds * 1000
    const msSinceLast = Date.now() - growDoc.lastAdvanced.getTime()
    const missedDays  = Math.min(MAX_CATCHUP, Math.floor(msSinceLast / intervalMs))

    if (missedDays >= 1) {
      const growAny = growDoc as typeof growDoc & { manualFlipDay?: number | null; maxHealth?: number; isClone?: boolean }

      let currentDay       = growDoc.currentDay
      let stage            = growDoc.stage
      let health           = growDoc.health
      let maxHealth        = growAny.maxHealth ?? 100
      let yieldProjection  = growDoc.yieldProjection
      let currentWatering  = growDoc.attributes?.watering?.value  ?? 70
      let currentNutrients = growDoc.attributes?.nutrients?.value ?? 50
      let existingWarnings = (growDoc.warnings as Warning[]).filter((w: Warning) => !w.resolvedAt)
      let lastAttributes   = growDoc.attributes
      let died             = false
      let prevStage        = stage

      for (let i = 0; i < missedDays; i++) {
        if (died || (stage as string) === 'harvest') break
        prevStage = stage

        const result = advanceDay({
          currentDay,
          floweringTime:         growDoc.floweringTime,
          flipDay:               growAny.manualFlipDay ?? null,
          isClone:               growAny.isClone ?? false,
          setup:                 growDoc.setup as Setup,
          environment:           growDoc.environment as Environment,
          health,
          maxHealth,
          currentWatering,
          currentNutrients,
          strainType:            growDoc.strainType as 'indica' | 'sativa' | 'hybrid',
          existingWarnings,
          storedYieldProjection: yieldProjection,
        })

        currentDay       = result.currentDay
        stage            = result.stage as typeof stage
        health           = result.health
        maxHealth        = result.maxHealth
        yieldProjection  = result.yieldProjection
        currentWatering  = result.attributes.watering.value
        currentNutrients = result.attributes.nutrients.value
        existingWarnings = result.warnings.filter((w: Warning) => !w.resolvedAt)
        lastAttributes   = result.attributes
        died             = result.died

        if (prevStage === 'veg' && stage === 'flower' && growDoc.environment) {
          growDoc.environment.lightHours = 12
        }
      }

      growDoc.currentDay      = currentDay
      growDoc.stage           = stage
      growDoc.set('attributes', lastAttributes)
      growDoc.markModified('attributes')
      growDoc.health          = health
      ;(growDoc as typeof growDoc & { maxHealth?: number }).maxHealth = maxHealth
      growDoc.yieldProjection = yieldProjection
      growDoc.warnings        = existingWarnings as typeof growDoc.warnings
      growDoc.lastAdvanced    = new Date()
      if (died) growDoc.status = 'failed'

      await growDoc.save()
    }
  }

  const grow = growDoc.toObject() as Record<string, unknown>

  // Recalculate live attributes for active grows
  if (grow.status === 'active') {
    const attrs = grow.attributes as { watering?: { value?: number }; nutrients?: { value?: number } } | undefined
    const freshAttrs = calculateAttributes(
      grow.setup as Setup,
      grow.environment as Environment,
      grow.stage as GrowStage,
      attrs?.watering?.value ?? 70,
      attrs?.nutrients?.value ?? 50,
    )
    grow.attributes = freshAttrs
  }

  return NextResponse.json({ grow, credits })
}
