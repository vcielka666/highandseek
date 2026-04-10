'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useCart } from '@/stores/cartStore'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const COUNTRIES = [
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'HU', name: 'Hungary' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(0,212,200,0.18)',
  borderRadius: '4px',
  color: '#e8f0ef',
  padding: '10px 14px',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '9px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#4a6066',
  display: 'block',
  marginBottom: '6px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-orbitron)',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1px',
  color: '#e8f0ef',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '0.5px solid rgba(0,212,200,0.1)',
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, clearCart, totalPrice } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: session?.user?.email ?? '',
    name: '', address: '', city: '', postalCode: '', country: 'CZ',
  })

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/shop/success`,
        receipt_email: form.email,
        shipping: {
          name: form.name,
          address: {
            line1:       form.address,
            city:        form.city,
            postal_code: form.postalCode,
            country:     form.country,
          },
        },
      },
    })

    setLoading(false)

    if (error) {
      toast.error(error.message ?? 'Payment failed')
    } else {
      clearCart()
    }
  }

  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#00d4c8',
      colorBackground: '#0d0d12',
      colorText: '#e8f0ef',
      colorDanger: '#cc00aa',
      fontFamily: 'DM Sans, sans-serif',
      borderRadius: '4px',
    },
  }

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066' }}>Your cart is empty.</p>
        <Link href="/shop" style={{ color: '#00d4c8', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', textDecoration: 'none' }}>← Back to shop</Link>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="16" cy="16" r="13" stroke="rgba(0,212,200,0.15)" strokeWidth="2" />
              <path d="M16 3 A13 13 0 0 1 29 16" stroke="#00d4c8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a6066' }}>PROCESSING...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}
        className="max-lg:grid-cols-1">

        {/* Left: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Contact */}
          <div>
            <div style={sectionTitleStyle}>1. Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }}
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <div style={sectionTitleStyle}>2. Shipping</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)}
                  style={inputStyle} onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
              </div>
              <div>
                <label style={labelStyle}>Address *</label>
                <input type="text" required value={form.address} onChange={(e) => setField('address', e.target.value)}
                  style={inputStyle} onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" required value={form.city} onChange={(e) => setField('city', e.target.value)}
                    style={inputStyle} onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
                </div>
                <div>
                  <label style={labelStyle}>Postal Code *</label>
                  <input type="text" required value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)}
                    style={inputStyle} onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Country *</label>
                <select
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: '#0d0d12' }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <div style={sectionTitleStyle}>3. Payment</div>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <PaymentElement options={{ layout: 'tabs' }} />
            </Elements>
          </div>

          <button
            type="submit"
            disabled={!stripe || loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#00d4c8',
              color: '#050508',
              fontFamily: 'var(--font-cacha)',
              fontSize: '15px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: '4px',
              cursor: !stripe || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            className="hover:bg-[#00f5e8] hover:shadow-[0_0_20px_rgba(0,212,200,0.4)]"
          >
            Place order · €{totalPrice().toFixed(2)}
          </button>
        </div>

        {/* Right: Order summary */}
        <div style={{
          background: '#0d0d10',
          border: '0.5px solid rgba(0,212,200,0.12)',
          borderRadius: '8px',
          padding: '20px',
          position: 'sticky',
          top: '80px',
        }}>
          <div style={sectionTitleStyle}>Order Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '4px', background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.15)', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image
                    ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ opacity: 0.2 }}>◈</span></div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#e8f0ef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                    ×{item.quantity}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#00d4c8', flexShrink: 0 }}>
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: '0.5px', background: 'rgba(0,212,200,0.1)', marginBottom: '14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a6066' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#00d4c8' }}>
              €{totalPrice().toFixed(2)}
            </span>
          </div>
          {session && (
            <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(240,168,48,0.06)', border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', letterSpacing: '0.5px' }}>
                🌱 +50 XP on purchase
              </span>
            </div>
          )}
        </div>
      </form>
    </>
  )
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCart()
  const { data: session } = useSession()
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    fetch('/api/shop/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        customerEmail: session?.user?.email ?? 'guest@checkout.com',
        shippingAddress: { name: '', address: '', city: '', postalCode: '', country: 'CZ' },
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret) })
      .catch(() => toast.error('Failed to initialise checkout'))
  }, [items.length, session?.user?.email])

  return (
    <div style={{ padding: '32px 24px 64px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#007a74', marginBottom: '8px' }}>
          Shop · Checkout
        </div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef' }}>
          Complete your order
        </h1>
      </div>

      {!clientSecret ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="13" stroke="rgba(0,212,200,0.15)" strokeWidth="2" />
            <path d="M16 3 A13 13 0 0 1 29 16" stroke="#00d4c8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Preparing checkout...
        </div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#00d4c8',
                colorBackground: '#0d0d12',
                colorText: '#e8f0ef',
                colorDanger: '#cc00aa',
                fontFamily: 'DM Sans, sans-serif',
                borderRadius: '4px',
              },
            },
          }}
        >
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </div>
  )
}
