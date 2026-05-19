import { connectDB }   from '@/lib/db/connect'
import TourModel        from '@/lib/db/models/Tour'
import TourBookingModel from '@/lib/db/models/TourBooking'
import WaitlistModel    from '@/lib/db/models/Waitlist'
import AdminPageHeader  from '@/components/admin/AdminPageHeader'
import ToursOverviewClient from './ToursOverviewClient'
import Link from 'next/link'

export type TourRow = {
  _id:           string
  title:         string
  city:          string
  category:      string
  isActive:      boolean
  isComingSoon:  boolean
  isFeatured:    boolean
  totalBookings: number
  rating:        number
  slug:          string
}

export type ToursStats = {
  tourCount:     number
  bookingCount:  number
  revenue:       number
  waitlistCount: number
}

export default async function AdminToursPage() {
  await connectDB()

  const now     = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tourCount, bookingCount, revenueAgg, waitlistCount, rawTours] = await Promise.all([
    TourModel.countDocuments(),
    TourBookingModel.countDocuments(),
    TourBookingModel.aggregate<{ total: number }>([
      { $match: { 'payment.status': 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]),
    WaitlistModel.countDocuments({ source: 'tours' }),
    TourModel.find()
      .select('title city category isActive isComingSoon isFeatured totalBookings rating slug')
      .sort({ createdAt: -1 })
      .lean(),
  ])

  const stats: ToursStats = {
    tourCount,
    bookingCount,
    revenue:      revenueAgg[0]?.total ?? 0,
    waitlistCount,
  }

  const initialTours: TourRow[] = rawTours.map((t) => ({
    _id:          String(t._id),
    title:        t.title,
    city:         t.city,
    category:     t.category,
    isActive:     t.isActive,
    isComingSoon: t.isComingSoon,
    isFeatured:   t.isFeatured,
    totalBookings: t.totalBookings,
    rating:       t.rating,
    slug:         t.slug,
  }))

  return (
    <div>
      <AdminPageHeader
        title="Tours"
        description="Manage cannabis tours, bookings, and spots"
        actions={
          <Link
            href="/admin/tours/new"
            className="text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              background:  'rgba(240,168,48,0.15)',
              color:       '#f0a830',
              border:      '0.5px solid rgba(240,168,48,0.3)',
              fontFamily:  'var(--font-dm-mono)',
            }}
          >
            + New Tour
          </Link>
        }
      />
      <ToursOverviewClient stats={stats} initialTours={initialTours} />
    </div>
  )
}
