'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type OrderItem = { productId: string; name: string; quantity: number; price: number }
type Order = {
  _id: string
  items: OrderItem[]
  totalAmount: number
  currency: string
  status: string
  customerEmail: string
  shippingAddress: { name: string; address: string; city: string; postalCode: string; country: string }
  stripePaymentIntentId: string
  createdAt: string
  xpAwarded: boolean
}

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  paid:      { color: '#00d4c8', bg: 'rgba(0,212,200,0.08)',  border: 'rgba(0,212,200,0.2)',  label: 'Paid'      },
  shipped:   { color: '#f0a830', bg: 'rgba(240,168,48,0.08)', border: 'rgba(240,168,48,0.2)', label: 'Shipped'   },
  delivered: { color: '#8844cc', bg: 'rgba(136,68,204,0.08)', border: 'rgba(136,68,204,0.2)', label: 'Delivered' },
  pending:   { color: '#4a6066', bg: 'rgba(74,96,102,0.08)',  border: 'rgba(74,96,102,0.2)',  label: 'Pending'   },
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const s = STATUS[order.status] ?? STATUS.pending
  const ref = order._id.slice(-8).toUpperCase()
  const date = new Date(order.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = new Date(order.createdAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  const hasShipping = !!(order.shippingAddress?.city)

  return (
    <div style={{ background: '#0d0d10', border: '0.5px solid rgba(0,212,200,0.12)', borderRadius: '8px', overflow: 'hidden' }}>

      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Order ref */}
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef', letterSpacing: '1.5px' }}>
            #{ref}
          </span>
          {/* Status */}
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: s.color, background: s.bg, border: `0.5px solid ${s.border}`, padding: '3px 9px', borderRadius: '3px' }}>
            {s.label}
          </span>
          {/* XP */}
          {order.xpAwarded && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '0.5px' }}>
              🌱 +50 XP
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '15px', fontWeight: 700, color: '#00d4c8' }}>
              {order.totalAmount.toLocaleString('cs-CZ')} Kč
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '2px' }}>
              {date} · {time}
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a6066" strokeWidth="1.5"
            style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid rgba(0,212,200,0.08)' }}>

          {/* Items table */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
              Items
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px 90px', padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                {[
                  { label: 'Product',    align: 'left'  },
                  { label: 'Unit price', align: 'right' },
                  { label: 'Qty',        align: 'right' },
                  { label: 'Subtotal',   align: 'right' },
                ].map(h => (
                  <span key={h.label} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#2a3a3e', textAlign: h.align as React.CSSProperties['textAlign'] }}>{h.label}</span>
                ))}
              </div>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px 90px', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{item.name}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'right' }}>
                    {item.price.toLocaleString('cs-CZ')} Kč
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'right' }}>
                    ×{item.quantity}
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8', textAlign: 'right' }}>
                    {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              ))}
              {/* Total row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#00d4c8' }}>
                  {order.totalAmount.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>
          </div>

          {/* Bottom row: shipping + meta */}
          <div style={{ display: 'grid', gridTemplateColumns: hasShipping ? '1fr 1fr' : '1fr', gap: '0', borderTop: '0.5px solid rgba(0,212,200,0.06)' }}
            className="max-sm:grid-cols-1">

            {/* Shipping */}
            {hasShipping && (
              <div style={{ padding: '14px 20px', borderRight: '0.5px solid rgba(0,212,200,0.06)' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
                  Ships to
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.6)', lineHeight: 1.7 }}>
                  {order.shippingAddress.name && <div>{order.shippingAddress.name}</div>}
                  {order.shippingAddress.address && <div>{order.shippingAddress.address}</div>}
                  {(order.shippingAddress.postalCode || order.shippingAddress.city) && (
                    <div>{order.shippingAddress.postalCode} {order.shippingAddress.city}</div>
                  )}
                  {order.shippingAddress.country && <div style={{ color: '#4a6066' }}>{order.shippingAddress.country}</div>}
                </div>
              </div>
            )}

            {/* Order meta */}
            <div style={{ padding: '14px 20px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
                Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', minWidth: '60px' }}>Order</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', letterSpacing: '0.5px' }}>#{ref}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', minWidth: '60px' }}>Date</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{date}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', minWidth: '60px' }}>Email</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', wordBreak: 'break-all' }}>{order.customerEmail}</span>
                </div>
                {order.stripePaymentIntentId && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', minWidth: '60px' }}>Payment</span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e', wordBreak: 'break-all' }}>
                      {order.stripePaymentIntentId.slice(-12).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login?callbackUrl=/shop/orders')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/shop/orders')
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  return (
    <div style={{ padding: '24px 16px 64px', maxWidth: '800px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#007a74', marginBottom: '8px' }}>
          Shop · Orders
        </div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef' }}>
          Order History
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="13" stroke="rgba(0,212,200,0.15)" strokeWidth="2" />
            <path d="M16 3 A13 13 0 0 1 29 16" stroke="#00d4c8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#0d0d10', border: '0.5px solid rgba(0,212,200,0.12)', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px', opacity: 0.3 }}>📦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066', marginBottom: '20px' }}>No orders yet.</div>
          <Link href="/shop" style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none' }}>
            Start Shopping →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginBottom: '16px', letterSpacing: '0.5px' }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} · click any row to expand
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map((order) => <OrderCard key={order._id} order={order} />)}
          </div>
        </>
      )}

      <div style={{ marginTop: '28px' }}>
        <Link href="/shop" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', textDecoration: 'none' }}
          className="hover:text-[#00d4c8]">
          ← Back to Shop
        </Link>
      </div>
    </div>
  )
}
