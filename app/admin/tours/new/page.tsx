import AdminPageHeader from '@/components/admin/AdminPageHeader'
import TourFormClient  from '../TourFormClient'

export default function AdminTourNewPage() {
  return (
    <div>
      <AdminPageHeader
        title="New Tour"
        description="Create a new cannabis tour listing"
      />
      <TourFormClient mode="new" />
    </div>
  )
}
