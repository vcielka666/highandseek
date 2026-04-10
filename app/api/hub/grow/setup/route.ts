import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { calculateAttributes } from '@/lib/grow/attributes'
import type { Setup, Environment, GrowStage } from '@/lib/grow/attributes'

// Maps incoming field keys to a group name.
// First change per group costs 1 credit + 50 XP.
const FIELD_TO_GROUP: Record<string, string> = {
  lightType:         'light',
  lightWatts:        'light',
  potSize:           'potSize',
  watering:          'watering',
  nutrients:         'nutrients',
  hasExhaustFan:     'exhaustFan',
  exhaustCFM:        'exhaustFan',
  hasCirculationFan: 'circulationFan',
  hasCarbonFilter:   'carbonFilter',
  hasPHMeter:        'phMeter',
  hasECMeter:        'ecMeter',
  hasHygrometer:     'hygrometer',
}

const SETUP_CHANGE_COST_CREDITS = 1
const SETUP_CHANGE_XP           = 50

const SetupPatchSchema = z.object({
  lightType:         z.enum(['led', 'hps', 'cmh', 'cfl']).optional(),
  lightWatts:        z.number().int().min(50).max(2000).optional(),
  potSize:           z.enum(['small', 'medium', 'large']).optional(),
  watering:          z.enum(['manual', 'blumat', 'drip']).optional(),
  nutrients:         z.enum(['organic', 'mineral', 'none']).optional(),
  hasExhaustFan:     z.boolean().optional(),
  exhaustCFM:        z.number().int().min(0).max(2000).optional(),
  hasCirculationFan: z.boolean().optional(),
  hasCarbonFilter:   z.boolean().optional(),
  hasPHMeter:        z.boolean().optional(),
  hasECMeter:        z.boolean().optional(),
  hasHygrometer:     z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field required' })

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = SetupPatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  // Determine which group this change belongs to
  const changedKeys   = Object.keys(parsed.data)
  const group         = FIELD_TO_GROUP[changedKeys[0]] ?? 'other'
  const existingChangedGroups = (grow as unknown as { setupChangedGroups?: string[] }).setupChangedGroups
  const alreadyChanged = Array.isArray(existingChangedGroups) && existingChangedGroups.includes(group)

  // First change costs 1 credit
  if (!alreadyChanged) {
    const user = await User.findById(session.user.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if ((user.credits ?? 0) < SETUP_CHANGE_COST_CREDITS) {
      return NextResponse.json({ error: 'Not enough credits', required: SETUP_CHANGE_COST_CREDITS }, { status: 402 })
    }
    await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -SETUP_CHANGE_COST_CREDITS } })
  }

  // Apply field changes
  const setup = grow.setup as unknown as Record<string, unknown>
  for (const [key, val] of Object.entries(parsed.data)) {
    setup[key] = val
  }
  grow.markModified('setup')

  // Recalculate attributes
  const attrs = grow.attributes as unknown as { watering?: { value?: number }; nutrients?: { value?: number } } | undefined
  const newAttrs = calculateAttributes(
    grow.setup as unknown as Setup,
    grow.environment as unknown as Environment,
    grow.stage as GrowStage,
    attrs?.watering?.value ?? 70,
    attrs?.nutrients?.value ?? 50,
  )
  grow.set('attributes', newAttrs)
  grow.markModified('attributes')

  // Record group as changed + award XP on first change
  let xpAwarded = 0
  if (!alreadyChanged) {
    const growAny = grow as unknown as { setupChangedGroups?: string[] }
    if (!growAny.setupChangedGroups) growAny.setupChangedGroups = []
    growAny.setupChangedGroups.push(group)
    grow.markModified('setupChangedGroups')
    await awardXP(session.user.id, 'CORRECT_EVENT_RESPONSE', SETUP_CHANGE_XP)
    xpAwarded = SETUP_CHANGE_XP
    grow.xpEarned = (grow.xpEarned ?? 0) + SETUP_CHANGE_XP
  }

  await grow.save()

  return NextResponse.json({
    grow:        grow.toObject(),
    firstChange: !alreadyChanged,
    xpAwarded,
    creditsSpent: !alreadyChanged ? SETUP_CHANGE_COST_CREDITS : 0,
  })
}
