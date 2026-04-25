'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useRef, useEffect, Suspense } from 'react'

function SortBarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'price_asc'
  const q    = searchParams.get('q') ?? ''

  const [searchOpen, setSearchOpen] = useState(!!q)
  const [searchVal, setSearchVal]   = useState(q)
  const inputRef     = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus()
  }, [searchOpen])

  // Real-time filtering — debounced 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ q: searchVal.trim() || null })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchVal])

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k)
      else params.set(k, v)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleSort = () => navigate({ sort: sort === 'price_asc' ? 'price_desc' : 'price_asc' })

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigate({ q: searchVal.trim() || null })
  }

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchVal('')
    navigate({ q: null })
  }

  const priceActive = sort !== 'price_asc'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

      {/* Price toggle */}
      <button
        onClick={toggleSort}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
          padding: '5px 10px', borderRadius: '3px', cursor: 'pointer',
          border: `0.5px solid ${priceActive ? 'rgba(0,212,200,0.4)' : 'rgba(255,255,255,0.06)'}`,
          color: priceActive ? '#00d4c8' : '#4a6066',
          background: priceActive ? 'rgba(0,212,200,0.06)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        <span>Price</span>
        <span style={{ fontSize: '9px', lineHeight: 1 }}>{sort === 'price_asc' ? '▲' : '▼'}</span>
      </button>

      {/* Search icon + dropdown */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setSearchOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '3px', cursor: 'pointer',
            border: `0.5px solid ${q || searchOpen ? 'rgba(0,212,200,0.4)' : 'rgba(255,255,255,0.06)'}`,
            color: q || searchOpen ? '#00d4c8' : '#4a6066',
            background: q || searchOpen ? 'rgba(0,212,200,0.06)' : 'transparent',
            transition: 'all 0.15s',
          }}
          aria-label="Search"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {searchOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            background: 'rgba(5,5,8,0.98)',
            border: '0.5px solid rgba(0,212,200,0.2)',
            borderRadius: '8px', padding: '12px',
            width: '280px', zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
          }}>
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: '6px' }}>
              <input
                ref={inputRef}
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search strains..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(0,212,200,0.2)',
                  borderRadius: '4px', color: '#e8f0ef',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#00d4c8')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,212,200,0.2)')}
              />
              <button
                type="submit"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: '4px',
                  background: '#00d4c8', border: 'none', cursor: 'pointer',
                  color: '#050508', fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                  letterSpacing: '0.5px', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#00f0e0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#00d4c8')}
              >
                →
              </button>
            </form>
            {q && (
              <button
                onClick={clearSearch}
                style={{
                  marginTop: '8px', width: '100%', padding: '5px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  color: '#4a6066', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#cc00aa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a6066')}
              >
                ✕ clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SortBar() {
  return (
    <Suspense fallback={<div style={{ height: '28px' }} />}>
      <SortBarInner />
    </Suspense>
  )
}
