import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import ForumQuestion from '@/lib/db/models/ForumQuestion'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 86400000)

  const [
    totalXpAgg,
    xpPerDay,
    forumThisMonth,
    forumAllTime,
    forumPerDay,
    recentQuestions,
    badgeCounts,
    totalUsers,
  ] = await Promise.all([
    XPEvent.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    XPEvent.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        xp: { $sum: '$amount' },
      }},
      { $sort: { _id: 1 } },
    ]),
    ForumQuestion.countDocuments({ createdAt: { $gte: monthStart } }),
    ForumQuestion.countDocuments(),
    ForumQuestion.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]),
    ForumQuestion.find({}).sort({ createdAt: -1 }).limit(10).select('question createdAt helpful').lean(),
    User.aggregate([
      { $unwind: '$badges' },
      { $group: { _id: '$badges.badgeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.countDocuments(),
  ])

  const totalXp = totalXpAgg[0]?.total ?? 0
  const avgForumPerDay = forumAllTime > 0
    ? (forumAllTime / Math.max(1, Math.ceil((now.getTime() - new Date('2024-01-01').getTime()) / 86400000))).toFixed(1)
    : '0'

  const badgesWithPercent = badgeCounts.map((b: { _id: string; count: number }) => ({
    badgeId:    b._id,
    count:      b.count,
    percentOfUsers: totalUsers > 0 ? ((b.count / totalUsers) * 100).toFixed(1) : '0',
  }))

  return NextResponse.json({
    metrics: {
      totalXpAllTime: totalXp,
      forumThisMonth,
      forumAllTime,
      avgForumPerDay,
      estimatedCost: (forumThisMonth * 0.014).toFixed(2),
    },
    xpPerDay,
    forumPerDay,
    recentQuestions,
    badges: badgesWithPercent,
  })
}
