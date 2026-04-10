import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'
import Order from '@/lib/db/models/Order'
import ForumQuestion from '@/lib/db/models/ForumQuestion'
import XPEvent from '@/lib/db/models/XPEvent'
import CreditEvent from '@/lib/db/models/CreditEvent'
import ErrorLog from '@/lib/db/models/ErrorLog'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    userCount,
    productCount,
    orderCount,
    forumCount,
    xpCount,
    creditCount,
    errorCount,
    recentErrors,
    forumThisMonth,
    stripeFeesAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    ForumQuestion.countDocuments(),
    XPEvent.countDocuments(),
    CreditEvent.countDocuments(),
    ErrorLog.countDocuments(),
    ErrorLog.find({}).sort({ createdAt: -1 }).limit(50).lean(),
    ForumQuestion.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, fees: { $sum: { $add: [{ $multiply: ['$totalAmount', 0.029] }, 0.30] } } } },
    ]),
  ])

  const stripeFees = stripeFeesAgg[0]?.fees ?? 0

  return NextResponse.json({
    collections: [
      { name: 'users',          count: userCount },
      { name: 'products',       count: productCount },
      { name: 'orders',         count: orderCount },
      { name: 'forumQuestions', count: forumCount },
      { name: 'xpEvents',       count: xpCount },
      { name: 'creditEvents',   count: creditCount },
      { name: 'errorLogs',      count: errorCount },
    ],
    apiCosts: {
      anthropicRequestsThisMonth: forumThisMonth,
      anthropicEstimatedCost:     (forumThisMonth * 0.014).toFixed(2),
      stripeFeesThisMonth:        stripeFees.toFixed(2),
    },
    recentErrors,
  })
}
