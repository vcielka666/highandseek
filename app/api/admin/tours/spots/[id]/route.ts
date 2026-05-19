import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import CannabisSpot from '@/lib/db/models/CannabisSpot'
import { awardXP } from '@/lib/xp'
import { awardBadge } from '@/lib/badges'

const patchSchema = z.object({
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const raw = await req.json()
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const existing = await CannabisSpot.findById(id)
    .select('verified addedBy')
    .lean<{ verified: boolean; addedBy?: string }>()

  if (!existing) {
    return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  }

  const spot = await CannabisSpot.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true }
  ).lean()

  // If newly verified and has an addedBy user: award XP + badge
  if (parsed.data.verified === true && existing.verified === false && existing.addedBy) {
    try {
      await awardXP(existing.addedBy, 'SPOT_VERIFIED')
    } catch {
      // never block caller
    }
    try {
      await awardBadge(existing.addedBy, 'spot_hunter')
    } catch {
      // never block caller
    }
  }

  return NextResponse.json({ spot })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const raw = await req.json()

  await connectDB()

  const spot = await CannabisSpot.findByIdAndUpdate(
    id,
    { $set: raw },
    { new: true, runValidators: true }
  ).lean()

  if (!spot) {
    return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  }

  return NextResponse.json({ spot })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  await connectDB()

  const spot = await CannabisSpot.findByIdAndDelete(id).lean()
  if (!spot) {
    return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
