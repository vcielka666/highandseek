import { auth } from '@/lib/auth/config'
import Navbar from '@/components/layout/Navbar'
import { redirect } from 'next/navigation'

export default async function HubPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef' }}>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.6)', marginBottom: '8px' }}>
          Pillar 02 · Community
        </div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(28px, 5vw, 48px)', color: '#cc00aa', textShadow: '0 0 30px rgba(204,0,170,0.3)' }}>
          H&amp;S Hub
        </h1>
        <div style={{ marginTop: '24px', padding: '20px 32px', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '8px', background: 'rgba(204,0,170,0.04)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)' }}>
            Logged in as
          </div>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#e8f0ef' }}>
            {session.user.username}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#4a6066' }}>XP</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#f0a830' }}>{session.user.xp}</span>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginTop: '16px' }}>
          Coming soon
        </p>
      </main>
    </div>
  )
}
