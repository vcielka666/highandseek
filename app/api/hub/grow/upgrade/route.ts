import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import User from '@/lib/db/models/User'
import { calculateAttributes } from '@/lib/grow/attributes'
import type { Setup, Environment, GrowStage } from '@/lib/grow/attributes'

// ── Upgrade catalog ────────────────────────────────────────────────────────────
// Each entry mutates the grow's setup or environment object in-place.

interface UpgradeEntry {
  name:        string
  creditsCost: number
  apply:       (setup: Record<string, unknown>, env: Record<string, unknown>) => void
}

const UPGRADE_CATALOG: Record<string, UpgradeEntry> = {
  circulation_fan: {
    name:        'Oscillating Circulation Fan',
    creditsCost: 20,
    apply:       (s) => { s.hasCirculationFan = true },
  },
  upgrade_fan_small: {
    name:        'Inline Fan 200 CFM',
    creditsCost: 25,
    apply:       (s) => { s.hasExhaustFan = true; s.exhaustCFM = 200 },
  },
  upgrade_fan_medium: {
    name:        'Inline Fan 400 CFM',
    creditsCost: 40,
    apply:       (s) => { s.hasExhaustFan = true; s.exhaustCFM = Math.max(Number(s.exhaustCFM) || 0, 400) },
  },
  humidifier: {
    name:        'Ultrasonic Humidifier',
    creditsCost: 0,
    apply:       (_s, env) => { env.humidity = Math.min(90, Number(env.humidity) + 15) },
  },
  dehumidifier: {
    name:        'Portable Dehumidifier',
    creditsCost: 1,
    apply:       (_s, env) => { env.humidity = Math.max(20, Number(env.humidity) - 15) },
  },
  upgrade_light_led: {
    name:        'LED Grow Light 300W',
    creditsCost: 80,
    apply:       (s) => { s.lightType = 'led'; s.lightWatts = 300 },
  },
}

const UpgradeSchema = z.object({
  type: z.enum(Object.keys(UPGRADE_CATALOG) as [string, ...string[]]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpgradeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid upgrade type' }, { status: 400 })

  const { type } = parsed.data
  const upgrade  = UPGRADE_CATALOG[type]

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  // Duplicate purchase guard
  const upgrades = (grow as unknown as { purchasedUpgrades?: Array<{ type: string }> }).purchasedUpgrades ?? []
  if (upgrades.some(u => u.type === type)) {
    return NextResponse.json({ error: 'Already installed' }, { status: 400 })
  }

  // Credit check + deduction
  if (upgrade.creditsCost > 0) {
    const user = await User.findById(session.user.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if ((user.credits ?? 0) < upgrade.creditsCost) {
      return NextResponse.json({ error: 'Insufficient credits', required: upgrade.creditsCost }, { status: 402 })
    }
    await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -upgrade.creditsCost } })
    grow.creditsSpent = (grow.creditsSpent ?? 0) + upgrade.creditsCost
  }

  // Apply the upgrade to grow setup / environment
  const setup = grow.setup as unknown as Record<string, unknown>
  const env   = grow.environment as unknown as Record<string, unknown>
  upgrade.apply(setup, env)
  grow.markModified('setup')
  grow.markModified('environment')

  // Recalculate attributes with updated setup
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

  // Record the upgrade
  const growWithUpgrades = grow as unknown as { purchasedUpgrades: Array<{ type: string; name: string; creditsCost: number; purchasedAt: Date }> }
  growWithUpgrades.purchasedUpgrades.push({ type, name: upgrade.name, creditsCost: upgrade.creditsCost, purchasedAt: new Date() })
  grow.markModified('purchasedUpgrades')

  await grow.save()

  return NextResponse.json({
    grow:   grow.toObject(),
    effect: `${upgrade.name} installed${upgrade.creditsCost > 0 ? ` — ${upgrade.creditsCost} credits spent` : ' for free'}.`,
  })
}
