import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import { awardXP } from '@/lib/xp'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  const formData = await req.formData()
  const photo         = formData.get('photo') as File | null
  const temperature   = formData.get('temperature') ? Number(formData.get('temperature')) : null
  const humidity      = formData.get('humidity')    ? Number(formData.get('humidity'))    : null
  const ph            = formData.get('ph')          ? Number(formData.get('ph'))          : null
  const ec            = formData.get('ec')          ? Number(formData.get('ec'))          : null
  const waterAmount   = formData.get('waterAmount') ? Number(formData.get('waterAmount')) : null
  const nutrients     = formData.get('nutrients')   ? String(formData.get('nutrients')).split(',').filter(Boolean) : []
  const techniques    = formData.get('techniques')  ? String(formData.get('techniques')).split(',').filter(Boolean) : []
  const notes         = formData.get('notes')       ? String(formData.get('notes')).slice(0, 500) : ''
  const mood          = (formData.get('mood') as string | null) ?? 'good'

  if (!['great', 'good', 'okay', 'bad'].includes(mood)) {
    return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
  }

  let photoUrl    = ''
  let exifStripped = false

  // ── Photo upload with EXIF stripping ──────────────────────────────────────
  if (photo && photo.size > 0) {
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo must be under 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await photo.arrayBuffer())

    // EXIF strip — non-negotiable
    const sharp = (await import('sharp')).default
    const stripped = await sharp(buffer).rotate().toBuffer()
    exifStripped = true

    // Upload to Cloudinary
    const cloudinary = (await import('cloudinary')).v2
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'highandseeek/grow-journals', resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Upload failed'))
          resolve(result)
        },
      )
      stream.end(stripped)
    })

    photoUrl = uploadResult.secure_url
  }

  // ── XP calculation ─────────────────────────────────────────────────────────
  let xp = 15  // base
  if (photoUrl)                    xp += 20
  if (temperature && humidity)     xp += 10
  if (ph)                          xp += 10
  if (notes && notes.length > 50)  xp += 15

  await awardXP(session.user.id, 'JOURNAL_ENTRY', xp)
  grow.xpEarned += xp

  grow.journalEntries.push({
    day:         grow.currentDay,
    date:        new Date(),
    stage:       grow.stage,
    photoUrl,
    temperature,
    humidity,
    ph,
    ec,
    waterAmount,
    nutrients,
    techniques,
    notes,
    mood:        mood as 'great' | 'good' | 'okay' | 'bad',
    xpEarned:    xp,
  })

  await grow.save()

  return NextResponse.json({
    entry: grow.journalEntries[grow.journalEntries.length - 1],
    xpEarned: xp,
    exifStripped,
    message: exifStripped ? '🔒 GPS metadata removed from photo' : undefined,
  })
}
