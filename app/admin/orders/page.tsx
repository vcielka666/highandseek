import AdminPageHeader from '@/components/admin/AdminPageHeader'
import OrdersClient from './OrdersClient'

export default function AdminOrdersPage() {
  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Manage and fulfil customer orders"
      />
      <OrdersClient />
    </div>
  )
}
