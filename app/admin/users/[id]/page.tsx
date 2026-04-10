import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Order from '@/lib/db/models/Order'
import XPEvent from '@/lib/db/models/XPEvent'
import CreditEvent from '@/lib/db/models/CreditEvent'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import UserDetailClient from './UserDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params
  await connectDB()

  const [user, orders, xpEvents, creditEvents] = await Promise.all([
    User.findById(id).select('-passwordHash').lean(),
    Order.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    XPEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    CreditEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
  ])

  if (!user) notFound()

  return (
    <div>
      <AdminPageHeader
        title={String((user as Record<string, unknown>).username ?? 'User')}
        description={String((user as Record<string, unknown>).email ?? '')}
      />
      <UserDetailClient
        user={JSON.parse(JSON.stringify(user))}
        orders={JSON.parse(JSON.stringify(orders))}
        xpEvents={JSON.parse(JSON.stringify(xpEvents))}
        creditEvents={JSON.parse(JSON.stringify(creditEvents))}
      />
    </div>
  )
}
