'use client'

import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { AvatarStatus } from '@/lib/avatar/decay'
import { useLanguage } from '@/stores/languageStore'

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

// STATUS_LABELS built dynamically from translations — see inside component

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


export default function StrainDirectoryClient({ strains }: { strains: StrainCard[] }) {
  const { t } = useLanguage()
  const s = t.strainDir

  const STATUS_LABELS: Record<AvatarStatus, string> = {
    thriving: s.statusThriving,
    happy:    s.statusHappy,
    neutral:  s.statusNeutral,
    sad:      s.statusSad,
    wilting:  s.statusWilting,
  }

  return (
    /* Outer wrapper — image as CSS background, 1:1 square */
    <div style={{
      position: 'relative',
      backgroundImage: 'url(/avatarsLounge.png)',
      backgroundSize: '100% auto',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top center',
      maxWidth: '960px',
    }} className="px-4 pt-4 pb-20 md:px-7 md:pt-7">

      {/* Gradient overlay sized exactly to the square image (aspect-ratio 1:1 = same width as height) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        aspectRatio: '1 / 1',
        background: 'linear-gradient(to bottom, rgba(5,5,8,0.72) 0%, rgba(5,5,8,0.4) 25%, rgba(5,5,8,0.1) 55%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* All content on top of background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Breadcrumb
          items={[{ label: 'Hub', href: '/hub' }, { label: s.breadcrumb }]}
          color="#cc00aa"
        />

        <div style={{ marginBottom: '28px', paddingTop: '8px' }}>
          <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(22px, 4vw, 36px)', color: '#e8f0ef', letterSpacing: '3px', margin: '0 0 10px', lineHeight: 1.1 }}>
            {s.title}
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(232,240,239,0.65)', lineHeight: 1.75, margin: 0, maxWidth: '500px' }}>
            {s.subtitle}
          </p>
        </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {strains.map(strain => {
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
                    {s.chatsTotal(strain.stats.totalChats)}
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
                    {strain.userState ? s.continueCta : s.chatCta}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
