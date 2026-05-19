import AdminPageHeader      from '@/components/admin/AdminPageHeader'
import TourAnalyticsClient  from './TourAnalyticsClient'

export default function AdminTourAnalyticsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Tour Analytics"
        description="Bookings, revenue, and waitlist overview"
      />
      <TourAnalyticsClient />
    </div>
  )
}
