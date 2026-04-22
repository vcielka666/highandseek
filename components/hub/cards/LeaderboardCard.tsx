'use client'

export interface LeaderUser {
  _id:      string
  username: string
  xp:       number
  level:    number
}

interface Props {
  users:     LeaderUser[]
  currentId: string
  expanded?: boolean
  labels: {
    title:    string
    fullLink: string
    you:      string
    lv:       string
  }
}

const RANK_COLORS = ['#f0a830', '#c0c0c0', '#cd7f32']
const RANK_ICONS  = ['🥇', '🥈', '🥉']

export default function LeaderboardCard({ users, currentId, expanded = false, labels }: Props) {
  const myRank = users.findIndex(u => u._id === currentId) + 1

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '16px', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.55)' }}>
          {labels.title}
        </div>
        {myRank > 0 && !expanded && (
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#cc00aa', fontWeight: 700 }}>#{myRank}</div>
        )}
      </div>

      {!expanded ? (
        /* Preview: top 3 stacked avatars + rank */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {users.slice(0, 3).map((u, i) => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>{RANK_ICONS[i]}</span>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', color: u._id === currentId ? '#cc00aa' : '#e8f0ef', fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.username}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: RANK_COLORS[i] ?? '#4a6066', flexShrink: 0 }}>
                {u.xp.toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {users.map((u, i) => {
            const isMe = u._id === currentId
            return (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', background: isMe ? 'rgba(204,0,170,0.08)' : 'transparent', border: isMe ? '0.5px solid rgba(204,0,170,0.2)' : '0.5px solid transparent' }}>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: RANK_COLORS[i] ?? '#4a6066', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={`/hub/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: isMe ? '#cc00aa' : '#e8f0ef' }}>{u.username}</span>
                  </a>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '8px' }}>{labels.lv}{u.level}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#f0a830', flexShrink: 0 }}>{u.xp.toLocaleString('en-US')} XP</span>
              </div>
            )
          })}
          <a href="/hub/leaderboard" style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#cc00aa', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', textAlign: 'center', display: 'block', marginTop: '8px' }}>
            {labels.fullLink}
          </a>
        </div>
      )}
    </div>
  )
}
