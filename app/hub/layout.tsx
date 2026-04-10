import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import HubSidebar from '@/components/hub/HubSidebar'

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()
  const user = await User.findById(session.user.id).select('credits').lean<{ credits?: number }>()
  const credits = user?.credits ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex' }}>
      <HubSidebar session={session} credits={credits} />

      <main style={{
        flex: 1,
        minWidth: 0,
        paddingBottom: '72px', // mobile tab bar clearance
      }} className="lg:pb-0">
        {children}
      </main>
    </div>
  )
}
