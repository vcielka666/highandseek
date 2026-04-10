import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'

async function getWeeklyXP(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const events = await XPEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$userId', total: { $sum: '$amount' } } },
  ]) as { _id: { toString(): string }; total: number }[]
  return Object.fromEntries(events.map(e => [e._id.toString(), e.total]))
}

async function getMonthlyXP(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const events = await XPEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$userId', total: { $sum: '$amount' } } },
  ]) as { _id: { toString(): string }; total: number }[]
  return Object.fromEntries(events.map(e => [e._id.toString(), e.total]))
}

type TabType = 'week' | 'month' | 'all'

export default async function LeaderboardPage(props: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/leaderboard')

  const { tab: rawTab } = await props.searchParams
  const tab: TabType = (rawTab === 'month' || rawTab === 'all') ? rawTab : 'week'

  const { t } = await getServerT()
  const lb = t.leaderboard

  await connectDB()

  const allUsers = await User.find({})
    .select('_id username xp level growsCompleted avatar')
    .lean<{ _id: { toString(): string }; username: string; xp: number; level: number; growsCompleted: number }[]>()

  let ranked: { id: string; username: string; xp: number; level: number; growsCompleted: number; score: number }[]

  if (tab === 'all') {
    ranked = allUsers
      .map(u => ({ id: u._id.toString(), username: u.username, xp: u.xp, level: u.level, growsCompleted: u.growsCompleted, score: u.xp }))
      .sort((a, b) => b.score - a.score)
  } else {
    const periodXP = tab === 'week' ? await getWeeklyXP() : await getMonthlyXP()
    ranked = allUsers
      .map(u => ({ id: u._id.toString(), username: u.username, xp: u.xp, level: u.level, growsCompleted: u.growsCompleted, score: periodXP[u._id.toString()] ?? 0 }))
      .sort((a, b) => b.score - a.score)
  }

  const top20 = ranked.slice(0, 20)
  const myRank = ranked.findIndex(u => u.id === session.user.id) + 1
  const me = ranked.find(u => u.id === session.user.id)
  const meInTop20 = myRank <= 20

  const RANK_COLORS = ['#f0a830', '#c0c0c0', '#cd7f32']
  const TABS: { value: TabType; label: string }[] = [
    { value: 'week',  label: lb.thisWeek },
    { value: 'month', label: lb.thisMonth },
    { value: 'all',   label: lb.allTime },
  ]

  return (
    <div style={{ maxWidth: '700px' }} className="px-4 pt-4 pb-10 md:px-6 md:pt-7">
      <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: 'Leaderboard' }]} color="#cc00aa" />
      <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '24px' }}>
        {lb.title}
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '6px', padding: '4px' }}>
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/hub/leaderboard?tab=${value}`}
            style={{
              flex: 1, textAlign: 'center',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px',
              padding: '8px', borderRadius: '4px', textDecoration: 'none',
              background: tab === value ? 'rgba(204,0,170,0.2)' : 'transparent',
              color: tab === value ? '#cc00aa' : '#4a6066',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {top20.map((u, i) => {
          const isMe = u.id === session.user.id
          const rank = i + 1
          return (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '6px',
              background: isMe ? 'rgba(204,0,170,0.1)' : 'rgba(13,13,16,0.8)',
              border: `0.5px solid ${isMe ? 'rgba(204,0,170,0.3)' : 'rgba(255,255,255,0.04)'}`,
            }}>
              {/* Rank */}
              <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                {rank <= 3 ? (
                  <span style={{ fontSize: '18px' }}>{['🥇', '🥈', '🥉'][rank - 1]}</span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: RANK_COLORS[rank - 1] ?? '#4a6066' }}>
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar initials */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(204,0,170,0.15)', border: '1px solid rgba(204,0,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#cc00aa', flexShrink: 0 }}>
                {u.username.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/hub/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: isMe ? '#cc00aa' : '#e8f0ef' }}>
                    {u.username}
                  </span>
                </Link>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '8px' }}>
                  Lv.{u.level} · {u.growsCompleted} {lb.grows}
                </span>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#f0a830' }}>
                  {u.score.toLocaleString()}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>XP</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* My rank if not in top 20 */}
      {!meInTop20 && me && (
        <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '6px', background: 'rgba(204,0,170,0.08)', border: '0.5px solid rgba(204,0,170,0.25)' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#cc00aa' }}>
            {lb.yourRank} #{myRank} · {me.score.toLocaleString()} XP
          </span>
        </div>
      )}
    </div>
  )
}
