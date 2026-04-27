import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import mongoose from 'mongoose'
import { z } from 'zod'

const GrowUpdateSchema = z.object({
  growId:     z.string().optional(),
  day:        z.number().int().min(1),
  stage:      z.string().min(1),
  health:     z.number().min(0).max(100),
  strainName: z.string().min(1),
  metrics: z.object({
    temperature: z.number().optional(),
    humidity:    z.number().optional(),
    ph:          z.number().optional(),
  }).optional(),
  mediaUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const body = await req.json() as unknown
  const parsed = GrowUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { growId, day, stage, health, strainName, metrics, mediaUrl } = parsed.data

  const post = await Post.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    type: 'grow_update',
    content: {
      mediaUrl,
      mediaType: mediaUrl ? 'image' : null,
    },
    growUpdate: {
      growId: growId ? new mongoose.Types.ObjectId(growId) : undefined,
      day,
      stage,
      health,
      strainName,
      metrics: metrics ?? {},
    },
    isPublic: true,
  })

  await awardXP(session.user.id, 'POST_GROW_UPDATE', 15)
  await User.findByIdAndUpdate(session.user.id, { $inc: { postsCount: 1 } })

  return NextResponse.json({ post: { ...post.toObject(), _id: String(post._id) } }, { status: 201 })
}
