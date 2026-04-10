import AdminPageHeader from '@/components/admin/AdminPageHeader'
import UsersClient from './UsersClient'

export default function AdminUsersPage() {
  return (
    <div>
      <AdminPageHeader title="Users" description="Manage accounts, roles, and rewards" />
      <UsersClient />
    </div>
  )
}
