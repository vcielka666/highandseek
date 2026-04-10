import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME ?? '',
  api_key:     process.env.CLOUDINARY_API_KEY ?? '',
  api_secret:  process.env.CLOUDINARY_API_SECRET ?? '',
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max file size is 5MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'highandseeek/marketplace', resource_type: 'image' },
        (err, result) => {
          if (err || !result) reject(err ?? new Error('Upload failed'))
          else resolve(result as { secure_url: string })
        },
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (err) {
    console.error('[cloudinary/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
