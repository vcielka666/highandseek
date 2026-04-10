import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default async function StrainsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/strains')

  return (
    <div style={{ maxWidth: '860px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: 'Strains' }]} color="#cc00aa" />
      <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '8px' }}>
        Strain Profiles
      </h1>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', lineHeight: 1.7, marginBottom: '32px', maxWidth: '520px' }}>
        AI-powered strain avatars with personality, grow stats, and interactive chat. Coming soon.
      </p>

      <div style={{
        background: '#0d0d10',
        border: '0.5px solid rgba(204,0,170,0.15)',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <span style={{ fontSize: '40px' }}>🧬</span>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#e8f0ef' }}>
          Strain Avatars — Coming Soon
        </div>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6, maxWidth: '400px' }}>
          Each strain gets an AI personality. Ask about terpenes, growing tips, effects. Earn XP through conversations.
        </p>
        <Link
          href="/shop"
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px',
            color: '#00d4c8', textDecoration: 'none',
            border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '4px', padding: '8px 18px',
          }}
        >
          Browse strains in shop →
        </Link>
      </div>
    </div>
  )
}
