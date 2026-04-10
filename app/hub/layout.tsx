import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import HubSidebar from '@/components/hub/HubSidebar'

export const dynamic = 'force-dynamic'

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()
  const [user, activeGrow] = await Promise.all([
    User.findById(session.user.id).select('credits avatar xp').lean<{ credits?: number; avatar?: string; xp?: number }>(),
    VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
      .select('warnings')
      .lean<{ warnings: Array<{ severity: string; resolvedAt: unknown }> }>(),
  ])
  const credits = user?.credits ?? 0
  const avatar  = user?.avatar  ?? ''
  const xp      = user?.xp      ?? session.user.xp ?? 0
  const criticalWarnings = activeGrow?.warnings?.filter(w => w.severity === 'critical' && !w.resolvedAt).length ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex' }}>
      <HubSidebar session={session} credits={credits} avatar={avatar} xp={xp} criticalWarnings={criticalWarnings} />

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
