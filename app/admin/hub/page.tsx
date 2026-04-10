import AdminPageHeader from '@/components/admin/AdminPageHeader'
import HubStatsClient from './HubStatsClient'

export default function AdminHubPage() {
  return (
    <div>
      <AdminPageHeader title="Hub Stats" description="Virtual grows, XP, AI forum usage" />
      <HubStatsClient />
    </div>
  )
}
