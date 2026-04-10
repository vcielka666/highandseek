import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const now      = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday  = new Date(todayStart.getTime() - 86400000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(monthStart.getTime() - 1)
  const weekStart  = new Date(todayStart.getTime() - 7 * 86400000)
  const lastWeekStart = new Date(todayStart.getTime() - 14 * 86400000)

  // 30-day revenue chart
  const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * 86400000)
  const revenueData = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$totalAmount' },
    }},
    { $sort: { _id: 1 } },
  ])

  const [
    revenueThisMonth,
    revenueLastMonth,
    ordersToday,
    ordersYesterday,
    usersThisWeek,
    usersLastWeek,
    recentOrders,
    recentUsers,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.countDocuments({ createdAt: { $gte: yesterday, $lt: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    User.find({}).select('-passwordHash').sort({ createdAt: -1 }).limit(5).lean(),
    Product.find({ stock: { $lt: 5 }, isAvailable: true }).sort({ stock: 1 }).limit(10).lean(),
  ])

  const thisMonthRevenue = revenueThisMonth[0]?.total ?? 0
  const lastMonthRevenue = revenueLastMonth[0]?.total ?? 0
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : null

  return NextResponse.json({
    metrics: {
      revenueThisMonth: thisMonthRevenue,
      revenueChange,
      ordersToday,
      ordersYesterday,
      usersThisWeek,
      usersLastWeek,
    },
    revenueChart: revenueData,
    recentOrders,
    recentUsers,
    lowStockProducts,
  })
}
