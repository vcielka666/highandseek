import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import HubNavbar from '@/components/hub/HubNavbar'

export const dynamic = 'force-dynamic'

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()
  const user = await User.findById(session.user.id)
    .select('credits avatar xp level')
    .lean<{ credits?: number; avatar?: string; xp?: number; level?: number }>()

  const credits = user?.credits ?? 0
  const avatar  = user?.avatar  ?? ''
  const xp      = user?.xp      ?? session.user.xp ?? 0
  const level   = user?.level   ?? session.user.level ?? 1

  return (
    <div style={{ minHeight: '100vh', background: '#050508' }}>
      <HubNavbar
        username={session.user.username}
        avatar={avatar}
        xp={xp}
        level={level}
        credits={credits}
      />
      <main style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }} className="hub-main">
        {children}
      </main>
    </div>
  )
}
