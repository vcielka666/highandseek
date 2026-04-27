import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Comment from '@/lib/db/models/Comment'
import Post from '@/lib/db/models/Post'

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const comment = await Comment.findById(id).select('userId postId isDeleted')
  if (!comment || comment.isDeleted) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  const isOwner = String(comment.userId) === session.user.id
  const isAdmin = session.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await Comment.findByIdAndUpdate(id, { isDeleted: true })
  await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } })

  return NextResponse.json({ success: true })
}
