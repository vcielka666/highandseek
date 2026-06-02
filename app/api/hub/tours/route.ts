import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Tour from '@/lib/db/models/Tour'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

const tourSchema = z.object({
  title:            z.string().min(5).max(100),
  city:             z.string().min(2).max(60),
  country:          z.string().min(2).max(4),
  shortDescription: z.string().min(20).max(150),
  description:      z.string().min(50).max(2000),
  duration:         z.number().int().min(30).max(480),
  maxGuests:        z.number().int().min(1).max(20),
  languages:        z.array(z.string()).min(1),
  category:         z.enum(['walking', 'cycling', 'private', 'group', 'event']),
  priceEur:         z.number().min(0),
  priceCzk:         z.number().min(0),
  priceCredits:     z.number().min(0),
  meetingAddress:   z.string().min(5).max(200),
  meetingLat:       z.number().optional(),
  meetingLng:       z.number().optional(),
  meetingDesc:      z.string().max(200).optional(),
  included:         z.array(z.string()).optional(),
  notIncluded:      z.array(z.string()).optional(),
  requirements:     z.array(z.string()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const user = await User.findById(session.user.id).select('tourGuideStatus platformCommission').lean()
  if (!user || user.tourGuideStatus !== 'approved') {
    return NextResponse.json({ error: 'Not an approved guide' }, { status: 403 })
  }

  const tours = await Tour.find({ 'host.userId': session.user.id })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ tours })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const user = await User.findById(session.user.id)
    .select('tourGuideStatus username avatar tourGuideInfo platformCommission')
    .lean()
  if (!user || user.tourGuideStatus !== 'approved') {
    return NextResponse.json({ error: 'Not an approved guide' }, { status: 403 })
  }

  const raw = await req.json()
  const parsed = tourSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data

  let baseSlug = slugify(d.title)
  let slug = baseSlug
  let suffix = 1
  while (await Tour.exists({ slug })) {
    slug = `${baseSlug}-${suffix}`
    suffix++
  }

  const tour = await Tour.create({
    title: d.title,
    slug,
    city: d.city,
    country: d.country,
    shortDescription: d.shortDescription,
    description: d.description,
    duration: d.duration,
    maxGuests: d.maxGuests,
    languages: d.languages,
    category: d.category,
    price: { eur: d.priceEur, czk: d.priceCzk, credits: d.priceCredits },
    meetingPoint: {
      address: d.meetingAddress,
      lat: d.meetingLat ?? 0,
      lng: d.meetingLng ?? 0,
      description: d.meetingDesc ?? '',
    },
    host: {
      userId: session.user.id,
      name: (user.displayName as string | undefined) || user.username,
      avatar: (user.avatar as string | undefined) || '',
      bio: (user.tourGuideInfo as { bio?: string } | undefined)?.bio ?? '',
      verified: true,
    },
    included: d.included ?? [],
    notIncluded: d.notIncluded ?? [],
    requirements: d.requirements ?? [],
    isActive: true,
    isComingSoon: false,
    isFeatured: false,
    stops: [],
    images: [],
  })

  return NextResponse.json({ tour }, { status: 201 })
}
