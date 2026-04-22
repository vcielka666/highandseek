'use client'

export interface ListingData {
  _id:      string
  title:    string
  category: string
  price:    number
  images:   string[]
}

interface Props {
  listings:     ListingData[]
  totalActive:  number
  expanded?:    boolean
  labels: {
    title:          string
    activeListings: string
    browse:         string
    post:           string
    noListings:     string
    free:           string
  }
}

const CAT_COLORS: Record<string, string> = {
  clones: '#00d4c8', seeds: '#cc00aa', equipment: '#8844cc',
  nutrients: '#f0a830', other: '#4a6066',
}
const CAT_EMOJI: Record<string, string> = {
  clones: '🌿', seeds: '🌱', equipment: '💡', nutrients: '⚗️', other: '📦',
}

export default function MarketplaceCard({ listings, totalActive, expanded = false, labels }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '16px', gap: '10px' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.6)' }}>
        {labels.title}
      </div>

      {!expanded ? (
        <>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '28px', fontWeight: 700, color: '#f0a830', lineHeight: 1 }}>
            {totalActive}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '0.5px' }}>
            {labels.activeListings}
          </div>
          {listings.slice(0, 1).map(l => (
            <div key={l._id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px', marginTop: '4px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: CAT_COLORS[l.category] ?? '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                {l.category}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#e8f0ef', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {l.title}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {listings.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
              {listings.map(l => {
                const color = CAT_COLORS[l.category] ?? '#4a6066'
                return (
                  <a key={l._id} href="/hub/marketplace" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${color}22`, borderRadius: '10px', overflow: 'hidden', display: 'block' }}>
                    {l.images?.[0]
                      ? /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={l.images[0]} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      : <div style={{ height: '80px', background: `${color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', opacity: 0.4 }}>
                          {CAT_EMOJI[l.category] ?? '📦'}
                        </div>
                    }
                    <div style={{ padding: '10px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>{l.category}</div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#e8f0ef', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{l.title}</div>
                      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: l.price === 0 ? '#00b450' : '#e8f0ef', marginTop: '4px' }}>
                        {l.price === 0 ? labels.free : `${l.price} €`}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066' }}>{labels.noListings}</div>
              <a href="/hub/marketplace/new" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '4px', padding: '7px 16px', textDecoration: 'none' }}>{labels.post}</a>
            </div>
          )}
          <a href="/hub/marketplace" style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#f0a830', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', textAlign: 'center', display: 'block', marginTop: '8px' }}>
            {labels.browse}
          </a>
        </>
      )}
    </div>
  )
}
