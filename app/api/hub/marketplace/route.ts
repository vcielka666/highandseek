import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import { spendCredits, CREDIT_COSTS } from '@/lib/credits/index'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['equipment', 'clones', 'seeds', 'nutrients', 'art', 'other'] as const
const PAGE_SIZE = 20

const CreateSchema = z.object({
  title:       z.string().min(3).max(80),
  description: z.string().min(10).max(500),
  category:    z.enum(CATEGORIES),
  price:       z.number().min(0),
  location:    z.string().max(80).optional(),
  contact: z.object({
    telegram: z.string().max(80).optional(),
    signal:   z.string().max(40).optional(),
    threema:  z.string().max(40).optional(),
    email:    z.string().email().max(120).optional(),
  }).refine(
    c => !!(c.telegram || c.signal || c.threema || c.email),
    { message: 'At least one contact method required' },
  ),
  images: z.array(z.string().url()).max(3).default([]),
})

// ── GET — public browse ──────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  await connectDB()

  // Auto-expire on read
  await Listing.updateMany(
    { status: 'active', expiresAt: { $lt: new Date() } },
    { $set: { status: 'expired' } },
  )

  const filter: Record<string, unknown> = { status: 'active' }
  if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    filter.category = category
  }

  type ListingLean = {
    _id: { toString(): string }
    userId: { toString(): string }
    title: string; description: string; category: string; price: number
    location?: string; images: string[]
    contact: { telegram?: string; signal?: string; threema?: string }
    status: string; expiresAt: Date; createdAt: Date
  }

  const [listingsRaw, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<ListingLean[]>(),
    Listing.countDocuments(filter),
  ])

  // Populate user info manually
  const userIds = [...new Set(listingsRaw.map(l => l.userId.toString()))]
  const users = await User.find({ _id: { $in: userIds } })
    .select('username avatar')
    .lean<{ _id: { toString(): string }; username: string; avatar: string }[]>()
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  const session = await auth()
  const isLoggedIn = !!session

  const result = listingsRaw.map(l => ({
    _id:         l._id.toString(),
    title:       l.title,
    description: l.description,
    category:    l.category,
    price:       l.price,
    location:    l.location,
    images:      l.images,
    status:      l.status,
    expiresAt:   l.expiresAt,
    createdAt:   l.createdAt,
    postedBy:    userMap.get(l.userId.toString()) ?? { username: 'unknown', avatar: '' },
    contact:     isLoggedIn ? l.contact : undefined,
  }))

  return NextResponse.json({ listings: result, total, page, pages: Math.ceil(total / PAGE_SIZE) })
}

// ── POST — create listing ────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
  }

  const { title, description, category, price, location, contact, images } = parsed.data

  await connectDB()

  // First listing is free; subsequent listings cost MARKETPLACE_POST credits
  const existingCount = await Listing.countDocuments({ userId: session.user.id, status: { $ne: 'removed' } })
  const cost = existingCount === 0 ? 0 : CREDIT_COSTS.MARKETPLACE_POST

  if (cost > 0) {
    const userDoc = await User.findById(session.user.id).select('credits').lean<{ credits?: number }>()
    const credits = userDoc?.credits ?? 0
    if (credits < cost) {
      return NextResponse.json(
        { error: `Insufficient credits — need ${cost}, have ${credits}` },
        { status: 402 },
      )
    }
    await spendCredits(session.user.id, cost, `Marketplace listing: ${title}`)
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const listing = await Listing.create({
    userId:      session.user.id,
    title, description, category, price, location, contact, images,
    status:      'active',
    creditsCost: cost,
    expiresAt,
  })

  return NextResponse.json({ listing: { _id: listing._id.toString(), ...listing.toObject() } }, { status: 201 })
}
