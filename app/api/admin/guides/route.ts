import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (status === 'all') {
    filter.tourGuideStatus = { $ne: 'none' }
  } else {
    filter.tourGuideStatus = status
  }

  const guides = await User.find(filter)
    .select('username email avatar tourGuideStatus tourGuideAppliedAt tourGuideApprovedAt platformCommission tourGuideInfo createdAt')
    .sort({ tourGuideAppliedAt: -1 })
    .lean()

  return NextResponse.json({ guides })
}
