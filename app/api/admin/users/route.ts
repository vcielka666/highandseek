import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Order from '@/lib/db/models/Order'

const querySchema = z.object({
  search: z.string().optional(),
  role:   z.enum(['all', 'admin', 'user']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { search, role, page, limit } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ]
  }
  if (role && role !== 'all') filter.role = role

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  // Attach order counts
  const userIds = users.map((u) => u._id)
  const orderCounts = await Order.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ])
  const countMap = new Map(orderCounts.map((o) => [String(o._id), o.count]))

  const enriched = users.map((u) => ({
    ...u,
    orderCount: countMap.get(String(u._id)) ?? 0,
  }))

  return NextResponse.json({ users: enriched, total, page, limit })
}
