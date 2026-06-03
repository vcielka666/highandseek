import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import HubNavbar from '@/components/hub/HubNavbar'

export const dynamic = 'force-dynamic'

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  let credits = 0, avatar = '', xp = 0, level = 1, username = ''

  if (session) {
    await connectDB()
    const user = await User.findById(session.user.id)
      .select('credits avatar xp level')
      .lean<{ credits?: number; avatar?: string; xp?: number; level?: number }>()
    credits  = user?.credits ?? 0
    avatar   = user?.avatar  ?? ''
    xp       = user?.xp      ?? session.user.xp ?? 0
    level    = user?.level   ?? session.user.level ?? 1
    username = session.user.username
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508' }}>
      <HubNavbar
        username={username}
        avatar={avatar}
        xp={xp}
        level={level}
        credits={credits}
        guestMode={!session}
      />
      <main style={{ paddingBottom: '40px' }}>
        {children}
      </main>
    </div>
  )
}
