import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(24).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    await connectDB()

    const existing = await User.findOne({
      $or: [
        { email:    parsed.data.email.toLowerCase() },
        { username: parsed.data.username },
      ],
    })

    if (existing) {
      const field = existing.email === parsed.data.email.toLowerCase() ? 'Email' : 'Username'
      return NextResponse.json({ error: `${field} already taken` }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    await User.create({
      email:    parsed.data.email.toLowerCase(),
      passwordHash,
      username: parsed.data.username,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
