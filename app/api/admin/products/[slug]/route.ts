import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'

const patchSchema = z.object({
  name:             z.string().min(1).optional(),
  slug:             z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  category:         z.enum(['seed', 'clone', 'flower', 'merch']).optional(),
  description:      z.string().optional(),
  shortDescription: z.string().max(100).optional(),
  price:            z.number().min(0).optional(),
  stock:            z.number().int().min(0).optional(),
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
    thc:           z.string().optional(),
    cbd:           z.string().optional(),
    cbn:           z.string().optional(),
  }).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  await connectDB()

  const product = await Product.findOne({ slug }).lean()
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const product = await Product.findOneAndUpdate(
    { slug },
    { $set: parsed.data },
    { new: true }
  ).lean()

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  await connectDB()

  const product = await Product.findOneAndDelete({ slug })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
