import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import mongoose from 'mongoose'

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const post = await Post.findById(id).select('dislikes likes dislikesCount likesCount isDeleted')
  if (!post || post.isDeleted) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const currentUserId = new mongoose.Types.ObjectId(session.user.id)
  const alreadyDisliked = post.dislikes.some(did => String(did) === session.user.id)
  const alreadyLiked = post.likes.some(lid => String(lid) === session.user.id)

  if (alreadyDisliked) {
    // Toggle off
    await Post.findByIdAndUpdate(id, {
      $pull: { dislikes: currentUserId },
      $inc: { dislikesCount: -1 },
    })
    const updated = await Post.findById(id).select('dislikesCount')
    return NextResponse.json({ disliked: false, dislikesCount: updated?.dislikesCount ?? 0 })
  }

  const update: Record<string, unknown> = {
    $addToSet: { dislikes: currentUserId },
    $inc: { dislikesCount: 1 },
  }

  if (alreadyLiked) {
    ;(update.$pull as Record<string, unknown>) = { likes: currentUserId }
    ;(update.$inc as Record<string, unknown>).likesCount = -1
  }

  await Post.findByIdAndUpdate(id, update)

  const updated = await Post.findById(id).select('dislikesCount')
  return NextResponse.json({ disliked: true, dislikesCount: updated?.dislikesCount ?? 0 })
}
