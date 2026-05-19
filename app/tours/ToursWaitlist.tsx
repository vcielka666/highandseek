'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function ToursWaitlist() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending,   setPending]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setPending(true)
    try {
      const res  = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), source: 'tours' }),
      })
      const data = await res.json() as { error?: string; duplicate?: boolean }
      if (!res.ok) { toast.error(data.error ?? 'Something went wrong'); return }
      setSubmitted(true)
      toast.success(data.duplicate ? 'Already on the list!' : "You're on the list!")
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      id="waitlist"
      style={{
        maxWidth: '560px', margin: '0 auto',
        padding: '40px 24px',
        background: 'rgba(136,68,204,0.04)',
        border: '0.5px solid rgba(136,68,204,0.18)',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '14px' }}>📍</div>
      <h2 style={{
        fontFamily: 'var(--font-orbitron)', fontWeight: 700,
        fontSize: '18px', letterSpacing: '2px',
        color: '#e8f0ef', textTransform: 'uppercase', marginBottom: '8px',
      }}>
        Your city not here?
      </h2>
      <p style={{
        fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
        color: '#4a6066', marginBottom: '28px', lineHeight: 1.7,
      }}>
        We&apos;re expanding. Drop your email and we&apos;ll let you know
        when tours launch near you.
      </p>

      {submitted ? (
        <div style={{
          padding: '16px 24px', borderRadius: '6px',
          background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.3)',
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>✓</div>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#8844cc', letterSpacing: '1px' }}>
            You&apos;re on the list
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginTop: '5px' }}>
            We&apos;ll reach out when tours launch in your city.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              padding: '11px 22px', borderRadius: '4px', cursor: pending ? 'not-allowed' : 'pointer',
              background: 'rgba(136,68,204,0.15)', border: '0.5px solid #8844cc',
              color: '#8844cc', fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
              letterSpacing: '0.5px', opacity: pending ? 0.6 : 1, transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {pending ? '...' : 'Notify me'}
          </button>
        </form>
      )}
    </section>
  )
}
