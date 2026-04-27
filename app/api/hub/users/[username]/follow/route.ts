import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import mongoose from 'mongoose'

export async function POST(
  _req: Request,
  props: { params: Promise<{ username: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await props.params

  await connectDB()

  const targetUser = await User.findOne({ username })
    .select('_id followers followersCount')
    .lean<{ _id: mongoose.Types.ObjectId; followers: mongoose.Types.ObjectId[]; followersCount: number }>()

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const targetId = String(targetUser._id)

  if (targetId === session.user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const currentUserId = new mongoose.Types.ObjectId(session.user.id)
  const targetObjectId = new mongoose.Types.ObjectId(targetId)

  const isFollowing = targetUser.followers.some(fid => String(fid) === session.user.id)

  if (isFollowing) {
    // Unfollow
    await User.findByIdAndUpdate(targetId, {
      $pull: { followers: currentUserId },
      $inc: { followersCount: -1 },
    })
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { following: targetObjectId },
      $inc: { followingCount: -1 },
    })

    const updated = await User.findById(targetId).select('followersCount').lean<{ followersCount: number }>()
    return NextResponse.json({ following: false, followersCount: updated?.followersCount ?? 0 })
  }

  // Follow
  await User.findByIdAndUpdate(targetId, {
    $addToSet: { followers: currentUserId },
    $inc: { followersCount: 1 },
  })
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { following: targetObjectId },
    $inc: { followingCount: 1 },
  })

  // XP milestones for target
  const newFollowersCount = (targetUser.followersCount ?? targetUser.followers.length) + 1

  if (newFollowersCount === 1) {
    await awardXP(targetId, 'FIRST_FOLLOWER', 20)
  } else if (newFollowersCount === 10) {
    await awardXP(targetId, 'FOLLOW_MILESTONE_10', 50)
  } else if (newFollowersCount === 100) {
    await awardXP(targetId, 'FOLLOW_MILESTONE_100', 200)
  }

  const updated = await User.findById(targetId).select('followersCount').lean<{ followersCount: number }>()
  return NextResponse.json({ following: true, followersCount: updated?.followersCount ?? 0 })
}
