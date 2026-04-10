'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import OrderCard from '@/components/shop/OrderCard'
import type { OrderData } from '@/components/shop/OrderCard'

type Order = OrderData

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
        <Breadcrumb items={[{ label: 'Shop', href: '/shop' }, { label: 'Orders' }]} />
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
