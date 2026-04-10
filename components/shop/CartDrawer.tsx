'use client'

import { useCart } from '@/stores/cartStore'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } = useCart()
  const { data: session } = useSession()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, backdropFilter: 'blur(2px)' }}
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(380px, 100vw)',
          height: '100vh',
          zIndex: 301,
          background: '#0d0d10',
          borderLeft: '0.5px solid rgba(0,212,200,0.2)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          boxShadow: isOpen ? '-4px 0 60px rgba(0,0,0,0.7)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '0.5px solid rgba(0,212,200,0.1)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-cacha)', fontSize: '16px', letterSpacing: '1px', color: '#e8f0ef' }}>
                YOUR CART
              </span>
              {items.length > 0 && (
                <span style={{
                  background: '#00d4c8',
                  color: '#050508',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '2px 8px',
                  lineHeight: 1.4,
                }}>
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </div>
            <Link
              href="/shop/orders"
              onClick={closeCart}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', textDecoration: 'none', transition: 'color 0.15s' }}
              className="hover:text-[#00d4c8]"
            >
              Order history →
            </Link>
          </div>
          <button
            onClick={closeCart}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6066', display: 'flex', padding: '4px' }}
            className="hover:text-[#e8f0ef] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '12px',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a6066" strokeWidth="1">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', color: '#4a6066' }}>
                Cart is empty
              </span>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartKey} style={{
                display: 'flex',
                gap: '14px',
                padding: '16px 24px',
                borderBottom: '0.5px solid rgba(255,255,255,0.04)',
              }}>
                {/* Image */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '4px',
                  background: 'rgba(0,212,200,0.05)',
                  border: '0.5px solid rgba(0,212,200,0.15)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '18px', opacity: 0.3 }}>◈</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#e8f0ef', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8' }}>
                    {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => updateQty(item.cartKey, item.quantity - 1)}
                      style={{ width: '22px', height: '22px', borderRadius: '3px', border: '0.5px solid rgba(0,212,200,0.2)', background: 'transparent', color: '#e8f0ef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                    >−</button>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#e8f0ef', minWidth: '16px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.cartKey, item.quantity + 1)}
                      style={{ width: '22px', height: '22px', borderRadius: '3px', border: '0.5px solid rgba(0,212,200,0.2)', background: 'transparent', color: '#e8f0ef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                    >+</button>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6066', display: 'flex', padding: '2px' }}
                      className="hover:text-[#cc00aa] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '0.5px solid rgba(0,212,200,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>
                Subtotal
              </span>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#00d4c8' }}>
                {totalPrice().toLocaleString('cs-CZ')} Kč
              </span>
            </div>
            <Link
              href="/shop/checkout"
              onClick={closeCart}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px',
                textAlign: 'center',
                background: '#00d4c8',
                color: '#050508',
                fontFamily: 'var(--font-cacha)',
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderRadius: '4px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                marginBottom: '10px',
              }}
              className="hover:bg-[#00f5e8] hover:shadow-[0_0_20px_rgba(0,212,200,0.4)]"
            >
              Checkout →
            </Link>
            <button
              onClick={closeCart}
              style={{
                width: '100%',
                padding: '11px',
                background: 'transparent',
                border: '0.5px solid rgba(0,212,200,0.2)',
                borderRadius: '4px',
                color: '#4a6066',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="hover:border-[#00d4c8] hover:text-[#00d4c8]"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
