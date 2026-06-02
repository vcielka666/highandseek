import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import GuidesClient from './GuidesClient'

export default async function AdminGuidesPage() {
  await connectDB()
  const pendingCount = await User.countDocuments({ tourGuideStatus: 'pending' })
  const approvedCount = await User.countDocuments({ tourGuideStatus: 'approved' })

  return (
    <div>
      <AdminPageHeader
        title="Tour Guides"
        description={`${pendingCount} pending · ${approvedCount} active guides`}
      />
      <GuidesClient />
    </div>
  )
}
