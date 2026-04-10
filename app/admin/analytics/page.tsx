import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AnalyticsClient from './AnalyticsClient'

export default function AdminAnalyticsPage() {
  return (
    <div>
      <AdminPageHeader title="Analytics" description="Revenue, registrations, orders, geography" />
      <AnalyticsClient />
    </div>
  )
}
