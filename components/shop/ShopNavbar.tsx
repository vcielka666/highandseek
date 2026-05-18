'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useCart } from '@/stores/cartStore'
import { useLanguage } from '@/stores/languageStore'

interface ShopNavbarProps {
  onOpenFilter: () => void
}

function ShopNavbarInner({ onOpenFilter }: ShopNavbarProps) {
  const { openCart, totalItems } = useCart()
  const { t } = useLanguage()
  const d = t.hubNavbar
  const [mounted, setMounted] = useState(false)
  const [hubAlert, setHubAlert] = useState(false)
  useEffect(() => setMounted(true), [])

  const cartCount = totalItems()

  return (
    <>
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

        {/* Explore button — shows multi-pillar picker */}
        <button
          onClick={() => setHubAlert(true)}
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
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,170,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {d.explore} ↗
        </button>

        {/* Shop label — desktop only */}
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', color: '#007a74', textTransform: 'uppercase', flexShrink: 0 }} className="hidden lg:inline">
          · Shop
        </span>

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

      {/* Explore modal */}
      {hubAlert && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          onClick={() => setHubAlert(false)}
        >
          <div
            style={{ background: '#0d0d12', border: '0.5px solid rgba(204,0,170,0.3)', borderRadius: '16px', padding: '32px 28px', maxWidth: '320px', width: 'calc(100vw - 48px)', display: 'flex', flexDirection: 'column', gap: '12px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '20px', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '8px' }}>
              {d.hubAlertTitle}
            </div>
            <Link
              href="/hub"
              style={{ fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#cc00aa', background: 'rgba(204,0,170,0.08)', border: 'none', boxShadow: '0 0 20px rgba(204,0,170,0.1), inset 0 0 20px rgba(204,0,170,0.05)', borderRadius: '6px', padding: '14px 16px', textDecoration: 'none', textAlign: 'center', display: 'block', transition: 'all 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(204,0,170,0.15)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 0 40px rgba(204,0,170,0.25),inset 0 0 30px rgba(204,0,170,0.08)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(204,0,170,0.08)'; el.style.transform = ''; el.style.boxShadow = '0 0 20px rgba(204,0,170,0.1),inset 0 0 20px rgba(204,0,170,0.05)' }}
            >
              {d.hubAlertConfirm}
            </Link>
            <Link
              href="/tours"
              style={{ fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#8844cc', background: 'rgba(136,68,204,0.08)', border: 'none', boxShadow: '0 0 20px rgba(136,68,204,0.1), inset 0 0 20px rgba(136,68,204,0.05)', borderRadius: '6px', padding: '14px 16px', textDecoration: 'none', textAlign: 'center', display: 'block', transition: 'all 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(136,68,204,0.15)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 0 40px rgba(136,68,204,0.25),inset 0 0 30px rgba(136,68,204,0.08)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(136,68,204,0.08)'; el.style.transform = ''; el.style.boxShadow = '0 0 20px rgba(136,68,204,0.1),inset 0 0 20px rgba(136,68,204,0.05)' }}
            >
              {d.toursAlertConfirm}
            </Link>
            <button
              onClick={() => setHubAlert(false)}
              style={{ padding: '10px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', transition: 'border-color 0.15s', marginTop: '4px' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              {d.hubAlertCancel}
            </button>
          </div>
        </div>
      )}
    </>
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
