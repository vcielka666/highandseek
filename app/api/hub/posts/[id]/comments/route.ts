import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import Comment from '@/lib/db/models/Comment'
import { awardXP } from '@/lib/xp'
import mongoose from 'mongoose'
import { z } from 'zod'

const DEFAULT_LIMIT = 20

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  await connectDB()

  const { id } = await props.params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10), 50)

  const session = await auth()
  const currentUserId = session?.user?.id ?? null

  const filter: Record<string, unknown> = {
    postId: new mongoose.Types.ObjectId(id),
    isDeleted: false,
  }

  if (cursor) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) }
  }

  const rawComments = await Comment.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('userId', 'username avatar level')
    .lean<Array<{
      _id: mongoose.Types.ObjectId
      postId: mongoose.Types.ObjectId
      userId: { _id: mongoose.Types.ObjectId; username: string; avatar: string; level: number }
      text: string
      likes: mongoose.Types.ObjectId[]
      likesCount: number
      createdAt: Date
    }>>()

  const hasMore = rawComments.length > limit
  const comments = hasMore ? rawComments.slice(0, limit) : rawComments
  const nextCursor = hasMore ? String(comments[comments.length - 1]._id) : null

  const shaped = comments.map(c => ({
    _id: String(c._id),
    postId: String(c.postId),
    text: c.text,
    likesCount: c.likesCount,
    isLiked: currentUserId ? c.likes.some(lid => String(lid) === currentUserId) : false,
    createdAt: c.createdAt.toISOString(),
    user: {
      _id: String(c.userId._id),
      username: c.userId.username,
      avatar: c.userId.avatar,
      level: c.userId.level,
    },
  }))

  return NextResponse.json({ comments: shaped, nextCursor })
}

const CreateCommentSchema = z.object({
  text: z.string().min(1).max(300),
})

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const post = await Post.findById(id).select('isDeleted commentsCount')
  if (!post || post.isDeleted) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const body = await req.json() as unknown
  const parsed = CreateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const comment = await Comment.create({
    postId: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
    text: parsed.data.text,
  })

  await Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } })
  await awardXP(session.user.id, 'POST_COMMENT', 5)

  // Populate user for response
  const populated = await Comment.findById(comment._id)
    .populate('userId', 'username avatar level')
    .lean<{
      _id: mongoose.Types.ObjectId
      postId: mongoose.Types.ObjectId
      userId: { _id: mongoose.Types.ObjectId; username: string; avatar: string; level: number }
      text: string
      likesCount: number
      createdAt: Date
    }>()

  if (!populated) {
    return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 })
  }

  return NextResponse.json({
    comment: {
      _id: String(populated._id),
      postId: String(populated.postId),
      text: populated.text,
      likesCount: populated.likesCount,
      isLiked: false,
      createdAt: populated.createdAt.toISOString(),
      user: {
        _id: String(populated.userId._id),
        username: populated.userId.username,
        avatar: populated.userId.avatar,
        level: populated.userId.level,
      },
    },
  }, { status: 201 })
}
