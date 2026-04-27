import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Post from '@/lib/db/models/Post'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { z } from 'zod'

const CreatePostSchema = z.object({
  type: z.enum(['photo', 'video', 'text', 'grow_update']),
  text: z.string().max(500).optional(),
  tags: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const formData = await req.formData()
  const type = formData.get('type') as string
  const textRaw = formData.get('text') as string | null
  const tagsRaw = formData.get('tags') as string | null
  const mediaFile = formData.get('media') as File | null

  const parsed = CreatePostSchema.safeParse({ type, text: textRaw ?? undefined, tags: tagsRaw ?? undefined })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : []

  let mediaUrl: string | undefined
  let mediaThumbnail: string | undefined
  let mediaType: 'image' | 'video' | null = null
  let mediaWidth: number | undefined
  let mediaHeight: number | undefined
  let duration: number | undefined

  if (mediaFile && mediaFile.size > 0) {
    if (mediaFile.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 100MB' }, { status: 400 })
    }

    const mimeType = mediaFile.type
    const isImage = mimeType.startsWith('image/')
    const isVideo = mimeType.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const cloudinary = (await import('cloudinary')).v2
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    if (isImage) {
      const buffer = Buffer.from(await mediaFile.arrayBuffer())
      const sharp = (await import('sharp')).default
      const stripped = await sharp(buffer).rotate().toBuffer()

      const uploadResult = await new Promise<{
        secure_url: string
        width: number
        height: number
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'highandseeek/feed/photos',
            transformation: [{ width: 1080, crop: 'limit', quality: 'auto', fetch_format: 'webp' }],
            resource_type: 'image',
          },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error('Upload failed'))
            resolve(result as { secure_url: string; width: number; height: number })
          },
        )
        stream.end(stripped)
      })

      mediaUrl = uploadResult.secure_url
      mediaType = 'image'
      mediaWidth = uploadResult.width
      mediaHeight = uploadResult.height
    } else {
      // Video: upload directly
      const buffer = Buffer.from(await mediaFile.arrayBuffer())

      const uploadResult = await new Promise<{
        secure_url: string
        duration?: number
        width?: number
        height?: number
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'highandseeek/feed/videos',
            resource_type: 'video',
            eager: [{ format: 'mp4' }],
          },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error('Upload failed'))
            resolve(result as { secure_url: string; duration?: number; width?: number; height?: number })
          },
        )
        stream.end(buffer)
      })

      mediaUrl = uploadResult.secure_url
      mediaType = 'video'
      duration = uploadResult.duration ? Math.round(uploadResult.duration) : undefined
      mediaWidth = uploadResult.width
      mediaHeight = uploadResult.height
    }
  }

  const XP_MAP: Record<string, string> = {
    text: 'POST_TEXT',
    photo: 'POST_PHOTO',
    video: 'POST_VIDEO',
    grow_update: 'POST_GROW_UPDATE',
  }

  const postType = parsed.data.type

  const post = await Post.create({
    userId: session.user.id,
    type: postType,
    content: {
      text: parsed.data.text,
      mediaUrl,
      mediaThumbnail,
      mediaType,
      mediaWidth,
      mediaHeight,
      duration,
    },
    tags,
    isPublic: true,
  })

  // Award XP
  const xpEvent = XP_MAP[postType] ?? 'POST_TEXT'
  const { xp } = await awardXP(session.user.id, xpEvent)
  await Post.findByIdAndUpdate(post._id, { xpAwarded: xp })

  // Increment postsCount
  await User.findByIdAndUpdate(session.user.id, { $inc: { postsCount: 1 } })

  return NextResponse.json({ post: { ...post.toObject(), _id: String(post._id) } }, { status: 201 })
}
