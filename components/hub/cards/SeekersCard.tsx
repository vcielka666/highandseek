'use client'

interface Props {
  expanded?: boolean
  labels: {
    title:      string
    desc:       string
    comingSoon: string
    openApp:    string
  }
}

export default function SeekersCard({ expanded = false, labels }: Props) {
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

      {/* Map SVG dots */}
      <svg width="60" height="40" viewBox="0 0 60 40" style={{ opacity: 0.3 }}>
        {[[10,8],[30,15],[50,6],[20,28],[45,30],[35,20]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#f0a830" />
        ))}
        <line x1="10" y1="8" x2="30" y2="15" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="30" y1="15" x2="50" y2="6" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="30" y1="15" x2="20" y2="28" stroke="#f0a830" strokeWidth="0.5" />
        <line x1="45" y1="30" x2="35" y2="20" stroke="#f0a830" strokeWidth="0.5" />
      </svg>

      {expanded && (
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6 }}>
          {labels.desc}
        </div>
      )}

      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '20px', padding: '3px 10px' }}>
        {labels.comingSoon}
      </span>

      {expanded && (
        <a href="https://seekers-game.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.35)', borderRadius: '4px', padding: '8px 18px', textDecoration: 'none' }}>
          {labels.openApp}
        </a>
      )}
    </div>
  )
}
