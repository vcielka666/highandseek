import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'
import ForumQuestion from '@/lib/db/models/ForumQuestion'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import OverviewClient from './OverviewClient'

async function getOverviewData() {
  await connectDB()

  const now          = new Date()
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday    = new Date(todayStart.getTime() - 86400000)
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(monthStart.getTime() - 1)
  const weekStart    = new Date(todayStart.getTime() - 7  * 86400000)
  const lastWeekStart = new Date(todayStart.getTime() - 14 * 86400000)
  const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * 86400000)
  const sevenDaysAgo  = new Date(todayStart.getTime() - 6  * 86400000)

  const [
    revenueThisMonthAgg,
    revenueLastMonthAgg,
    ordersToday,
    ordersYesterday,
    usersThisWeek,
    usersLastWeek,
    revenueChart,
    recentOrders,
    recentUsers,
    lowStockProducts,
    forumThisMonth,
    forumDailyAgg,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ['paid','shipped','delivered'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid','shipped','delivered'] }, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.countDocuments({ createdAt: { $gte: yesterday, $lt: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
    Order.aggregate([
      { $match: { status: { $in: ['paid','shipped','delivered'] }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    User.find({}).select('-passwordHash').sort({ createdAt: -1 }).limit(5).lean(),
    Product.find({ stock: { $lt: 5 }, isAvailable: true }).sort({ stock: 1 }).limit(8).lean(),
    ForumQuestion.countDocuments({ createdAt: { $gte: monthStart } }),
    ForumQuestion.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ])

  const thisMonthRevenue = revenueThisMonthAgg[0]?.total ?? 0
  const lastMonthRevenue = revenueLastMonthAgg[0]?.total ?? 0
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : null

  return {
    metrics: {
      revenueThisMonth: thisMonthRevenue,
      revenueChange,
      ordersToday,
      ordersYesterday,
      usersThisWeek,
      usersLastWeek,
    },
    revenueChart: revenueChart.map((r: { _id: string; revenue: number }) => ({ date: r._id, revenue: r.revenue })),
    recentOrders:      JSON.parse(JSON.stringify(recentOrders)),
    recentUsers:       JSON.parse(JSON.stringify(recentUsers)),
    lowStockProducts:  JSON.parse(JSON.stringify(lowStockProducts)),
    anthropic: {
      requestsThisMonth: forumThisMonth,
      estimatedCost:     (forumThisMonth * 0.014).toFixed(2),
      dailyUsage:        forumDailyAgg.map((d: { _id: string; count: number }) => ({ date: d._id, count: d.count })),
    },
  }
}

export default async function AdminOverviewPage() {
  const data = await getOverviewData()
  return (
    <div>
      <AdminPageHeader title="Overview" description="Real-time snapshot of the platform" />
      <OverviewClient data={data} />
    </div>
  )
}
