'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ToursPage() {
  const [email, setEmail]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setPending(true)
    try {
      const res  = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'tours' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Something went wrong'); return }
      setSubmitted(true)
      toast.success(data.duplicate ? 'Already on the list!' : 'You\'re on the list!')
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#050508',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle purple grid glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(136,68,204,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Icon */}
        <div style={{ fontSize: '64px', marginBottom: '24px', lineHeight: 1 }}>🧭</div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'var(--font-orbitron)', fontWeight: 900,
          fontSize: 'clamp(24px,6vw,40px)', letterSpacing: '3px',
          color: '#e8f0ef', textTransform: 'uppercase', marginBottom: '12px',
        }}>
          City Canna Tours
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '12px',
          letterSpacing: '1.5px', color: '#8844cc', marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          Cannabis culture · Local guides · City vibes
        </p>

        {/* Cities */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '14px',
          color: '#4a6066', marginBottom: '40px', lineHeight: 1.7,
        }}>
          Coming soon — Praha, Amsterdam, Barcelona & more
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(136,68,204,0.2)', marginBottom: '36px' }} />

        {/* Waitlist */}
        {submitted ? (
          <div style={{
            padding: '20px 24px', borderRadius: '8px',
            background: 'rgba(136,68,204,0.08)', border: '0.5px solid rgba(136,68,204,0.3)',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#8844cc', letterSpacing: '1px' }}>
              You&apos;re on the list
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginTop: '6px' }}>
              We&apos;ll reach out when tours launch in your city.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
              letterSpacing: '1.5px', color: '#4a6066', textTransform: 'uppercase',
              marginBottom: '14px',
            }}>
              Chcem byť medzi prvými
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: '1 1 220px', padding: '11px 14px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(136,68,204,0.3)',
                  color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)', fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={pending}
                style={{
                  padding: '11px 20px', borderRadius: '4px', cursor: pending ? 'not-allowed' : 'pointer',
                  background: 'rgba(136,68,204,0.15)', border: '0.5px solid #8844cc',
                  color: '#8844cc', fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
                  letterSpacing: '0.5px', opacity: pending ? 0.6 : 1, transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {pending ? '...' : 'Notify me'}
              </button>
            </div>
          </form>
        )}

        {/* Back link */}
        <div style={{ marginTop: '48px' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
            letterSpacing: '1px', color: '#4a6066', textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            ← Back to H&S
          </Link>
        </div>
      </div>
    </div>
  )
}
