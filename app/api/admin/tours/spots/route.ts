import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import CannabisSpot from '@/lib/db/models/CannabisSpot'

export async function GET(_req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const spots = await CannabisSpot.find()
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ spots })
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const raw = await req.json()

  await connectDB()

  try {
    const spot = await CannabisSpot.create({ ...raw, verified: true })
    return NextResponse.json({ spot }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create spot'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
