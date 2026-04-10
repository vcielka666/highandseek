'use client'

import { useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { AvatarStatus } from '@/lib/avatar/decay'

interface StrainUserState {
  level: number
  status: AvatarStatus
  needs: { hydration: number; nutrients: number; energy: number; happiness: number }
  chatCount: number
}

interface StrainCard {
  slug: string
  name: string
  type: 'indica' | 'sativa' | 'hybrid'
  genetics: string
  floweringTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  personality: { archetype: string; catchphrase: string; tone: string[] }
  visuals: { avatarLevels: Array<{ level: number; imageUrl: string }>; idleAnimation: string }
  stats: { totalChats: number; totalMessages: number }
  shopProductSlug: string
  isComingSoon: boolean
  userState: StrainUserState | null
}

const STATUS_COLORS: Record<AvatarStatus, string> = {
  thriving: '#00d4c8',
  happy:    '#88cc44',
  neutral:  '#f0a830',
  sad:      '#cc7700',
  wilting:  '#cc3300',
}

const STATUS_LABELS: Record<AvatarStatus, string> = {
  thriving: '✨ Thriving',
  happy:    '😊 Happy',
  neutral:  '😐 Neutral',
  sad:      '😢 Sad',
  wilting:  '🥀 Wilting',
}

const TYPE_GRADIENT: Record<string, string> = {
  indica:  'linear-gradient(135deg, #3d1a6e 0%, #1a0a30 100%)',
  sativa:  'linear-gradient(135deg, #1a4d1a 0%, #0a200a 100%)',
  hybrid:  'linear-gradient(135deg, #0a2428 0%, #1a0a30 100%)',
}

function NeedsMiniBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? '#00d4c8' : value >= 50 ? '#f0a830' : '#cc3300'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '9px' }}>{label}</span>
      <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', width: '30px' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function AvatarPlaceholder({ type, size = 80 }: { type: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: TYPE_GRADIENT[type] ?? TYPE_GRADIENT.hybrid,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.4, opacity: 0.6 }}>
        {type === 'indica' ? '💜' : type === 'sativa' ? '🌿' : '🧬'}
      </span>
    </div>
  )
}

type FilterType = 'all' | 'indica' | 'sativa' | 'hybrid'

export default function StrainDirectoryClient({ strains }: { strains: StrainCard[] }) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? strains : strains.filter(s => s.type === filter)

  return (
    <div style={{ maxWidth: '960px' }} className="px-4 pt-4 pb-20 md:px-7 md:pt-7">
      <Breadcrumb
        items={[{ label: 'Hub', href: '/hub' }, { label: 'Strain Universe' }]}
        color="#cc00aa"
      />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#e8f0ef', letterSpacing: '3px', marginBottom: '6px' }}>
          STRAIN UNIVERSE
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
          Every strain. A living personality.
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {(['all', 'indica', 'sativa', 'hybrid'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
              textTransform: 'uppercase', padding: '7px 16px', borderRadius: '20px', cursor: 'pointer',
              border: `0.5px solid ${filter === f ? '#cc00aa' : 'rgba(74,96,102,0.3)'}`,
              background: filter === f ? '#cc00aa' : 'transparent',
              color: filter === f ? '#050508' : '#4a6066',
              transition: 'all 0.15s',
            }}
          >
            {f === 'all' ? 'All' : f === 'indica' ? '💜 Indica' : f === 'sativa' ? '🌿 Sativa' : '🧬 Hybrid'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {filtered.map(strain => {
          const avatarUrl = strain.userState
            ? (strain.visuals.avatarLevels.find(l => l.level === strain.userState!.level)?.imageUrl ?? '')
            : (strain.visuals.avatarLevels[0]?.imageUrl ?? '')

          return (
            <div
              key={strain.slug}
              style={{
                background: '#0d0d10',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s',
                opacity: strain.isComingSoon ? 0.5 : 1,
              }}
              className="hover:border-[rgba(204,0,170,0.3)]"
            >
              {/* Avatar area */}
              <div style={{ height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: TYPE_GRADIENT[strain.type] ?? TYPE_GRADIENT.hybrid }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={strain.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(204,0,170,0.3)' }} />
                ) : (
                  <AvatarPlaceholder type={strain.type} size={80} />
                )}

                {/* Status dot */}
                {strain.userState && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: STATUS_COLORS[strain.userState.status],
                    boxShadow: `0 0 6px ${STATUS_COLORS[strain.userState.status]}`,
                  }} title={STATUS_LABELS[strain.userState.status]} />
                )}

                {/* New badge */}
                {!strain.userState && !strain.isComingSoon && (
                  <span style={{
                    position: 'absolute', top: '10px', left: '10px',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px',
                    color: '#050508', background: '#cc00aa', padding: '2px 8px', borderRadius: '3px',
                  }}>NEW</span>
                )}

                {/* Coming soon */}
                {strain.isComingSoon && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px' }}>COMING SOON</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef' }}>
                  {strain.name}
                </div>

                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#8844cc', textTransform: 'uppercase' }}>
                  {strain.personality.archetype}
                </div>

                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', fontStyle: 'italic' }}>
                  &ldquo;{strain.personality.catchphrase}&rdquo;
                </div>

                {/* User state */}
                {strain.userState ? (
                  <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830' }}>
                        Lv {strain.userState.level}
                      </span>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: STATUS_COLORS[strain.userState.status] }}>
                        {STATUS_LABELS[strain.userState.status]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <NeedsMiniBar value={strain.userState.needs.hydration} label="💧" />
                      <NeedsMiniBar value={strain.userState.needs.nutrients} label="🌿" />
                      <NeedsMiniBar value={strain.userState.needs.energy}    label="☀️" />
                      <NeedsMiniBar value={strain.userState.needs.happiness} label="💬" />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '4px' }}>
                    {strain.stats.totalChats.toLocaleString()} chats total
                  </div>
                )}

                {/* CTA */}
                {!strain.isComingSoon && (
                  <Link
                    href={`/hub/strains/${strain.slug}`}
                    style={{
                      marginTop: 'auto',
                      display: 'block', textAlign: 'center',
                      fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
                      color: '#050508', background: '#cc00aa',
                      padding: '8px', borderRadius: '4px', textDecoration: 'none',
                      transition: 'opacity 0.15s',
                    }}
                    className="hover:opacity-90"
                  >
                    {strain.userState ? 'Continue →' : 'Chat →'}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
