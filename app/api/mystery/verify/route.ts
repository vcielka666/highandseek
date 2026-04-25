import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const COOKIE = 'flower_access'
const COOKIE_VAL = 'granted'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(req: Request) {
  const body = await req.json() as { password?: unknown }
  const password = body.password

  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const hashB64 = process.env.MYSTERY_BOX_PASSWORD_HASH
  if (!hashB64) {
    return NextResponse.json({ success: false }, { status: 500 })
  }

  const hash = Buffer.from(hashB64, 'base64').toString('utf8')
  const isValid = await bcrypt.compare(password, hash)

  if (!isValid) return NextResponse.json({ success: false })

  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, COOKIE_VAL, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
