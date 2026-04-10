import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'

const productSchema = z.object({
  name:             z.string().min(1),
  slug:             z.string().min(1).regex(/^[a-z0-9-]+$/),
  category:         z.enum(['seed', 'clone', 'flower', 'merch']),
  description:      z.string().min(1),
  shortDescription: z.string().max(100),
  price:            z.number().min(0),
  stock:            z.number().int().min(0),
  isAvailable:      z.boolean().optional(),
  isFeatured:       z.boolean().optional(),
  images:           z.array(z.string()).optional(),
  tags:             z.array(z.string()).optional(),
  variants:         z.array(z.object({ label: z.string(), price: z.number().min(0) })).optional(),
  strain: z.object({
    type:          z.enum(['indica', 'sativa', 'hybrid']).nullable().optional(),
    genetics:      z.string().optional(),
    origin:        z.enum(['usa', 'european', 'landrace']).nullable().optional(),
    floweringTime: z.number().nullable().optional(),
    yield:         z.enum(['low', 'medium', 'high']).nullable().optional(),
    difficulty:    z.enum(['easy', 'medium', 'hard']).nullable().optional(),
    seedType:      z.enum(['feminized', 'autoflower', 'regular']).nullable().optional(),
    climate:       z.enum(['indoor', 'outdoor', 'both']).nullable().optional(),
    terpenes:      z.string().optional(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const search   = req.nextUrl.searchParams.get('search') ?? ''
  const category = req.nextUrl.searchParams.get('category') ?? ''

  const filter: Record<string, unknown> = {}
  if (search)   filter.name = { $regex: search, $options: 'i' }
  if (category) filter.category = category

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const existing = await Product.findOne({ slug: parsed.data.slug })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }

  const product = await Product.create(parsed.data)
  return NextResponse.json({ product }, { status: 201 })
}
