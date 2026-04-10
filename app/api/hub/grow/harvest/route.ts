import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { awardCredits } from '@/lib/credits'

function qualityToCredits(quality: number): number {
  if (quality >= 90) return 80
  if (quality >= 70) return 50
  if (quality >= 50) return 30
  return 10
}

function calculateQuality(grow: {
  health: number
  actions: Array<{ type: string }>
  setup: { hasPHMeter: boolean; hasECMeter: boolean; hasHygrometer: boolean }
}): number {
  let quality = grow.health

  // Technique bonuses
  const hasLST   = grow.actions.some(a => a.type === 'lst')
  const hasDefo  = grow.actions.some(a => a.type === 'defoliate')
  const hasTop   = grow.actions.some(a => a.type === 'top')
  const hasPH    = grow.actions.some(a => a.type === 'ph_check')

  if (hasLST)  quality += 5
  if (hasDefo) quality += 3
  if (hasTop)  quality += 4
  if (hasPH)   quality += 3

  // Equipment bonuses
  if (grow.setup.hasPHMeter)    quality += 2
  if (grow.setup.hasECMeter)    quality += 2
  if (grow.setup.hasHygrometer) quality += 1

  return Math.min(100, Math.round(quality))
}

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  if (grow.stage !== 'harvest') {
    return NextResponse.json({ error: 'Plant is not ready for harvest yet' }, { status: 400 })
  }

  const qualityScore = calculateQuality({
    health:  grow.health,
    actions: grow.actions as Array<{ type: string }>,
    setup:   grow.setup as { hasPHMeter: boolean; hasECMeter: boolean; hasHygrometer: boolean },
  })

  const gramsYield    = Math.round(grow.yieldProjection * (qualityScore / 100))
  const creditsEarned = qualityToCredits(qualityScore)
  const xpBonus       = Math.round(qualityScore * 2)  // up to +200 XP quality bonus
  const totalXP       = 200 + xpBonus

  // Award credits + XP
  await awardCredits(session.user.id, creditsEarned, `harvest_quality_${qualityScore}`)
  await awardXP(session.user.id, 'GROW_COMPLETED', totalXP)

  // Update grow
  grow.harvestData = {
    gramsYield,
    qualityScore,
    creditsEarned,
    completedAt: new Date(),
  }
  grow.status   = 'completed'
  grow.xpEarned += totalXP

  await grow.save()

  // Increment user growsCompleted
  await User.findByIdAndUpdate(session.user.id, { $inc: { growsCompleted: 1 } })

  return NextResponse.json({
    gramsYield,
    qualityScore,
    creditsEarned,
    xpEarned: totalXP,
    isPerkEligible: grow.isPerkEligible,
  })
}
