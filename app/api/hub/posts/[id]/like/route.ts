import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import { awardXP } from '@/lib/xp'
import mongoose from 'mongoose'

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const post = await Post.findById(id).select('userId likes dislikes likesCount dislikesCount isDeleted')
  if (!post || post.isDeleted) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const currentUserId = new mongoose.Types.ObjectId(session.user.id)
  const alreadyLiked = post.likes.some(lid => String(lid) === session.user.id)
  const alreadyDisliked = post.dislikes.some(did => String(did) === session.user.id)

  if (alreadyLiked) {
    // Remove like (toggle off)
    await Post.findByIdAndUpdate(id, {
      $pull: { likes: currentUserId },
      $inc: { likesCount: -1 },
    })
    const updated = await Post.findById(id).select('likesCount')
    return NextResponse.json({ liked: false, likesCount: updated?.likesCount ?? 0 })
  }

  // Build update
  const update: Record<string, unknown> = {
    $addToSet: { likes: currentUserId },
    $inc: { likesCount: 1 },
  }

  if (alreadyDisliked) {
    // Remove dislike when liking
    ;(update.$pull as Record<string, unknown>) = { dislikes: currentUserId }
    ;(update.$inc as Record<string, unknown>).dislikesCount = -1
  }

  await Post.findByIdAndUpdate(id, update)

  // Award XP to post owner if it's not the current user liking their own post
  const postOwnerId = String(post.userId)
  if (postOwnerId !== session.user.id) {
    await awardXP(postOwnerId, 'POST_LIKED', 3)
  }

  const updated = await Post.findById(id).select('likesCount')
  return NextResponse.json({ liked: true, likesCount: updated?.likesCount ?? 0 })
}
