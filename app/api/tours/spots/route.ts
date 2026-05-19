import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import CannabisSpot from '@/lib/db/models/CannabisSpot'

const querySchema = z.object({
  city:    z.string().optional(),
  country: z.string().optional(),
  type:    z
    .enum(['cbd_shop', 'smoke_friendly', 'cannabis_club', 'grow_shop', 'cafe', 'event_space'])
    .optional(),
})

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { city, country, type } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = { isActive: true }
  if (city)    filter.city    = { $regex: city,    $options: 'i' }
  if (country) filter.country = { $regex: country, $options: 'i' }
  if (type)    filter.type    = type

  const spots = await CannabisSpot.find(filter)
    .select('-addedBy')
    .sort({ featured: -1, createdAt: -1 })
    .lean()

  return NextResponse.json({ spots })
}
