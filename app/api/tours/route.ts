import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'

const querySchema = z.object({
  city:     z.string().optional(),
  country:  z.string().optional(),
  category: z.enum(['walking', 'cycling', 'private', 'group', 'event']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
})

const LIMIT = 12

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { city, country, category, page } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {
    $or: [{ isActive: true }, { isComingSoon: true }],
  }
  if (city)     filter.city = { $regex: city, $options: 'i' }
  if (country)  filter.country = { $regex: country, $options: 'i' }
  if (category) filter.category = category

  const [tours, total] = await Promise.all([
    Tour.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .select(
        'title slug city country coverImage shortDescription duration maxGuests languages price rating reviewsCount category isActive isFeatured isComingSoon host.name host.verified'
      )
      .lean(),
    Tour.countDocuments(filter),
  ])

  return NextResponse.json({
    tours,
    total,
    page,
    pages: Math.ceil(total / LIMIT),
  })
}
