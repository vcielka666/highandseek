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

function validateTelegram(val: string): string {
  if (!val.trim()) return ''
  const v = val.trim()
  if (v.startsWith('+')) {
    const digits = v.slice(1).replace(/\D/g, '')
    if (digits.length < 7)  return 'Phone number too short (min 7 digits)'
    if (digits.length > 15) return 'Phone number too long (max 15 digits)'
    if (/[^\d\s\-+()]/.test(v.slice(1))) return 'Phone number contains invalid characters'
    return ''
  }
  if (v.startsWith('@')) {
    const handle = v.slice(1)
    if (handle.length < 5)  return 'Username too short (min 5 characters after @)'
    if (handle.length > 32) return 'Username too long (max 32 characters)'
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) return 'Username can only contain letters, numbers and underscores'
    return ''
  }
  return 'Must start with @ for username (e.g. @yourname) or + for phone (e.g. +420...)'
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, clearCart, totalPrice, updateQty, removeItem } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [telegramContact, setTelegramContact] = useState('')
  const [telegramError, setTelegramError] = useState('')
  const [summaryVisible, setSummaryVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSummaryVisible(true), 1000); return () => clearTimeout(t) }, [])

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponState, setCouponState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [couponData, setCouponData] = useState<{ discount: number; label: string } | null>(null)

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponState('checking')
    try {
      const res = await fetch(`/api/shop/coupon/validate?code=${encodeURIComponent(couponCode.trim())}`)
      const data = await res.json()
      if (res.ok && data.discount) {
        setCouponData({ discount: data.discount, label: data.code })
        setCouponState('valid')
      } else {
        setCouponData(null)
        setCouponState('invalid')
      }
    } catch {
      setCouponState('invalid')
    }
  }

  const discountAmount = couponData ? Math.round(totalPrice() * (couponData.discount / 100)) : 0
  const finalPrice = totalPrice() - discountAmount

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
                  onChange={(e) => {
                    setTelegramContact(e.target.value)
                    setTelegramError(validateTelegram(e.target.value))
                  }}
                  placeholder="@username or +420..."
                  style={{ ...inputStyle, borderColor: telegramError ? 'rgba(255,80,80,0.5)' : telegramContact ? 'rgba(240,168,48,0.3)' : 'rgba(240,168,48,0.12)' }}
                  onFocus={(e) => { e.target.style.borderColor = telegramError ? 'rgba(255,80,80,0.5)' : 'rgba(240,168,48,0.5)' }}
                  onBlur={(e) => { e.target.style.borderColor = telegramError ? 'rgba(255,80,80,0.4)' : telegramContact ? 'rgba(240,168,48,0.3)' : 'rgba(240,168,48,0.12)' }}
                />
                {telegramError ? (
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(255,80,80,0.8)', marginTop: '5px' }}>
                    ⚠ {telegramError}
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '5px' }}>
                    For faster communication about your order
                  </p>
                )}
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
            Place order · {finalPrice.toLocaleString('cs-CZ')} Kč
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
              <div key={item.cartKey} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <button type="button" onClick={() => updateQty(item.cartKey, item.quantity - 1)} style={{ width: '18px', height: '18px', background: 'rgba(0,212,200,0.1)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '3px', color: '#00d4c8', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>−</button>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.cartKey, item.quantity + 1)} style={{ width: '18px', height: '18px', background: 'rgba(0,212,200,0.1)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '3px', color: '#00d4c8', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>+</button>
                    <button type="button" onClick={() => removeItem(item.cartKey)} style={{ marginLeft: '4px', background: 'none', border: 'none', color: '#4a6066', fontSize: '14px', cursor: 'pointer', padding: 0, lineHeight: 1 }} title="Remove">×</button>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#00d4c8', flexShrink: 0 }}>
                  {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponState('idle'); setCouponData(null) }}
                placeholder="COUPON CODE"
                style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${couponState === 'valid' ? 'rgba(0,212,200,0.5)' : couponState === 'invalid' ? 'rgba(255,80,80,0.4)' : 'rgba(0,212,200,0.15)'}`, borderRadius: '4px', color: '#e8f0ef', padding: '7px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', outline: 'none' }}
              />
              <button type="button" onClick={applyCoupon} disabled={!couponCode.trim() || couponState === 'checking'} style={{ padding: '7px 12px', background: 'rgba(0,212,200,0.1)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '4px', color: '#00d4c8', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {couponState === 'checking' ? '...' : 'Apply'}
              </button>
            </div>
            {couponState === 'valid' && couponData && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', marginTop: '4px' }}>
                ✓ {couponData.label} — {couponData.discount}% off applied
              </div>
            )}
            {couponState === 'invalid' && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(255,80,80,0.8)', marginTop: '4px' }}>
                ✗ Invalid or expired coupon code
              </div>
            )}
          </div>

          <div style={{ height: '0.5px', background: 'rgba(0,212,200,0.1)', marginBottom: '14px' }} />
          {couponData && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>Discount ({couponData.discount}%)</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#00d4c8' }}>−{discountAmount.toLocaleString('cs-CZ')} Kč</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a6066' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#00d4c8' }}>
              {finalPrice.toLocaleString('cs-CZ')} Kč
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

// 1 credit = 25 Kč when paying in the shop (must match /api/shop/checkout/credits/route.ts)
const CREDIT_TO_CZK = 25

function CreditCheckoutForm({
  creditsNeeded, hasEnough, userCredits, session,
}: {
  creditsNeeded: number
  hasEnough: boolean
  userCredits: number
  session: ReturnType<typeof useSession>['data']
}) {
  const { items, clearCart, totalPrice, updateQty, removeItem } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [summaryVisible, setSummaryVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSummaryVisible(true), 1000); return () => clearTimeout(t) }, [])

  const [form, setForm] = useState({
    email: session?.user?.email ?? '',
    name: '', address: '', city: '', postalCode: '', country: 'CZ',
    telegramContact: '',
  })
  const [telegramErrorC, setTelegramErrorC] = useState('')
  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const [couponCodeC, setCouponCodeC] = useState('')
  const [couponStateC, setCouponStateC] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [couponDataC, setCouponDataC] = useState<{ discount: number; label: string } | null>(null)

  async function applyCouponC() {
    if (!couponCodeC.trim()) return
    setCouponStateC('checking')
    try {
      const res = await fetch(`/api/shop/coupon/validate?code=${encodeURIComponent(couponCodeC.trim())}`)
      const data = await res.json()
      if (res.ok && data.discount) {
        setCouponDataC({ discount: data.discount, label: data.code })
        setCouponStateC('valid')
      } else {
        setCouponDataC(null)
        setCouponStateC('invalid')
      }
    } catch {
      setCouponStateC('invalid')
    }
  }

  const discountAmountC = couponDataC ? Math.round(totalPrice() * (couponDataC.discount / 100)) : 0
  const finalPriceC = totalPrice() - discountAmountC
  const creditsNeededFinal = Math.ceil(finalPriceC / CREDIT_TO_CZK)
  const hasEnoughFinal = userCredits >= creditsNeededFinal

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!hasEnoughFinal) return
    setLoading(true)
    try {
      const res = await fetch('/api/shop/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity, price: i.price })),
          customerEmail: form.email,
          telegramContact: form.telegramContact || undefined,
          shippingAddress: { name: form.name, address: form.address, city: form.city, postalCode: form.postalCode, country: form.country },
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Payment failed'); return }
      clearCart()
      router.push(`/shop/success?status=succeeded&order_id=${data.orderId}`)
    } finally {
      setLoading(false)
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
              <circle cx="16" cy="16" r="13" stroke="rgba(204,0,170,0.15)" strokeWidth="2" />
              <path d="M16 3 A13 13 0 0 1 29 16" stroke="#cc00aa" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', color: '#4a6066' }}>PROCESSING...</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="order-2 lg:order-1" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Contact */}
          <div>
            <div style={sectionTitleStyle}>1. Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)}
                  style={inputStyle} onFocus={e => { e.target.style.borderColor = '#cc00aa' }} onBlur={e => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
              </div>
              <div>
                <label style={labelStyle}>Telegram <span style={{ color: '#4a6066' }}>(optional)</span></label>
                <input type="text" value={form.telegramContact}
                  onChange={e => { setField('telegramContact', e.target.value); setTelegramErrorC(validateTelegram(e.target.value)) }}
                  placeholder="@username or +420..."
                  style={{ ...inputStyle, borderColor: telegramErrorC ? 'rgba(255,80,80,0.5)' : form.telegramContact ? 'rgba(240,168,48,0.3)' : 'rgba(240,168,48,0.12)' }} />
                {telegramErrorC && (
                  <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(255,80,80,0.8)', marginTop: '5px' }}>⚠ {telegramErrorC}</p>
                )}
              </div>
            </div>
          </div>
          {/* Shipping */}
          <div>
            <div style={sectionTitleStyle}>2. Shipping</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)}
                  style={inputStyle} onFocus={e => { e.target.style.borderColor = '#cc00aa' }} onBlur={e => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
              </div>
              <div>
                <label style={labelStyle}>Address *</label>
                <input type="text" required value={form.address} onChange={e => setField('address', e.target.value)}
                  style={inputStyle} onFocus={e => { e.target.style.borderColor = '#cc00aa' }} onBlur={e => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" required value={form.city} onChange={e => setField('city', e.target.value)}
                    style={inputStyle} onFocus={e => { e.target.style.borderColor = '#cc00aa' }} onBlur={e => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
                </div>
                <div>
                  <label style={labelStyle}>Postal Code *</label>
                  <input type="text" required value={form.postalCode} onChange={e => setField('postalCode', e.target.value)}
                    style={inputStyle} onFocus={e => { e.target.style.borderColor = '#cc00aa' }} onBlur={e => { e.target.style.borderColor = 'rgba(0,212,200,0.18)' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Country *</label>
                <select value={form.country} onChange={e => setField('country', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} style={{ background: '#0d0d12' }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Credit payment summary */}
          <div>
            <div style={sectionTitleStyle}>3. Pay with Credits</div>
            <div style={{
              background: hasEnoughFinal ? 'rgba(204,0,170,0.06)' : 'rgba(255,60,60,0.06)',
              border: `0.5px solid ${hasEnoughFinal ? 'rgba(204,0,170,0.25)' : 'rgba(255,60,60,0.25)'}`,
              borderRadius: '6px', padding: '16px', marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order total
                </span>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', color: '#e8f0ef' }}>
                  {finalPriceC.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rate
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                  1 💎 = {CREDIT_TO_CZK} Kč
                </span>
              </div>
              <div style={{ height: '0.5px', background: 'rgba(204,0,170,0.15)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Credits charged
                </span>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#cc00aa' }}>
                  💎 {creditsNeededFinal}
                </span>
              </div>
              {!hasEnoughFinal && (
                <div style={{ marginTop: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'rgba(255,80,80,0.8)' }}>
                  ⚠️ You have {userCredits} credits — need {creditsNeededFinal - userCredits} more.{' '}
                  <Link href="/hub/credits" style={{ color: '#cc00aa', textDecoration: 'underline' }}>Get credits →</Link>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !hasEnoughFinal}
            style={{
              width: '100%', padding: '14px',
              background: hasEnoughFinal ? '#cc00aa' : '#4a6066',
              color: '#050508',
              fontFamily: 'var(--font-cacha)', fontSize: '15px', letterSpacing: '1.5px', textTransform: 'uppercase',
              border: 'none', borderRadius: '4px',
              cursor: hasEnoughFinal && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            💎 Pay {creditsNeededFinal} Credits
          </button>
        </div>

        {/* Right: Order summary */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20" style={{
          background: '#0d0d10', border: '0.5px solid rgba(204,0,170,0.12)',
          borderRadius: '8px', padding: '20px',
          transform: summaryVisible ? 'perspective(1000px) rotateY(0deg)' : 'perspective(1000px) rotateY(-90deg)',
          opacity: summaryVisible ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
        }}>
          <div style={sectionTitleStyle}>Order Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {items.map((item) => (
              <div key={item.cartKey} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '4px', background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.15)', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image
                    ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ opacity: 0.2 }}>◈</span></div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#e8f0ef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <button type="button" onClick={() => updateQty(item.cartKey, item.quantity - 1)} style={{ width: '18px', height: '18px', background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.25)', borderRadius: '3px', color: '#cc00aa', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>−</button>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.cartKey, item.quantity + 1)} style={{ width: '18px', height: '18px', background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.25)', borderRadius: '3px', color: '#cc00aa', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>+</button>
                    <button type="button" onClick={() => removeItem(item.cartKey)} style={{ marginLeft: '4px', background: 'none', border: 'none', color: '#4a6066', fontSize: '14px', cursor: 'pointer', padding: 0, lineHeight: 1 }} title="Remove">×</button>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#cc00aa', flexShrink: 0 }}>
                  {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={couponCodeC} onChange={e => { setCouponCodeC(e.target.value.toUpperCase()); setCouponStateC('idle'); setCouponDataC(null) }}
                placeholder="COUPON CODE"
                style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${couponStateC === 'valid' ? 'rgba(204,0,170,0.5)' : couponStateC === 'invalid' ? 'rgba(255,80,80,0.4)' : 'rgba(204,0,170,0.15)'}`, borderRadius: '4px', color: '#e8f0ef', padding: '7px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', outline: 'none' }} />
              <button type="button" onClick={applyCouponC} disabled={!couponCodeC.trim() || couponStateC === 'checking'} style={{ padding: '7px 12px', background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.25)', borderRadius: '4px', color: '#cc00aa', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {couponStateC === 'checking' ? '...' : 'Apply'}
              </button>
            </div>
            {couponStateC === 'valid' && couponDataC && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#cc00aa', marginTop: '4px' }}>✓ {couponDataC.label} — {couponDataC.discount}% off</div>
            )}
            {couponStateC === 'invalid' && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(255,80,80,0.8)', marginTop: '4px' }}>✗ Invalid or expired coupon code</div>
            )}
          </div>

          <div style={{ height: '0.5px', background: 'rgba(204,0,170,0.1)', marginBottom: '14px' }} />
          {couponDataC && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>Discount ({couponDataC.discount}%)</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#cc00aa' }}>−{discountAmountC.toLocaleString('cs-CZ')} Kč</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a6066' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#cc00aa' }}>
              {finalPriceC.toLocaleString('cs-CZ')} Kč
            </span>
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'credits'>('card')
  const [userCredits, setUserCredits] = useState<number | null>(null)

  const creditsNeeded = Math.ceil(totalPrice() / CREDIT_TO_CZK)
  const hasEnoughCredits = userCredits !== null && userCredits >= creditsNeeded

  // Fetch user credits
  useEffect(() => {
    if (!session) return
    fetch('/api/hub/grow')
      .then(r => r.json())
      .then(d => { if (typeof d.credits === 'number') setUserCredits(d.credits) })
      .catch(() => null)
  }, [session])

  // Create Stripe PI only when card is selected
  useEffect(() => {
    if (items.length === 0 || paymentMethod !== 'card') return
    if (clientSecret) return // already created
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
  }, [items.length, session?.user?.email, paymentMethod, clientSecret])

  return (
    <div style={{ padding: '24px 16px 64px', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '28px' }}>
        <Breadcrumb items={[{ label: 'Shop', href: '/shop' }, { label: 'Checkout' }]} />
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '10px' }}>
          Complete your order
        </h1>
        {session && <XpBadge />}
      </div>

      {/* Payment method selector */}
      {session && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <button
            onClick={() => setPaymentMethod('card')}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '6px', cursor: 'pointer',
              border: paymentMethod === 'card' ? '0.5px solid rgba(0,212,200,0.5)' : '0.5px solid rgba(74,96,102,0.2)',
              background: paymentMethod === 'card' ? 'rgba(0,212,200,0.08)' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}
          >
            <span style={{ fontSize: '18px' }}>💳</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: paymentMethod === 'card' ? '#00d4c8' : '#4a6066', letterSpacing: '0.5px' }}>
              Credit Card
            </span>
          </button>
          <button
            onClick={() => setPaymentMethod('credits')}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '6px', cursor: 'pointer',
              border: paymentMethod === 'credits' ? '0.5px solid rgba(204,0,170,0.5)' : '0.5px solid rgba(74,96,102,0.2)',
              background: paymentMethod === 'credits' ? 'rgba(204,0,170,0.08)' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}
          >
            <span style={{ fontSize: '18px' }}>💎</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: paymentMethod === 'credits' ? '#cc00aa' : '#4a6066', letterSpacing: '0.5px' }}>
              {creditsNeeded} Credits
            </span>
            {userCredits !== null && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: hasEnoughCredits ? '#4a6066' : '#cc00aa' }}>
                {hasEnoughCredits ? `you have ${userCredits}` : `need ${creditsNeeded - userCredits} more`}
              </span>
            )}
          </button>
        </div>
      )}

      {paymentMethod === 'credits' ? (
        <CreditCheckoutForm
          creditsNeeded={creditsNeeded}
          hasEnough={hasEnoughCredits}
          userCredits={userCredits ?? 0}
          session={session}
        />
      ) : !clientSecret ? (
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
