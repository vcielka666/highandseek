import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 10

  await connectDB()

  const [grows, total] = await Promise.all([
    VirtualGrow.find({
      userId: session.user.id,
      status: { $in: ['completed', 'failed', 'abandoned'] },
    })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('strainName strainType stage currentDay health yieldProjection harvestData status xpEarned createdAt updatedAt')
      .lean(),
    VirtualGrow.countDocuments({
      userId: session.user.id,
      status: { $in: ['completed', 'failed', 'abandoned'] },
    }),
  ])

  return NextResponse.json({ grows, total, page, pages: Math.ceil(total / limit) })
}
