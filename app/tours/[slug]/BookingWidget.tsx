'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type PaymentTab = 'card' | 'credits' | 'crypto'

interface BookingWidgetProps {
  tourSlug:   string
  tourTitle:  string
  priceEur:   number
  priceCredits: number
  hostName:   string
  hostAvatar: string
  hostBio:    string
  hostVerified: boolean
}

export default function BookingWidget({
  tourSlug,
  tourTitle,
  priceEur,
  priceCredits,
  hostName,
  hostAvatar,
  hostBio,
  hostVerified,
}: BookingWidgetProps) {
  const [guests,   setGuests]   = useState(1)
  const [tab,      setTab]      = useState<PaymentTab>('card')
  const [pending,  setPending]  = useState(false)

  // Guest form state
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [telegram, setTelegram] = useState('')
  const [date,     setDate]     = useState('')

  const totalEur     = priceEur     * guests
  const totalCredits = priceCredits * guests

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !date) {
      toast.error('Please fill in your name, email and select a date.')
      return
    }
    setPending(true)
    try {
      const res = await fetch(`/api/tours/${tourSlug}/book`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestsCount: guests,
          guest: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, telegramContact: telegram.trim() || undefined },
          date,
          payment: { method: tab === 'card' ? 'stripe' : tab, amount: tab === 'credits' ? totalCredits : totalEur, currency: tab === 'credits' ? 'CREDITS' : 'EUR' },
        }),
      })
      const data = await res.json() as { bookingId?: string; error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Booking failed'); return }
      if (data.bookingId) {
        window.location.href = `/tours/booking/${data.bookingId}`
      }
    } finally {
      setPending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '4px',
    background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(136,68,204,0.25)',
    color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
    color: '#4a6066', textTransform: 'uppercase', display: 'block', marginBottom: '5px',
  }

  return (
    <div style={{
      background: '#0d0d10',
      border: '0.5px solid rgba(136,68,204,0.28)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '0.5px solid rgba(136,68,204,0.15)',
        background: 'rgba(136,68,204,0.06)',
      }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px', color: '#8844cc', textTransform: 'uppercase', marginBottom: '4px' }}>
          Book this tour
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '26px', fontWeight: 700, color: '#8844cc' }}>
            €{priceEur}
          </span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
            / person
          </span>
        </div>
      </div>

      <form onSubmit={handleBook} style={{ padding: '20px' }}>

        {/* Guests */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Guests</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setGuests(g => Math.max(1, g - 1))}
              style={{
                width: '32px', height: '32px', borderRadius: '4px',
                background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.25)',
                color: '#8844cc', fontSize: '16px', cursor: 'pointer', lineHeight: 1,
              }}
            >−</button>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', color: '#e8f0ef', minWidth: '20px', textAlign: 'center' }}>
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests(g => Math.min(8, g + 1))}
              style={{
                width: '32px', height: '32px', borderRadius: '4px',
                background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.25)',
                color: '#8844cc', fontSize: '16px', cursor: 'pointer', lineHeight: 1,
              }}
            >+</button>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
              (max 8)
            </span>
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* Guest info */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text" required placeholder="Your name"
            value={name} onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Email *</label>
          <input
            type="email" required placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Phone (optional)</label>
          <input
            type="tel" placeholder="+420 ..."
            value={phone} onChange={e => setPhone(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Telegram (optional)</label>
          <input
            type="text" placeholder="@username"
            value={telegram} onChange={e => setTelegram(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Payment tabs */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Payment method</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['card', 'credits', 'crypto'] as PaymentTab[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '4px',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer',
                  background: tab === t ? '#8844cc' : 'rgba(136,68,204,0.07)',
                  color: tab === t ? '#050508' : '#4a6066',
                  border: `0.5px solid ${tab === t ? 'transparent' : 'rgba(136,68,204,0.2)'}`,
                  fontWeight: tab === t ? 700 : 400,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'card' ? '💳 Card' : t === 'credits' ? '⚡ Credits' : '₿ Crypto'}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div style={{
          padding: '12px 14px', borderRadius: '6px',
          background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.18)',
          marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
            Total · {guests} guest{guests !== 1 ? 's' : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#8844cc' }}>
            {tab === 'credits' ? `${totalCredits} CR` : `€${totalEur}`}
          </span>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={pending}
          style={{
            width: '100%', padding: '13px',
            borderRadius: '4px', cursor: pending ? 'not-allowed' : 'pointer',
            background: '#8844cc', border: 'none',
            color: '#e8f0ef', fontFamily: 'var(--font-orbitron)',
            fontSize: '13px', fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase', opacity: pending ? 0.6 : 1, transition: 'all 0.2s',
          }}
        >
          {pending ? 'Processing...' : 'Book Tour →'}
        </button>

        {/* Notes */}
        <p style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066',
          textAlign: 'center', marginTop: '12px', lineHeight: 1.7,
        }}>
          🔒 Secure · Free cancellation 48h before · 18+ only
        </p>
      </form>

      {/* Host card */}
      <div style={{
        padding: '16px 20px',
        borderTop: '0.5px solid rgba(136,68,204,0.12)',
      }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textTransform: 'uppercase', marginBottom: '10px' }}>
          Your guide
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(136,68,204,0.15)', border: '0.5px solid rgba(136,68,204,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-orbitron)', fontSize: '16px', color: '#8844cc',
            overflow: 'hidden',
          }}>
            {hostAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hostAvatar} alt={hostName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              hostName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef', fontWeight: 700 }}>
                {hostName || 'Local Guide'}
              </span>
              {hostVerified && (
                <span style={{
                  padding: '1px 6px', borderRadius: '10px',
                  background: 'rgba(136,68,204,0.15)', border: '0.5px solid rgba(136,68,204,0.3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#8844cc',
                }}>
                  ✓ verified
                </span>
              )}
            </div>
            {hostBio && (
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
                {hostBio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
