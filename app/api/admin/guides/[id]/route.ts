import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

const bodySchema = z.object({
  action:     z.enum(['approve', 'reject']),
  commission: z.number().min(0).max(50).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const raw = await req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  await connectDB()

  const update: Record<string, unknown> = {}

  if (parsed.data.action === 'approve') {
    update.tourGuideStatus = 'approved'
    update.tourGuideApprovedAt = new Date()
    if (parsed.data.commission !== undefined) {
      update.platformCommission = parsed.data.commission
    }
  } else {
    update.tourGuideStatus = 'rejected'
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .select('username email tourGuideStatus platformCommission')
    .lean()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user })
}
