'use client'

import { useState, useEffect, useRef } from 'react'
import Breadcrumb from '@/components/ui/Breadcrumb'
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

const XP_INFO = [
  { icon: '⚡', label: 'XP & Levels', text: 'Every purchase earns XP. Level up to unlock perks.' },
  { icon: '🎁', label: 'Discounts', text: 'Higher levels = bigger shop discounts. Up to 20% off.' },
  { icon: '🌿', label: 'AI Strain Avatars', text: 'Each strain has an AI personality. Chat, get grow tips, earn bonus XP.' },
  { icon: '🏆', label: 'Credibility', text: 'Your level is your badge. Displayed in the Hub community.' },
]

function XpBadge() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', letterSpacing: '0.5px' }}>
          🌱 +50 XP on purchase
        </span>
      </button>

      {open && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8a5e1a' }}>
            Hub Progression System
          </div>
          {XP_INFO.map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', fontWeight: 700, color: '#f0a830', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.5)', lineHeight: 1.5 }}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, clearCart, totalPrice } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [telegramContact, setTelegramContact] = useState('')
  const [summaryVisible, setSummaryVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSummaryVisible(true), 2000); return () => clearTimeout(t) }, [])

  // Quick Contact state
  const [inquiryContact, setInquiryContact] = useState('')
  const [inquiryState, setInquiryState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const [form, setForm] = useState({
    email: session?.user?.email ?? '',
    name: '', address: '', city: '', postalCode: '', country: 'CZ',
  })

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleInquiry() {
    if (!inquiryContact.trim()) return
    setInquiryState('sending')
    try {
      const res = await fetch('/api/shop/cart/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramContact: inquiryContact.trim(),
          items: items.map((i) => ({
            cartKey: i.cartKey, productId: i.productId, slug: i.slug,
            name: i.name, price: i.price, image: i.image, quantity: i.quantity,
          })),
          subtotal: totalPrice(),
        }),
      })
      setInquiryState(res.ok ? 'sent' : 'error')
    } catch {
      setInquiryState('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    // Attach telegramContact to PI metadata before confirming
    if (telegramContact.trim()) {
      const piId = clientSecret.split('_secret_')[0]
      await fetch('/api/shop/checkout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: piId, telegramContact: telegramContact.trim() }),
      }).catch(() => { /* non-blocking */ })
    }

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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* Left: Form */}
        <div className="order-2 lg:order-1" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="11.5" stroke="#f0a830" strokeOpacity="0.5" strokeWidth="1" fill="rgba(240,168,48,0.1)" />
                    <path d="M17.5 7L5.5 11.5L9.5 13L11.5 18L13.5 14.5L17 16.5L17.5 7Z" fill="#f0a830" />
                    <path d="M9.5 13L11 11.5" stroke="#050508" strokeWidth="0.8" strokeLinecap="round" />
                  </svg>
                  <span>Telegram</span>
                  <span style={{ color: '#4a6066' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={telegramContact}
                  onChange={(e) => setTelegramContact(e.target.value)}
                  placeholder="@username or +420..."
                  style={{ ...inputStyle, borderColor: telegramContact ? 'rgba(240,168,48,0.3)' : 'rgba(240,168,48,0.12)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(240,168,48,0.5)' }}
                  onBlur={(e) => { e.target.style.borderColor = telegramContact ? 'rgba(240,168,48,0.3)' : 'rgba(240,168,48,0.12)' }}
                />
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '5px' }}>
                  For faster communication about your order
                </p>
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
            <PaymentElement options={{ layout: 'tabs' }} />
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
            Place order · {totalPrice().toLocaleString('cs-CZ')} Kč
          </button>
        </div>

        {/* Right: Order summary */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20" style={{
          background: '#0d0d10',
          border: '0.5px solid rgba(0,212,200,0.12)',
          borderRadius: '8px',
          padding: '20px',
          transform: summaryVisible ? 'perspective(1000px) rotateY(0deg)' : 'perspective(1000px) rotateY(-90deg)',
          opacity: summaryVisible ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
        }}>
          <div style={sectionTitleStyle}>Order Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {items.map((item) => (
              <div key={item.cartKey} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                  {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: '0.5px', background: 'rgba(0,212,200,0.1)', marginBottom: '14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a6066' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#00d4c8' }}>
              {totalPrice().toLocaleString('cs-CZ')} Kč
            </span>
          </div>

          {/* Quick Contact */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '0.5px solid rgba(240,168,48,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {/* Telegram official icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#29B6F6"/>
                <path d="M5.35 11.66 17.1 7.1c.56-.2 1.05.13.87.96l-2 9.43c-.15.67-.54.83-1.09.52l-3-2.21-1.44 1.39c-.16.16-.3.29-.6.29l.21-3.03 5.5-4.97c.24-.21-.05-.33-.37-.12L7.4 14.26l-2.95-.92c-.64-.2-.65-.64.13-.95Z" fill="#fff"/>
              </svg>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f0a830' }}>
                Want to consult before buying?
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.5)', lineHeight: 1.5, marginBottom: '12px' }}>
              Drop your Telegram handle and we'll reach out — no payment needed.
            </p>

            {inquiryState === 'sent' ? (
              <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8', letterSpacing: '0.5px' }}>
                ✓ Message sent! We'll be in touch shortly.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={inquiryContact}
                    onChange={(e) => setInquiryContact(e.target.value)}
                    placeholder="@username or +420..."
                    disabled={inquiryState === 'sending'}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.02)',
                      border: '0.5px solid rgba(240,168,48,0.2)',
                      borderRadius: '4px',
                      color: '#e8f0ef',
                      padding: '8px 10px',
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(240,168,48,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(240,168,48,0.2)' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInquiry() }}
                  />
                  <button
                    type="button"
                    onClick={handleInquiry}
                    disabled={inquiryState === 'sending' || !inquiryContact.trim()}
                    style={{
                      padding: '8px 12px',
                      background: inquiryContact.trim() ? '#f0a830' : 'rgba(240,168,48,0.15)',
                      color: inquiryContact.trim() ? '#050508' : '#4a6066',
                      fontFamily: 'var(--font-orbitron)',
                      fontSize: '9px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: inquiryContact.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inquiryState === 'sending' ? '...' : 'Send'}
                  </button>
                </div>
                {inquiryState === 'error' && (
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#cc00aa', marginTop: '6px' }}>
                    Something went wrong, please try again.
                  </p>
                )}
                <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '6px' }}>
                  Optional · No payment required
                </p>
              </>
            )}
          </div>
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
        userId: session?.user?.id ?? undefined,
        shippingAddress: { name: '', address: '', city: '', postalCode: '', country: 'CZ' },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret)
        else toast.error(d.error ?? 'Failed to initialise checkout')
      })
      .catch(() => toast.error('Failed to initialise checkout'))
  }, [items.length, session?.user?.email])

  return (
    <div style={{ padding: '24px 16px 64px', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '32px' }}>
        <Breadcrumb items={[{ label: 'Shop', href: '/shop' }, { label: 'Checkout' }]} />
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '10px' }}>
          Complete your order
        </h1>
        {session && <XpBadge />}
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
