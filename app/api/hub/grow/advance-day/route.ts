import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import { advanceDay } from '@/lib/grow/simulation'
import type { Setup, Environment } from '@/lib/grow/attributes'
import type { Warning } from '@/lib/grow/simulation'

// Max days to catch up in one request — prevents runaway loops on very stale grows
const MAX_CATCHUP_DAYS = 60

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  // Block advancement once plant is ready to harvest
  if (grow.stage === 'harvest') {
    return NextResponse.json({ error: 'Plant is ready to harvest', readyToHarvest: true }, { status: 409 })
  }

  const dayDurationSeconds = (grow as typeof grow & { dayDurationSeconds?: number }).dayDurationSeconds ?? 86400
  const intervalMs  = dayDurationSeconds * 1000
  const msSinceLast = Date.now() - grow.lastAdvanced.getTime()

  // How many full days have elapsed since last advance
  const missedDays = Math.min(MAX_CATCHUP_DAYS, Math.floor(msSinceLast / intervalMs))

  if (missedDays < 1) {
    const secondsLeft = Math.ceil((intervalMs - msSinceLast) / 1000)
    return NextResponse.json({ error: 'Too soon', secondsLeft }, { status: 429 })
  }

  const growAny = grow as typeof grow & { manualFlipDay?: number | null; maxHealth?: number; isClone?: boolean }

  // Carry-over state across multiple simulated days
  let currentDay      = grow.currentDay
  let stage           = grow.stage
  let health          = grow.health
  let maxHealth       = growAny.maxHealth ?? 100
  let yieldProjection = grow.yieldProjection
  let currentWatering  = grow.attributes?.watering?.value  ?? 70
  let currentNutrients = grow.attributes?.nutrients?.value ?? 50
  let existingWarnings = (grow.warnings as Warning[]).filter(w => !w.resolvedAt)
  let lastAttributes   = grow.attributes
  let died             = false
  let prevStage        = stage
  const stageAtStart   = stage

  for (let i = 0; i < missedDays; i++) {
    // Stop simulating once dead or at harvest
    if (died || (stage as string) === 'harvest') break

    prevStage = stage

    const result = advanceDay({
      currentDay,
      floweringTime:         grow.floweringTime,
      flipDay:               growAny.manualFlipDay ?? null,
      isClone:               growAny.isClone ?? false,
      setup:                 grow.setup as Setup,
      environment:           grow.environment as Environment,
      health,
      maxHealth,
      currentWatering,
      currentNutrients,
      strainType:            grow.strainType as 'indica' | 'sativa' | 'hybrid',
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
    existingWarnings = result.warnings.filter(w => !w.resolvedAt)
    lastAttributes   = result.attributes
    died             = result.died

    // Auto-flip light hours
    if (prevStage === 'veg' && stage === 'flower' && grow.environment) {
      grow.environment.lightHours = 12
    }
  }

  grow.currentDay      = currentDay
  grow.stage           = stage
  grow.set('attributes', lastAttributes)
  grow.markModified('attributes')
  grow.health          = health
  ;(grow as typeof grow & { maxHealth?: number }).maxHealth = maxHealth
  grow.yieldProjection = yieldProjection
  grow.warnings        = existingWarnings as typeof grow.warnings
  grow.lastAdvanced    = new Date()

  if (died) {
    grow.status = 'failed'
  }

  await grow.save()

  return NextResponse.json({
    grow:         grow.toObject(),
    daysAdvanced: missedDays,
    stageChanged: stage !== stageAtStart,
  })
}
