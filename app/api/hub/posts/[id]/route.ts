import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import mongoose from 'mongoose'

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const { id } = await props.params

  await connectDB()

  const raw = await Post.findOne({ _id: id, isDeleted: false })
    .populate('userId', 'username avatar level')
    .lean<{
      _id: mongoose.Types.ObjectId
      userId: { _id: mongoose.Types.ObjectId; username: string; avatar: string; level: number }
      type: string
      content: { text?: string; mediaUrl?: string; mediaThumbnail?: string; mediaType: string | null; mediaWidth?: number; mediaHeight?: number; duration?: number }
      growUpdate?: { day: number; stage: string; health: number; strainName: string; metrics: { temperature?: number; humidity?: number; ph?: number } }
      tags: string[]
      likes: mongoose.Types.ObjectId[]
      dislikes: mongoose.Types.ObjectId[]
      likesCount: number
      dislikesCount: number
      commentsCount: number
      isPublic: boolean
      createdAt: Date
    }>()

  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!raw.isPublic && (!session || String(raw.userId._id) !== session.user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const currentUserId = session?.user.id ?? ''
  const post = {
    _id: String(raw._id),
    type: raw.type,
    content: raw.content,
    growUpdate: raw.growUpdate,
    tags: raw.tags,
    likesCount: raw.likesCount,
    dislikesCount: raw.dislikesCount,
    commentsCount: raw.commentsCount,
    isLiked: raw.likes.some(id => String(id) === currentUserId),
    isDisliked: raw.dislikes.some(id => String(id) === currentUserId),
    createdAt: raw.createdAt.toISOString(),
    user: {
      _id: String(raw.userId._id),
      username: raw.userId.username,
      avatar: raw.userId.avatar,
      level: raw.userId.level,
    },
  }

  return NextResponse.json({ post })
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const post = await Post.findById(id).select('userId isDeleted')
  if (!post || post.isDeleted) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const isOwner = String(post.userId) === session.user.id
  const isAdmin = session.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await Post.findByIdAndUpdate(id, { isDeleted: true })

  return NextResponse.json({ success: true })
}
