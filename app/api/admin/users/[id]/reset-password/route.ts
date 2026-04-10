import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import ErrorLog from '@/lib/db/models/ErrorLog'
import { auth } from '@/lib/auth/config'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateTempPassword() {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase()
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  await connectDB()

  const user = await User.findById(id).lean()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tempPassword = generateTempPassword()
  const hash = await bcrypt.hash(tempPassword, 12)

  await User.findByIdAndUpdate(id, { $set: { passwordHash: hash } })

  // Send email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from:    'High & Seek <noreply@highandseeek.com>',
      to:      user.email as string,
      subject: 'Your password has been reset',
      text:    `Your temporary password is: ${tempPassword}\n\nPlease change it after logging in.`,
    }).catch(() => { /* non-fatal */ })
  }

  const session = await auth()
  await ErrorLog.create({
    message:  `Admin reset password for user ${id} (${user.email})`,
    action:   'user.reset_password',
    route:    `/api/admin/users/${id}/reset-password`,
    userId:   session?.user?.id,
    severity: 'high',
  })

  return NextResponse.json({ success: true })
}
