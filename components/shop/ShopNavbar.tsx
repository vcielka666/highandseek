'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useCart } from '@/stores/cartStore'

interface ShopNavbarProps {
  onOpenFilter: () => void
}

function ShopNavbarInner({ onOpenFilter }: ShopNavbarProps) {
  const { openCart, totalItems } = useCart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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

      {/* Hub button */}
      <Link
        href="/hub"
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#cc00aa',
          border: '0.5px solid rgba(204,0,170,0.3)',
          borderRadius: '4px',
          padding: '4px 12px',
          background: 'transparent',
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        className="hidden lg:inline-flex items-center hover:bg-[rgba(204,0,170,0.08)]"
      >
        Hub ↗
      </Link>

      <div style={{ flex: 1 }} />

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
