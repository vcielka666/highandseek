import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import AdminSidebar from './AdminSidebar'

export const metadata = { title: 'Admin — High & Seek' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin')
  }
  if (session.user.role !== 'admin') {
    redirect('/hub')
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      <AdminSidebar email={session.user.email ?? ''} />

      {/* Main content — offset by sidebar width */}
      <main className="md:ml-60 ml-12 min-h-screen p-6">
        {children}
      </main>
    </div>
  )
}
