import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import ErrorLog from '@/lib/db/models/ErrorLog'
import { auth } from '@/lib/auth/config'

const schema = z.object({
  suspended: z.boolean(),
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
    { $set: { suspended: parsed.data.suspended } },
    { new: true }
  ).select('-passwordHash').lean()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const session = await auth()
  await ErrorLog.create({
    message:  `Admin ${parsed.data.suspended ? 'suspended' : 'unsuspended'} user ${id}`,
    action:   parsed.data.suspended ? 'user.suspend' : 'user.unsuspend',
    route:    `/api/admin/users/${id}/suspend`,
    userId:   session?.user?.id,
    severity: 'high',
  })

  return NextResponse.json({ user })
}
