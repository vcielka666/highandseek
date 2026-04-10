import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Coupon from '@/lib/db/models/Coupon'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  await connectDB()

  const coupon = await Coupon.findOne({ code, isActive: true }).lean<{
    code: string; discount: number; maxUsage: number; usageCount: number; expiresAt: Date | null
  }>()

  if (!coupon) return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 })

  // Check expiry
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 410 })
  }

  // Check usage limit
  if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 410 })
  }

  return NextResponse.json({ code: coupon.code, discount: coupon.discount })
}
