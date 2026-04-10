import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import { advanceDay } from '@/lib/grow/simulation'
import type { Setup, Environment } from '@/lib/grow/attributes'
import type { Warning } from '@/lib/grow/simulation'

// Rate limit: one advance per dayDurationSeconds (stored on grow)

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  // Rate-limit: one advance per dayDurationSeconds
  const dayDurationSeconds = (grow as typeof grow & { dayDurationSeconds?: number }).dayDurationSeconds ?? 86400
  const intervalMs = dayDurationSeconds * 1000
  const msSinceLast = Date.now() - grow.lastAdvanced.getTime()
  if (msSinceLast < intervalMs) {
    const secondsLeft = Math.ceil((intervalMs - msSinceLast) / 1000)
    return NextResponse.json({ error: 'Too soon', secondsLeft }, { status: 429 })
  }

  const prevStage = grow.stage

  const growAny = grow as typeof grow & { manualFlipDay?: number | null; maxHealth?: number }

  const result = advanceDay({
    currentDay:       grow.currentDay,
    floweringTime:    grow.floweringTime,
    flipDay:          growAny.manualFlipDay ?? null,
    setup:            grow.setup as Setup,
    environment:      grow.environment as Environment,
    health:           grow.health,
    maxHealth:        growAny.maxHealth ?? 100,
    currentWatering:  grow.attributes?.watering?.value ?? 70,
    currentNutrients: grow.attributes?.nutrients?.value ?? 50,
    strainType:       grow.strainType as 'indica' | 'sativa' | 'hybrid',
    existingWarnings: (grow.warnings as Warning[]).filter(w => !w.resolvedAt),
  })

  grow.currentDay      = result.currentDay
  grow.stage           = result.stage
  grow.set('attributes', result.attributes)
  grow.markModified('attributes')
  grow.health          = result.health
  ;(grow as typeof grow & { maxHealth?: number }).maxHealth = result.maxHealth
  grow.yieldProjection = result.yieldProjection
  grow.warnings        = result.warnings as typeof grow.warnings
  grow.lastAdvanced    = new Date()

  // Auto-update light hours when auto-flipping to flower
  if (prevStage === 'veg' && result.stage === 'flower' && grow.environment) {
    grow.environment.lightHours = 12
  }

  if (result.died) {
    grow.status = 'failed'
  } else if (result.stage === 'harvest') {
    // Keep active — user needs to manually trigger harvest
  }

  await grow.save()

  return NextResponse.json({ grow: grow.toObject(), stageChanged: result.stage !== grow.stage })
}
