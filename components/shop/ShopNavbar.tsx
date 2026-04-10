'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect, Suspense } from 'react'
import { useCart } from '@/stores/cartStore'

interface ShopNavbarProps {
  onOpenFilter: () => void
}

function ShopNavbarInner({ onOpenFilter }: ShopNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { openCart, totalItems } = useCart()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('q', search.trim())
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [search, searchParams, router, pathname])

  const cartCount = totalItems()

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '0 24px',
      background: 'rgba(5,5,8,0.95)',
      borderBottom: '0.5px solid rgba(0,212,200,0.12)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Mobile filter toggle */}
      <button
        onClick={onOpenFilter}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6066', padding: '4px', flexShrink: 0 }}
        className="flex lg:hidden hover:text-[#00d4c8] transition-colors"
        aria-label="Open filters"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
        </svg>
      </button>

      {/* Back to home */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#4a6066',
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        className="hidden lg:inline hover:text-[#00d4c8]"
        aria-label="Back to home"
      >
        ←
      </Link>

      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-cacha)',
          fontSize: '16px',
          letterSpacing: '2px',
          color: '#e8f0ef',
          textDecoration: 'none',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        HIGH<span style={{ color: '#00d4c8' }}>&</span>SEEK
      </Link>

      {/* Shop label — desktop */}
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', color: '#007a74', textTransform: 'uppercase', flexShrink: 0 }} className="hidden lg:inline">
        · Shop
      </span>

      {/* Hub cross-link — magenta accent */}
      <Link
        href="/hub"
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#4a6066',
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        className="hidden lg:inline hover:text-[#cc00aa]"
      >
        ⚡ Hub
      </Link>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search strains..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(0,212,200,0.15)',
              borderRadius: '4px',
              color: '#e8f0ef',
              padding: '7px 36px 7px 14px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.15)' }}
          />
          <button
            type="submit"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6066', display: 'flex', padding: 0 }}
            className="hover:text-[#00d4c8] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </form>

      {/* Cart icon */}
      <button
        onClick={openCart}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e8f0ef', display: 'flex', position: 'relative', padding: '4px', flexShrink: 0 }}
        className="hover:text-[#00d4c8] transition-colors"
        aria-label="Open cart"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {mounted && cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-4px',
            background: '#00d4c8',
            color: '#050508',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            fontWeight: 700,
            borderRadius: '8px',
            padding: '1px 5px',
            lineHeight: 1.4,
            minWidth: '16px',
            textAlign: 'center',
          }}>
            {cartCount}
          </span>
        )}
      </button>
    </nav>
  )
}

export default function ShopNavbar(props: ShopNavbarProps) {
  return (
    <Suspense fallback={
      <nav style={{ height: '56px', background: 'rgba(5,5,8,0.95)', borderBottom: '0.5px solid rgba(0,212,200,0.12)' }} />
    }>
      <ShopNavbarInner {...props} />
    </Suspense>
  )
}
