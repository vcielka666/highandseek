import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json() as { password?: unknown }
  const password = body.password

  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const hash = process.env.MYSTERY_BOX_PASSWORD_HASH
  if (!hash) {
    return NextResponse.json({ success: false }, { status: 500 })
  }

  const isValid = await bcrypt.compare(password, hash)
  return NextResponse.json({ success: isValid })
}
