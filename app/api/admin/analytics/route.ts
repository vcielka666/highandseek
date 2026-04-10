import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  await connectDB()

  const now   = new Date()
  const start = parsed.data.dateFrom
    ? new Date(parsed.data.dateFrom)
    : new Date(now.getTime() - parsed.data.days * 86400000)
  const end = parsed.data.dateTo ? new Date(parsed.data.dateTo) : now

  const [
    totalUsers,
    totalOrders,
    revenueAgg,
    periodUsers,
    periodRevenueAgg,
    revenueOverTime,
    registrationsOverTime,
    ordersOverTime,
    revenueByCategory,
    topProducts,
    topCountries,
  ] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$product.category', 'unknown'] }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.name' }, units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { units: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$shippingAddress.country', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
    ]),
  ])

  const totalRevenue   = revenueAgg[0]?.total ?? 0
  const totalOrdersAll = revenueAgg[0]?.count ?? 0
  const avgOrderValue  = totalOrdersAll > 0 ? totalRevenue / totalOrdersAll : 0
  const periodRevenue  = periodRevenueAgg[0]?.total ?? 0

  return NextResponse.json({
    stats: { totalUsers, totalOrders, totalRevenue, avgOrderValue, periodRevenue, periodUsers },
    revenueOverTime,
    registrationsOverTime,
    ordersOverTime,
    revenueByCategory,
    topProducts,
    topCountries,
  })
}
