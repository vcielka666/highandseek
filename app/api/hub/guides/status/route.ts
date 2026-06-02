import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.user.id)
    .select('tourGuideStatus platformCommission tourGuideInfo')
    .lean<{ tourGuideStatus?: string; platformCommission?: number; tourGuideInfo?: unknown }>()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    tourGuideStatus:    user.tourGuideStatus ?? 'none',
    platformCommission: user.platformCommission ?? 20,
    tourGuideInfo:      user.tourGuideInfo ?? {},
  })
}
