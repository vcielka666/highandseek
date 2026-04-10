import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import CreditEvent from '@/lib/db/models/CreditEvent'
import ErrorLog from '@/lib/db/models/ErrorLog'
import { auth } from '@/lib/auth/config'

const schema = z.object({
  amount: z.number().int().min(1).max(100000),
  reason: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const user = await User.findByIdAndUpdate(
    id,
    { $inc: { credits: parsed.data.amount } },
    { new: true }
  ).select('-passwordHash').lean()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await CreditEvent.create({
    userId: id,
    type:   'earned',
    amount: parsed.data.amount,
    reason: `admin_award: ${parsed.data.reason}`,
  })

  const session = await auth()
  await ErrorLog.create({
    message:  `Admin awarded ${parsed.data.amount} credits to user ${id}: ${parsed.data.reason}`,
    action:   'user.award_credits',
    route:    `/api/admin/users/${id}/award-credits`,
    userId:   session?.user?.id,
    severity: 'low',
  })

  return NextResponse.json({ user })
}
