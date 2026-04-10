import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import Product from '@/lib/db/models/Product'
import { getXPProgress, LEVELS } from '@/lib/xp/index'
import { BADGES } from '@/lib/badges/index'
import Link from 'next/link'

function XPBar({ percent, xp, next }: { percent: number; xp: number; next: typeof LEVELS[number] | null }) {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
          {xp.toLocaleString()} XP
        </span>
        {next && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
            {next.xpRequired.toLocaleString()} XP → {next.name}
          </span>
        )}
      </div>
      <div style={{ height: '4px', background: 'rgba(240,168,48,0.12)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: 'linear-gradient(90deg, #f0a830, #ffc040)',
          borderRadius: '2px',
        }} />
      </div>
    </div>
  )
}

const EVENT_LABELS: Record<string, string> = {
  WATER_PLANT:            '🌿 Watered plant',
  FEED_PLANT:             '🧪 Fed plant',
  FORUM_QUESTION:         '🔍 Asked a question',
  FIRST_PURCHASE:         '🛒 First purchase',
  PROFILE_COMPLETED:      '👤 Completed profile',
  GROW_COMPLETED:         '🏆 Grow completed',
  FIRST_STRAIN_CHAT:      '🧬 First strain chat',
  ACADEMY_ARTICLE_READ:   '📚 Read article',
}

