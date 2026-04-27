import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import User from '@/lib/db/models/User'
import mongoose from 'mongoose'

const DEFAULT_LIMIT = 10

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10), 50)

  const currentUserId = new mongoose.Types.ObjectId(session.user.id)

  // Fetch current user's following list
  const userDoc = await User.findById(session.user.id)
    .select('following')
    .lean<{ following: mongoose.Types.ObjectId[] }>()

  const followingIds = userDoc?.following ?? []
  const isPersonalized = followingIds.length > 0

  // Build query
  const authorIds = isPersonalized
    ? [...followingIds, currentUserId]
    : null

  const baseFilter: Record<string, unknown> = {
    isDeleted: false,
  }

  if (authorIds) {
    baseFilter.userId = { $in: authorIds }
    baseFilter.$or = [{ isPublic: true }, { userId: currentUserId }]
  } else {
    // Fallback: popular posts from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    baseFilter.isPublic = true
    baseFilter.createdAt = { $gte: sevenDaysAgo }
  }

  if (cursor) {
    baseFilter._id = { $lt: new mongoose.Types.ObjectId(cursor) }
  }

  const rawPosts = await Post.find(baseFilter)
    .sort(isPersonalized ? { _id: -1 } : { likesCount: -1, _id: -1 })
    .limit(limit + 1)
    .populate('userId', 'username avatar level')
    .lean<Array<{
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
      createdAt: Date
    }>>()

  const hasMore = rawPosts.length > limit
  const posts = hasMore ? rawPosts.slice(0, limit) : rawPosts
  const nextCursor = hasMore ? String(posts[posts.length - 1]._id) : null

  const currentUserIdStr = session.user.id

  const shaped = posts.map(p => ({
    _id: String(p._id),
    type: p.type,
    content: p.content,
    growUpdate: p.growUpdate,
    tags: p.tags,
    likesCount: p.likesCount,
    dislikesCount: p.dislikesCount,
    commentsCount: p.commentsCount,
    isLiked: p.likes.some(id => String(id) === currentUserIdStr),
    isDisliked: p.dislikes.some(id => String(id) === currentUserIdStr),
    createdAt: p.createdAt.toISOString(),
    user: {
      _id: String(p.userId._id),
      username: p.userId.username,
      avatar: p.userId.avatar,
      level: p.userId.level,
    },
  }))

  return NextResponse.json({ posts: shaped, nextCursor, isPersonalized })
}
