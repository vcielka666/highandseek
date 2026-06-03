'use client'

interface Props {
  expanded?:        boolean
  credits:          number
  treasuresClaimed: number
  isGuest?:         boolean
  labels: {
    title:          string
    desc:           string
    openApp:        string
    creditsLabel:   string
    treasuresLabel: string
  }
}

export default function SeekersCard({ expanded = false, credits, treasuresClaimed, isGuest = false, labels }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '16px', gap: '12px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.55)', alignSelf: expanded ? 'flex-start' : 'center' }}>
        {labels.title}
      </div>

      {/* Seekers icon */}
      <div style={{ width: expanded ? 64 : 48, height: expanded ? 64 : 48, borderRadius: '50%', overflow: 'hidden', background: '#06080a', border: '0.5px solid rgba(240,168,48,0.25)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
      </div>

      {/* Map dots */}
      <svg width="60" height="40" viewBox="0 0 60 40" style={{ opacity: 0.3 }}>
        {[[10,8],[30,15],[50,6],[20,28],[45,30],[35,20]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#f0a830" />
        ))}
        <line x1="10" y1="8" x2="30" y2="15" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="30" y1="15" x2="50" y2="6" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="30" y1="15" x2="20" y2="28" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="45" y1="30" x2="35" y2="20" stroke="#f0a830" strokeWidth="0.5" />
      </svg>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: expanded ? '20px' : '15px', color: '#f0a830', fontWeight: 700 }}>
            {credits}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginTop: '2px' }}>
            {labels.creditsLabel}
          </div>
        </div>
        <div style={{ width: '0.5px', height: '28px', background: 'rgba(240,168,48,0.2)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: expanded ? '20px' : '15px', color: '#f0a830', fontWeight: 700 }}>
            {treasuresClaimed}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginTop: '2px' }}>
            {labels.treasuresLabel}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6 }}>
          {labels.desc}
        </div>
      )}

      <a
        href={isGuest ? 'https://seekers-game.com/guest' : 'https://seekers-game.com'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-dm-mono)', fontSize: expanded ? '11px' : '9px', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.35)', borderRadius: '4px', padding: expanded ? '8px 18px' : '4px 12px', textDecoration: 'none', letterSpacing: '0.5px' }}
      >
        {labels.openApp}
      </a>
    </div>
  )
}
