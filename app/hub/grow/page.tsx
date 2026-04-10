import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { getServerT } from '@/lib/i18n/server'

export default async function GrowPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/grow')

  const { t } = await getServerT()
  const g = t.grow

  return (
    <div style={{ maxWidth: '860px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: g.title }]} color="#cc00aa" />
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(28px, 5vw, 44px)', color: '#e8f0ef', letterSpacing: '2px', margin: 0, lineHeight: 1 }}>
          {g.title}
        </h1>
      </div>

      {/* Story card */}
      <div style={{
        background: 'rgba(13,0,20,0.6)',
        border: '0.5px solid rgba(204,0,170,0.15)',
        borderRadius: '8px',
        padding: '28px 32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '16px', right: '20px',
          fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
          color: 'rgba(204,0,170,0.1)', lineHeight: 1.4, userSelect: 'none',
        }}>
          {'┌──────────┐\n│  🌱      │\n└──────────┘'}
        </div>

        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.4)', marginBottom: '20px' }}>
          {g.originLabel}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[g.story1, g.story2, g.story3].map((para, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              lineHeight: 1.85,
              color: i === 0 ? 'rgba(232,240,239,0.85)' : 'rgba(232,240,239,0.6)',
              margin: 0,
            }}>
              {para}
            </p>
          ))}
        </div>

      </div>

      {/* Farm stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}
        className="max-sm:grid-cols-1">
        {[
          { label: g.growsCompleted, value: '0', unit: '' },
          { label: g.xpFromGrows,   value: '0', unit: 'xp' },
          { label: g.creditsEarned, value: '0', unit: '💎' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{
            background: 'rgba(204,0,170,0.05)',
            border: '0.5px solid rgba(204,0,170,0.12)',
            borderRadius: '6px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, color: '#cc00aa', marginBottom: '4px' }}>
              {value}<span style={{ fontSize: '12px', marginLeft: '3px', opacity: 0.6 }}>{unit}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Start grow CTA */}
      <div style={{
        background: 'rgba(13,0,20,0.6)',
        border: '0.5px solid rgba(204,0,170,0.2)',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '13px',
          color: 'rgba(0,212,200,0.2)', lineHeight: 1.6, marginBottom: '24px', letterSpacing: '-1px',
        }}>
          {'     |\n    /|\\\n   / | \\\n  /  |  \\\n ────────\n    |||'}
        </div>

        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#e8f0ef', marginBottom: '8px' }}>
          {g.noActiveGrow}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', marginBottom: '24px', maxWidth: '340px', margin: '0 auto 24px' }}>
          {g.noActiveGrowDesc}
        </div>

        <Link
          href="/shop?category=seed"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase',
            color: '#050508', background: '#cc00aa', border: 'none', borderRadius: '4px',
            padding: '10px 24px', textDecoration: 'none', transition: 'all 0.2s',
          }}
          className="hover:bg-[#e000bb] hover:shadow-[0_0_20px_rgba(204,0,170,0.4)]"
        >
          {g.chooseStrain}
        </Link>
      </div>
    </div>
  )
}
