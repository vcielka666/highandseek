'use client'

interface Props {
  expanded?: boolean
  labels: {
    title:    string
    subtitle: string
    open:     string
    topics:   Array<{ emoji: string; title: string; desc: string; color: string }>
  }
}

export default function AcademyCard({ expanded = false, labels }: Props) {
  const dots = labels.topics.slice(0, 5)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '16px', gap: '10px' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)' }}>
        {labels.title}
      </div>

      {!expanded ? (
        <>
          {/* Topic dots */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {dots.map((t, i) => (
              <div key={i} title={t.title} style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.4 }}>
            {labels.subtitle}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
            {labels.topics.map(t => (
              <a key={t.title} href="/hub/academy" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${t.color}22`, borderRadius: '10px', padding: '14px 12px', display: 'block' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{t.emoji}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', fontWeight: 700, color: t.color, marginBottom: '4px' }}>{t.title}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.4 }}>{t.desc}</div>
              </a>
            ))}
          </div>
          <a href="/hub/academy" style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', textAlign: 'center', display: 'block', marginTop: '8px' }}>
            {labels.open}
          </a>
        </>
      )}
    </div>
  )
}
