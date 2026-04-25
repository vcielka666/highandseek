import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { QRScan } from '@/lib/db/models/QRRedirect'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await params
  await connectDB()

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [totals, perDay, deviceBreak, countryBreak, recent] = await Promise.all([
    QRScan.aggregate([
      { $match: { slug } },
      { $group: { _id: null, total: { $sum: 1 }, converted: { $sum: { $cond: ['$convertedToRegistration', 1, 0] } } } },
    ]),
    QRScan.aggregate([
      { $match: { slug, timestamp: { $gte: since30 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    QRScan.aggregate([
      { $match: { slug } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]),
    QRScan.aggregate([
      { $match: { slug, country: { $nin: ['', null] } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    QRScan.find({ slug }).sort({ timestamp: -1 }).limit(20).lean(),
  ])

  const total      = totals[0]?.total     ?? 0
  const converted  = totals[0]?.converted ?? 0

  return NextResponse.json({
    total,
    converted,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    perDay:         perDay.map(d => ({ date: d._id, count: d.count })),
    deviceBreak:    deviceBreak.map(d => ({ device: d._id, count: d.count })),
    countryBreak:   countryBreak.map(c => ({ country: c._id, count: c.count })),
    recent:         recent.map(s => ({
      timestamp: s.timestamp,
      device:    s.device,
      country:   s.country,
      converted: s.convertedToRegistration,
    })),
  })
}
