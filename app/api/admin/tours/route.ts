import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'

const querySchema = z.object({
  city:   z.string().optional(),
  status: z.enum(['active', 'inactive', 'coming_soon', 'all']).default('all'),
})

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { city, status } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (city) filter.city = { $regex: city, $options: 'i' }
  if (status === 'active')      filter.isActive = true
  if (status === 'inactive')    { filter.isActive = false; filter.isComingSoon = false }
  if (status === 'coming_soon') filter.isComingSoon = true

  const tours = await Tour.find(filter).sort({ createdAt: -1 }).lean()

  return NextResponse.json({ tours })
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const raw = await req.json()
  if (!raw || typeof raw.title !== 'string' || !raw.title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  await connectDB()

  // Auto-generate unique slug
  let baseSlug = slugify(raw.title)
  let slug = baseSlug
  let suffix = 1
  while (await Tour.exists({ slug })) {
    slug = `${baseSlug}-${suffix}`
    suffix++
  }

  try {
    const tour = await Tour.create({ ...raw, slug })
    return NextResponse.json({ tour }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create tour'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
