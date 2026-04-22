'use client'

interface Props {
  expanded?: boolean
  labels: {
    title:       string
    placeholder: string
    openForum:   string
    sources:     string[]
    suggestions: string[]
  }
}

export default function ForumCard({ expanded = false, labels }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '20px', gap: '12px' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(136,68,204,0.6)' }}>
        {labels.title}
      </div>

      {/* Typing indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8844cc', animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066' }}>{labels.placeholder}</span>
      </div>

      {/* Source chips */}
      {!expanded && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {labels.sources.map(s => (
            <span key={s} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#8844cc', border: '0.5px solid rgba(136,68,204,0.25)', borderRadius: '20px', padding: '2px 8px' }}>{s}</span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {expanded && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {labels.suggestions.map(q => (
              <a key={q} href={`/hub/forum?q=${encodeURIComponent(q)}`} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', border: '0.5px solid rgba(136,68,204,0.25)', borderRadius: '20px', padding: '5px 12px', textDecoration: 'none' }}>
                {q}
              </a>
            ))}
          </div>
          <a href="/hub/forum" style={{ marginTop: 'auto', fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#8844cc', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            {labels.openForum}
          </a>
        </>
      )}
    </div>
  )
}
