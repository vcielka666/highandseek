import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function GET(
  _req: Request,
  props: { params: Promise<{ username: string }> },
) {
  const session = await auth()
  const { username } = await props.params

  await connectDB()

  const user = await User.findOne({ username })
    .select('username avatar level bio followersCount followingCount postsCount followers')
    .lean<{
      _id: { toString(): string }
      username: string
      avatar: string
      level: number
      bio?: string
      followersCount: number
      followingCount: number
      postsCount: number
      followers: { toString(): string }[]
    }>()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isFollowing = session
    ? (user.followers ?? []).some(fid => String(fid) === session.user.id)
    : false

  const isOwnProfile = session?.user.id === user._id.toString()

  return NextResponse.json({
    username: user.username,
    avatar: user.avatar ?? '',
    level: user.level ?? 1,
    bio: user.bio ?? '',
    followersCount: user.followersCount ?? (user.followers ?? []).length,
    followingCount: user.followingCount ?? 0,
    postsCount: user.postsCount ?? 0,
    isFollowing,
    isOwnProfile,
  })
}
