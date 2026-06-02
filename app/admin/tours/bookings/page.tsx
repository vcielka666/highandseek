import { connectDB }       from '@/lib/db/connect'
import TourBookingModel     from '@/lib/db/models/TourBooking'
import TourModel            from '@/lib/db/models/Tour'
import AdminPageHeader      from '@/components/admin/AdminPageHeader'
import BookingsClient       from './BookingsClient'
import type { BookingRow }  from './BookingsClient'

export default async function AdminTourBookingsPage() {
  await connectDB()

  const rawBookings = await TourBookingModel
    .find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  // Collect tour IDs to lookup titles
  const tourIds = [...new Set(rawBookings.map((b) => String(b.tourId)))]
  const tours   = await TourModel.find({ _id: { $in: tourIds } }).select('_id title').lean()
  const tourMap = new Map(tours.map((t) => [String(t._id), t.title]))

  const initialBookings: BookingRow[] = rawBookings.map((b) => ({
    _id:             String(b._id),
    tourTitle:       tourMap.get(String(b.tourId)) ?? 'Unknown Tour',
    guestName:       b.guest?.name           ?? '',
    guestEmail:      b.guest?.email          ?? '',
    telegramContact: b.guest?.telegramContact ?? '',
    date:            b.date ? new Date(b.date).toISOString() : '',
    guestsCount:     b.guestsCount,
    paymentMethod:   b.payment?.method   ?? 'stripe',
    amount:          b.payment?.amount   ?? 0,
    currency:        b.payment?.currency ?? 'EUR',
    status:          b.status,
    qrCode:          b.qrCode,
    notes:           b.notes ?? '',
    createdAt:       b.createdAt ? new Date(b.createdAt).toISOString() : '',
    hostPayout:      (b as { hostPayout?: number }).hostPayout ?? 0,
    platformFee:     (b as { platformFee?: number }).platformFee ?? 0,
  }))

  return (
    <div>
      <AdminPageHeader
        title="Tour Bookings"
        description="Manage and confirm tour reservations"
      />
      <BookingsClient initialBookings={initialBookings} />
    </div>
  )
}
