import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'

const querySchema = z.object({
  status:   z.enum(['pending', 'paid', 'shipped', 'delivered', 'all']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  search:   z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { status, page, limit, search, dateFrom, dateTo } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (status && status !== 'all') filter.status = status
  if (search) {
    filter.$or = [
      { customerEmail: { $regex: search, $options: 'i' } },
      { _id: search.length === 24 ? search : undefined },
    ]
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo)   (filter.createdAt as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  return NextResponse.json({ orders, total, page, limit })
}
