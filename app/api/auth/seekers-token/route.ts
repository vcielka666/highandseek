import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = process.env.SEEKERS_API_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Cross-app auth not configured' }, { status: 503 })
  }

  const payload = { email: session.user.email, exp: Date.now() + 60_000 }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
  const token = `${payloadB64}.${sig}`

  const seekersBase = process.env.SEEKERS_URL ?? process.env.NEXT_PUBLIC_SEEKERS_URL ?? 'http://localhost:3000'
  const redirectUrl = `${seekersBase}/cross-app?token=${encodeURIComponent(token)}`

  return NextResponse.json({ token, redirectUrl })
}
