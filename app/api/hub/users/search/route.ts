import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function GET(req: NextRequest) {
  const session = await auth()
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ users: [] })
  }

  await connectDB()

  const regex = new RegExp(q, 'i')
  const rawUsers = await User.find({ username: regex })
    .select('username avatar level followersCount followers')
    .limit(10)
    .lean<Array<{
      _id: { toString(): string }
      username: string
      avatar?: string
      level?: number
      followersCount?: number
      followers?: { toString(): string }[]
    }>>()

  const users = rawUsers
    .filter(u => u._id.toString() !== session?.user.id)
    .map(u => ({
      username: u.username,
      avatar: u.avatar ?? '',
      level: u.level ?? 1,
      followersCount: u.followersCount ?? (u.followers ?? []).length,
      isFollowing: session
        ? (u.followers ?? []).some(fid => String(fid) === session.user.id)
        : false,
    }))

  return NextResponse.json({ users })
}
