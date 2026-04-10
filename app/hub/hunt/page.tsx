import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default async function HuntPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/hunt')

  return (
    <div style={{ maxWidth: '860px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: 'Seekers' }]} color="#f0a830" />
      <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '8px' }}>
        Seekers
      </h1>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', lineHeight: 1.7, marginBottom: '32px', maxWidth: '520px' }}>
        Real-world geocaching hunts with H&S rewards. Your H&S account links directly to the Seekers platform.
      </p>

      <div style={{
        background: '#0d0d10',
        border: '0.5px solid rgba(240,168,48,0.15)',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#06080a', border: '0.5px solid rgba(240,168,48,0.25)', boxShadow: '0 0 24px rgba(240,168,48,0.1)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#e8f0ef' }}>
          Seekers App
        </div>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6, maxWidth: '400px' }}>
          Find hidden caches, complete hunts, and earn H&S Credits redeemable in the shop. Powered by the Seekers platform.
        </p>
        <a
          href="https://seekers-game.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px',
            textTransform: 'uppercase', color: '#050508',
            background: '#f0a830', borderRadius: '4px', padding: '10px 24px',
            textDecoration: 'none',
          }}
        >
          Open Seekers App ↗
        </a>
      </div>
    </div>
  )
}
