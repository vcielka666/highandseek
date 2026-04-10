'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Suspense } from 'react'
import { useCart } from '@/stores/cartStore'

function SuccessContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { clearCart } = useCart()
  const [showXP, setShowXP] = useState(false)

  const paymentIntent = searchParams.get('payment_intent')
  const status = searchParams.get('redirect_status')

  useEffect(() => {
    if (status === 'succeeded') {
      clearCart()
      if (session) {
        const timer = setTimeout(() => setShowXP(true), 800)
        return () => clearTimeout(timer)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const isSuccess = status === 'succeeded'

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
      gap: '24px',
    }}>
      {/* Icon */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: isSuccess ? 'rgba(0,212,200,0.08)' : 'rgba(204,0,170,0.08)',
        border: `1px solid ${isSuccess ? 'rgba(0,212,200,0.3)' : 'rgba(204,0,170,0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSuccess ? '0 0 40px rgba(0,212,200,0.15)' : 'none',
      }}>
        {isSuccess ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cc00aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>

      {/* Heading */}
      <div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: isSuccess ? '#007a74' : '#4a6066', marginBottom: '10px' }}>
          {isSuccess ? 'Order confirmed' : 'Payment issue'}
        </div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '12px' }}>
          {isSuccess ? 'Your seeds are on their way.' : 'Something went wrong.'}
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', maxWidth: '400px', lineHeight: 1.7 }}>
          {isSuccess
            ? 'We\'re preparing your order. You\'ll receive a confirmation email shortly. Happy growing.'
            : 'We couldn\'t process your payment. Your cart is still intact — try again or contact us.'
          }
        </p>
      </div>

      {/* Order number */}
      {isSuccess && paymentIntent && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(0,212,200,0.05)',
          border: '0.5px solid rgba(0,212,200,0.15)',
          borderRadius: '4px',
        }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', letterSpacing: '0.5px' }}>
            Order ref:&nbsp;
          </span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#00d4c8' }}>
            {paymentIntent.slice(-12).toUpperCase()}
          </span>
        </div>
      )}

      {/* XP reward */}
      {showXP && session && (
        <div style={{
          padding: '14px 24px',
          background: 'rgba(240,168,48,0.08)',
          border: '0.5px solid rgba(240,168,48,0.25)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          <span style={{ fontSize: '18px' }}>🌱</span>
          <div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#f0a830' }}>
              +50 XP
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8a5e1a', letterSpacing: '0.5px' }}>
              Added to {session.user.username}
            </div>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        <Link
          href="/shop"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '11px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#4a6066',
            border: '0.5px solid rgba(0,212,200,0.2)',
            borderRadius: '4px',
            padding: '10px 20px',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          className="hover:border-[#00d4c8] hover:text-[#00d4c8]"
        >
          ← Back to shop
        </Link>
        <Link
          href="/hub"
          style={{
            fontFamily: 'var(--font-cacha)',
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#050508',
            background: '#cc00aa',
            borderRadius: '4px',
            padding: '10px 20px',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          className="hover:bg-[#e000bb] hover:shadow-[0_0_16px_rgba(204,0,170,0.4)]"
        >
          Explore Hub ⚡
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
