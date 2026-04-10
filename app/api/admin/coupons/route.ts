import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Coupon from '@/lib/db/models/Coupon'

async function requireAdmin() {
  const session = await auth()
  if (!session) return null
  if (session.user.role !== 'admin') return null
  return session
}

const CreateSchema = z.object({
  code:      z.string().min(2).max(30).transform(s => s.toUpperCase().trim()),
  discount:  z.number().int().min(1).max(100),
  maxUsage:  z.number().int().min(0).default(0),
  expiresAt: z.string().datetime().optional().nullable(),
  note:      z.string().max(200).default(''),
})

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  await connectDB()

  const exists = await Coupon.findOne({ code: parsed.data.code })
  if (exists) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })

  const coupon = await Coupon.create({
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  })
  return NextResponse.json({ coupon }, { status: 201 })
}
