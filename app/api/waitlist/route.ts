import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import Waitlist from '@/lib/db/models/Waitlist'

const Schema = z.object({
  email:  z.string().email(),
  source: z.string().min(1).max(32).default('tours'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  await connectDB()
  try {
    await Waitlist.create(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    // Duplicate key = already registered
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
