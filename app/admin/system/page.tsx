import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SystemClient from './SystemClient'

export default function AdminSystemPage() {
  return (
    <div>
      <AdminPageHeader title="System" description="API costs, database, error log, app info" />
      <SystemClient />
    </div>
  )
}
