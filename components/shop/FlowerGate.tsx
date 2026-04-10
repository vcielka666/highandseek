'use client'

import { useState, useEffect } from 'react'

const FLOWER_KEY = 'hs-flower-access'
const FLOWER_PASSWORD = 'kunda'

export default function FlowerGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setUnlocked(localStorage.getItem(FLOWER_KEY) === 'true')
  }, [])

  function handleUnlock() {
    if (password.trim().toLowerCase() !== FLOWER_PASSWORD) {
      setError('Incorrect password.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    localStorage.setItem(FLOWER_KEY, 'true')
    window.dispatchEvent(new CustomEvent('flower-unlocked'))
    setUnlocked(true)
  }

  if (unlocked === null) return null
  if (unlocked) return <>{children}</>

  return (
    <>
      <div style={{ position: 'relative' }} className="min-h-[520px] sm:min-h-[520px]">

        {/* Blurred ghost cards behind — desktop only */}
        <div
          className="hidden sm:grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
            filter: 'blur(14px)',
            opacity: 0.12,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              height: '340px',
              borderRadius: '8px',
              background: `rgba(0,212,200,${0.06 + i * 0.02})`,
              border: '0.5px solid rgba(0,212,200,0.25)',
            }} />
          ))}
        </div>

        {/* Inline unlock form */}
        <div style={{
          padding: '24px',
        }}
          className="sm:absolute sm:inset-0 flex items-center justify-center"
        >
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(5,5,8,0.88)',
            border: '0.5px solid rgba(0,212,200,0.2)',
            borderRadius: '12px',
            padding: '40px 36px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            animation: shake ? 'flowerShake 0.4s ease' : 'none',
          }}>

            {/* How to obtain */}
            <div style={{
              background: 'rgba(0,212,200,0.03)',
              border: '0.5px solid rgba(0,212,200,0.1)',
              borderRadius: '8px',
              padding: '18px 20px',
              marginBottom: '24px',
            }}>
              <div style={{
                fontFamily: 'var(--font-cacha)',
                fontSize: '16px',
                letterSpacing: '2px',
                color: 'rgba(0,212,200,0.6)',
                marginBottom: '14px',
              }}>
                Mystery Box
              </div>
              {[
                { icon: '🧠', title: 'Hub Quizzes', desc: 'Complete all quizzes in Hub with 95%+ success' },
                { icon: '📍', title: 'Seekers App', desc: 'Find it as a geocaching gift hidden in the field' },
                { icon: '🎁', title: 'Marketing Offer', desc: 'Receive it as a special offer from H&S' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: 'rgba(232,240,239,0.7)', marginBottom: '2px' }}>{title}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(0,212,200,0.15), transparent)', marginBottom: '20px' }} />

            {/* Password input */}
            <div style={{ marginBottom: error ? '10px' : '20px' }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#4a6066',
                marginBottom: '8px',
              }}>
                Password
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `0.5px solid ${error ? 'rgba(204,0,170,0.5)' : 'rgba(0,212,200,0.15)'}`,
                  borderRadius: '6px',
                  color: '#e8f0ef',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '14px',
                  letterSpacing: '3px',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

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

            <button
              onClick={handleUnlock}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(90deg, #00d4c8, #007a74)',
                color: '#050508',
                fontFamily: 'var(--font-cacha)',
                fontSize: '13px',
                letterSpacing: '2px',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              className="hover:opacity-90"
            >
              Unlock Access
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flowerShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </>
  )
}
