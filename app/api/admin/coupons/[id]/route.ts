import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Coupon from '@/lib/db/models/Coupon'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  await connectDB()
  const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true })
  if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ coupon })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await connectDB()
  await Coupon.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
