import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import TourBooking from '@/lib/db/models/TourBooking'

const querySchema = z.object({
  tourId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'all']).default('all'),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(1000).default(20),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { tourId, status, page, limit } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (tourId)            filter.tourId = tourId
  if (status !== 'all')  filter.status = status

  const [bookings, total] = await Promise.all([
    TourBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('tourId', 'title slug')
      .lean(),
    TourBooking.countDocuments(filter),
  ])

  return NextResponse.json({
    bookings,
    total,
    pages: Math.ceil(total / limit),
  })
}
