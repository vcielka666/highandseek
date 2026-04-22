'use client'

export interface StrainPreview {
  slug:           string
  name:           string
  type:           string
  imageUrl:       string
  floweringTime?: number
  difficulty?:    string
}

interface Props {
  strains:     StrainPreview[]
  totalCount:  number
  expanded?:   boolean
  labels: {
    title:      string
    explore:    string
    strainCount: string
  }
}

const STRAIN_LOCAL: Record<string, string> = {
  'cherrygasm':   '/strains/cherrygasm.jpeg',
  'jack-herer':   '/strains/jackherer.png',
  'odb':          '/strains/ODB.png',
  'dosidos':      '/strains/dosidos.jpg',
  'milky-dreams': '/strains/milky-dreams.jpg',
  'tarte-tarin':  '/strains/tarte-tarin.jpg',
  'velvet-moon':  '/strains/velvet-moon.jpg',
}

const TYPE_COLOR: Record<string, string> = {
  indica:  '#8844cc',
  sativa:  '#00d4c8',
  hybrid:  '#cc00aa',
}

function StrainAvatar({ strain, size = 40 }: { strain: StrainPreview; size?: number }) {
  const img = STRAIN_LOCAL[strain.slug] || strain.imageUrl
  const color = TYPE_COLOR[strain.type] ?? '#4a6066'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${color}`, background: '#0d0d12', flexShrink: 0 }}>
      {img
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={img} alt={strain.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-orbitron)', fontSize: size * 0.3 + 'px', color, fontWeight: 700 }}>
            {strain.name.slice(0, 2).toUpperCase()}
          </div>
      }
    </div>
  )
}

export default function StrainCard({ strains, totalCount, expanded = false, labels }: Props) {
  const preview = strains.slice(0, 4)
  const remaining = totalCount - preview.length

  if (!expanded) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.55)' }}>
          {labels.title}
        </div>

        {/* Overlapping avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {preview.map((s, i) => (
            <div key={s.slug} style={{ marginLeft: i === 0 ? 0 : '-12px', zIndex: i }}>
              <StrainAvatar strain={s} size={42} />
            </div>
          ))}
          {remaining > 0 && (
            <div style={{ marginLeft: '-12px', width: 42, height: 42, borderRadius: '50%', background: 'rgba(204,0,170,0.12)', border: '2px solid rgba(204,0,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#cc00aa', zIndex: 4 }}>
              +{remaining}
            </div>
          )}
        </div>

        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
          {totalCount} {labels.strainCount}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px', height: '100%', overflowY: 'auto' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.55)', marginBottom: '20px' }}>
        {labels.title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {strains.map(s => (
          <a key={s.slug} href={`/hub/strains/${s.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <StrainAvatar strain={s} size={64} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', textAlign: 'center' }}>{s.name}</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: TYPE_COLOR[s.type] ?? '#4a6066', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.type}</span>
          </a>
        ))}
      </div>
      <a href="/hub/strains" style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#cc00aa', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', display: 'inline-block' }}>
        {labels.explore}
      </a>
    </div>
  )
}
