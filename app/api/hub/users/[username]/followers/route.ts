import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import mongoose from 'mongoose'

const PAGE_SIZE = 20

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ username: string }> },
) {
  await connectDB()

  const { username } = await props.params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const targetUser = await User.findOne({ username })
    .select('followers')
    .lean<{ _id: mongoose.Types.ObjectId; followers: mongoose.Types.ObjectId[] }>()

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const followerIds = targetUser.followers
  const total = followerIds.length
  const slice = followerIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const users = await User.find({ _id: { $in: slice } })
    .select('_id username avatar level')
    .lean<{ _id: mongoose.Types.ObjectId; username: string; avatar: string; level: number }[]>()

  return NextResponse.json({
    users: users.map(u => ({ _id: String(u._id), username: u.username, avatar: u.avatar, level: u.level })),
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  })
}
