'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'hs-shop-access'

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    try {
      setVerified(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      setVerified(false)
    }
  }, [])

  function handleEnter() {
    if (!ageConfirmed) {
      setError('Please confirm you are 18 or older.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* private mode */ }
    setVerified(true)
  }

  if (verified === null) return null
  if (verified) return <>{children}</>

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(5,5,8,0.97)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Subtle grid lines in bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,200,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,200,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(10,12,16,0.95)',
          border: '0.5px solid rgba(0,212,200,0.2)',
          borderRadius: '12px',
          padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(0,212,200,0.08)',
          animation: shake ? 'ageShake 0.4s ease' : 'none',
        }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--font-cacha)',
            fontSize: '28px',
            letterSpacing: '3px',
            background: 'linear-gradient(90deg, #00d4c8, #8844cc, #cc00aa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px',
          }}>
            HIGH & SEEK
          </div>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            letterSpacing: '3px',
            color: '#4a6066',
            textTransform: 'uppercase',
          }}>
            Cannabis Boutique
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(0,212,200,0.2), transparent)', marginBottom: '28px' }} />

        {/* Age warning */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '0.5px solid rgba(0,212,200,0.2)',
            background: 'rgba(0,212,200,0.05)',
            fontSize: '24px',
            marginBottom: '12px',
          }}>
            🔞
          </div>
          <div style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: '15px',
            fontWeight: 700,
            color: '#e8f0ef',
            marginBottom: '6px',
          }}>
            Adults only
          </div>
          <div style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px',
            color: '#4a6066',
            lineHeight: 1.6,
          }}>
            This store contains cannabis products.<br />
            You must be <span style={{ color: '#e8f0ef' }}>18 years or older</span> to enter.
          </div>
        </div>

        {/* Age checkbox */}
        <div
          onClick={() => { setAgeConfirmed((v) => !v); setError('') }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '6px',
            border: `0.5px solid ${ageConfirmed ? 'rgba(0,212,200,0.35)' : 'rgba(255,255,255,0.06)'}`,
            background: ageConfirmed ? 'rgba(0,212,200,0.06)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.15s',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            border: `1px solid ${ageConfirmed ? '#00d4c8' : '#4a6066'}`,
            background: ageConfirmed ? '#00d4c8' : 'transparent',
            flexShrink: 0,
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {ageConfirmed && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="#050508" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px',
            color: ageConfirmed ? '#e8f0ef' : '#4a6066',
            transition: 'color 0.15s',
          }}>
            I confirm I am 18 years of age or older
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '11px',
            color: '#cc00aa',
            marginBottom: '16px',
            letterSpacing: '0.5px',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Enter button */}
        <button
          onClick={handleEnter}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '6px',
            border: 'none',
            background: 'linear-gradient(90deg, #00d4c8, #8844cc)',
            color: '#050508',
            fontFamily: 'var(--font-cacha)',
            fontSize: '14px',
            letterSpacing: '2px',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          className="hover:opacity-90"
        >
          Enter Shop
        </button>

        {/* Legal note */}
        <div style={{
          marginTop: '20px',
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '9px',
          color: '#2a3a3e',
          textAlign: 'center',
          lineHeight: 1.7,
          letterSpacing: '0.3px',
        }}>
          By entering you confirm compliance with your local laws.<br />
          High & Seek sells CBD products only.
        </div>
      </div>

      <style>{`
        @keyframes ageShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