export default async function HubPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()

  const [userData, recentXP, productCount] = await Promise.all([
    User.findById(session.user.id).select('xp level badges credits').lean<{
      xp: number
      level: number
      credits: number
      badges: { badgeId: string; earnedAt: Date }[]
    }>(),
    XPEvent.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<{ event: string; amount: number; createdAt: Date }[]>(),
    Product.countDocuments({ isAvailable: true }),
  ])

  const xp = userData?.xp ?? session.user.xp
  const { current, next, percent } = getXPProgress(xp)
  const badges = userData?.badges ?? []
  const recentBadges = badges.slice(-3).reverse()

  // Strain of the day — deterministic random based on date
  const dayIndex = Math.floor(Date.now() / 86400000) % Math.max(productCount, 1)
  const strainOfDay = await Product.findOne({ isAvailable: true, category: 'seed' })
    .skip(dayIndex % Math.max(productCount, 1))
    .select('name slug shortDescription strain images')
    .lean<{
      name: string; slug: string; shortDescription: string;
      strain: { type: string | null }; images: string[]
    }>()

  // Top leaderboard users
  const topUsers = await User.find({})
    .sort({ xp: -1 })
    .limit(5)
    .select('username xp level')
    .lean<{ _id: { toString(): string }; username: string; xp: number; level: number }[]>()

  const cardStyle: React.CSSProperties = {
    background: '#0d0d10',
    border: '0.5px solid rgba(204,0,170,0.15)',
    borderRadius: '8px',
    padding: '20px',
  }

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: '1100px' }}>
      {/* A — Welcome header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '6px' }}>
          Hub · Dashboard
        </div>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '4px' }}>
          Welcome back, <span style={{ color: '#cc00aa' }}>{session.user.username}</span>
        </h1>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', marginBottom: '8px' }}>
          ⚡ Level {current.level} · {current.name}
        </div>
        <XPBar percent={percent} xp={xp} next={next} />
      </div>

      {/* B + C — Active Grow + Strain of Day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="max-md:grid-cols-1">

        {/* B — Active Grow */}
        <div style={cardStyle}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '12px' }}>
            Virtual Grow
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '24px', color: 'rgba(0,212,200,0.2)', letterSpacing: '-2px' }}>
              ┌────────────┐<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;🌱&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              └────────────┘
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase' }}>
              No active grow
            </div>
            <Link
              href="/hub/grow"
              style={{
                fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px',
                textTransform: 'uppercase', color: '#050508', background: '#cc00aa',
                border: 'none', borderRadius: '4px', padding: '9px 20px',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              className="hover:bg-[#e000bb] hover:shadow-[0_0_16px_rgba(204,0,170,0.4)]"
            >
              Start Virtual Grow →
            </Link>
          </div>
        </div>

        {/* C — Strain of the Day */}
        <div style={cardStyle}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '12px' }}>
            Strain of the Day
          </div>
          {strainOfDay ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(204,0,170,0.12)', border: '1px solid rgba(204,0,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  🧬
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef' }}>
                    {strainOfDay.name}
                  </div>
                  {strainOfDay.strain.type && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textTransform: 'uppercase' }}>
                      {strainOfDay.strain.type}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, marginBottom: '12px' }}>
                {strainOfDay.shortDescription}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/hub/strains`}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: '#cc00aa', textDecoration: 'none', border: '0.5px solid rgba(204,0,170,0.3)', borderRadius: '4px', padding: '6px 12px', transition: 'all 0.2s' }}
                  className="hover:border-[#cc00aa] hover:bg-[rgba(204,0,170,0.08)]"
                >
                  Chat with strain →
                </Link>
                <Link
                  href={`/shop/${strainOfDay.slug}`}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: '#007a74', textDecoration: 'none', border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '4px', padding: '6px 12px', transition: 'all 0.2s' }}
                  className="hover:border-[#00d4c8] hover:text-[#00d4c8]"
                >
                  Buy seeds →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '20px 0' }}>
              No strains available yet
            </div>
          )}
        </div>
      </div>

      {/* D — XP & Badges row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="max-md:grid-cols-1">

        {/* Recent XP events */}
        <div style={cardStyle}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '12px' }}>
            Recent XP
          </div>
          {recentXP.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentXP.map((evt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
                    {EVENT_LABELS[evt.event] ?? evt.event}
                  </span>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#f0a830', flexShrink: 0 }}>
                    +{evt.amount} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
              No XP events yet — start growing!
            </div>
          )}
        </div>

        {/* Recent badges */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)' }}>
              Badges
            </div>
            <Link href={`/hub/profile/${session.user.username}`} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textDecoration: 'none', letterSpacing: '0.5px' }}
              className="hover:text-[#cc00aa]">
              View all →
            </Link>
          </div>
          {recentBadges.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentBadges.map((b) => {
                const badge = BADGES[b.badgeId as keyof typeof BADGES]
                if (!badge) return null
                return (
                  <div key={b.badgeId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }}>{badge.name}</div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>{badge.condition}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
              No badges yet — complete actions to earn them.
            </div>
          )}
        </div>
      </div>

      {/* E + F — Forum teaser + Seekers teaser */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '16px', marginBottom: '16px' }} className="max-md:grid-cols-1">

        {/* E — Forum Bridge teaser */}
        <div style={{ ...cardStyle, borderColor: 'rgba(136,68,204,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(136,68,204,0.6)', marginBottom: '12px' }}>
            Forum Bridge
          </div>
          <Link href="/hub/forum" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.2)',
              borderRadius: '4px', padding: '10px 14px', marginBottom: '12px',
            }}>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
                Ask anything about growing cannabis...
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8844cc" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['Best LED for 2×2 tent?', 'Spider mites organic fix?', 'Living soil vs coco?', 'VPD explained'].map((q) => (
              <Link
                key={q}
                href={`/hub/forum?q=${encodeURIComponent(q)}`}
                style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc',
                  border: '0.5px solid rgba(136,68,204,0.25)', borderRadius: '20px',
                  padding: '4px 10px', textDecoration: 'none', transition: 'all 0.15s',
                }}
                className="hover:bg-[rgba(136,68,204,0.1)] hover:border-[rgba(136,68,204,0.5)]"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>

        {/* F — Seekers Hunt teaser */}
        <div style={cardStyle}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginBottom: '12px' }}>
            Seekers Hunt
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '12px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '28px' }}>🗺️</span>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
              Connect your Seekers account to see hunts near you.
            </div>
            <Link
              href="/hub/hunt"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: '#f0a830', textDecoration: 'none', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '4px', padding: '7px 16px', transition: 'all 0.2s' }}
              className="hover:border-[#f0a830] hover:bg-[rgba(240,168,48,0.08)]"
            >
              View Hunts →
            </Link>
          </div>
        </div>
      </div>

      {/* G — Leaderboard snippet */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)' }}>
            Leaderboard · Top 5
          </div>
          <Link href="/hub/leaderboard" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textDecoration: 'none' }}
            className="hover:text-[#cc00aa]">
            Full leaderboard →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topUsers.map((u, i) => {
            const isMe = u._id.toString() === session.user.id
            const rankColors = ['#f0a830', '#c0c0c0', '#cd7f32']
            return (
              <div key={u._id.toString()} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', borderRadius: '4px',
                background: isMe ? 'rgba(204,0,170,0.08)' : 'transparent',
                border: isMe ? '0.5px solid rgba(204,0,170,0.2)' : '0.5px solid transparent',
              }}>
                <span style={{
                  fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700,
                  color: rankColors[i] ?? '#4a6066', width: '20px', textAlign: 'center', flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/hub/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: isMe ? '#cc00aa' : '#e8f0ef' }}>
                      {u.username}
                    </span>
                  </Link>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '8px' }}>
                    Lv.{u.level}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#f0a830', flexShrink: 0 }}>
                  {u.xp.toLocaleString()} XP
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
