import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Order from '@/lib/db/models/Order'
import XPEvent from '@/lib/db/models/XPEvent'
import CreditEvent from '@/lib/db/models/CreditEvent'

const patchSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  await connectDB()

  const user = await User.findById(id).select('-passwordHash').lean()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [orders, xpEvents, creditEvents] = await Promise.all([
    Order.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    XPEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    CreditEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
  ])

  return NextResponse.json({ user, orders, xpEvents, creditEvents })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const user = await User.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true }
  ).select('-passwordHash').lean()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
}
