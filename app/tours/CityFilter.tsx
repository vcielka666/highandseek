'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

const CITIES = [
  { label: 'Praha',     value: 'Praha',     active: true  },
  { label: 'Amsterdam', value: 'Amsterdam', active: false },
  { label: 'Barcelona', value: 'Barcelona', active: false },
  { label: 'Berlin',    value: 'Berlin',    active: false },
]

function CityFilterInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const selected     = searchParams.get('city') ?? 'Praha'

  function pick(city: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('city', city)
    router.push(`/tours?${params.toString()}`, { scroll: false })
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
      {CITIES.map(c => {
        const isSelected = selected === c.value
        return (
          <button
            key={c.value}
            onClick={() => c.active && pick(c.value)}
            disabled={!c.active}
            style={{
              padding: '7px 18px', borderRadius: '20px', cursor: c.active ? 'pointer' : 'default',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px',
              background: isSelected ? '#8844cc' : 'rgba(136,68,204,0.06)',
              color: isSelected ? '#050508' : c.active ? '#8844cc' : '#4a6066',
              border: `0.5px solid ${isSelected ? 'transparent' : 'rgba(136,68,204,0.2)'}`,
              fontWeight: isSelected ? 700 : 400,
              transition: 'all 0.15s',
              opacity: c.active ? 1 : 0.5,
            }}
          >
            {c.label}
            {!c.active && (
              <span style={{ marginLeft: '6px', fontSize: '9px', color: '#4a6066' }}>soon</span>
            )}
          </button>
        )
      })}

      {/* Your city CTA */}
      <a
        href="#waitlist"
        style={{
          padding: '7px 18px', borderRadius: '20px', cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px',
          background: 'transparent',
          color: '#4a6066',
          border: '0.5px solid rgba(74,96,102,0.3)',
          textDecoration: 'none',
          transition: 'all 0.15s',
        }}
      >
        + Your City
      </a>
    </div>
  )
}

export default function CityFilter() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {['Praha', 'Amsterdam', 'Barcelona', 'Berlin'].map(c => (
          <div key={c} style={{ padding: '7px 18px', borderRadius: '20px', background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.2)', height: '32px', width: '90px' }} />
        ))}
      </div>
    }>
      <CityFilterInner />
    </Suspense>
  )
}
