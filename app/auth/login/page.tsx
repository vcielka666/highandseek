'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

function LoadingOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5,5,8,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'not-allowed',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="16" cy="16" r="13" stroke="rgba(0,212,200,0.15)" strokeWidth="2" />
          <path d="M16 3 A13 13 0 0 1 29 16" stroke="#00d4c8" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066' }}>
          Signing in...
        </span>
      </div>
    </div>
  )
}

function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      toast.error('Invalid email or password.')
    } else {
      toast.success('Welcome back!')
      router.push(callbackUrl)
    }
  }

  return (
    <>
      {loading && <LoadingOverlay />}
      <div
        style={{
          minHeight: '100vh',
          background: '#050508',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          pointerEvents: loading ? 'none' : 'auto',
        }}
      >
        {/* Back link */}
        <Link
          href="/"
          style={{
            alignSelf: 'flex-start',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#4a6066',
            textDecoration: 'none',
            marginBottom: '32px',
            transition: 'color 0.2s',
          }}
          className="hover:text-[#00d4c8]"
        >
          ← Home
        </Link>

        {/* Logo */}
        <div
          style={{
            fontFamily: 'var(--font-cacha)',
            fontSize: '22px',
            letterSpacing: '2px',
            color: '#e8f0ef',
            marginBottom: '40px',
          }}
        >
          HIGH<span style={{ color: '#00d4c8' }}>&amp;</span>SEEK
        </div>

        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            border: '0.5px solid rgba(0,212,200,0.15)',
            borderRadius: '8px',
            background: 'rgba(0,212,200,0.02)',
            padding: '40px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-cacha)',
              fontSize: '22px',
              letterSpacing: '3px',
              color: '#e8f0ef',
              textTransform: 'uppercase',
              marginBottom: '32px',
              textAlign: 'center',
            }}
          >
            Sign In
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#4a6066',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '0.5px solid rgba(0,212,200,0.2)',
                  borderRadius: '4px',
                  color: '#e8f0ef',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.2)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#4a6066',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(0,212,200,0.2)',
                    borderRadius: '4px',
                    color: '#e8f0ef',
                    padding: '10px 40px 10px 14px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00d4c8' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,200,0.2)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#4a6066',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#00d4c8',
                color: '#050508',
                fontFamily: 'var(--font-cacha)',
                fontSize: '14px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                borderRadius: '4px',
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
          </form>

          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              color: '#4a6066',
              textAlign: 'center',
              marginTop: '28px',
            }}
          >
            No account?{' '}
            <Link
              href="/auth/register"
              style={{ color: '#00d4c8', textDecoration: 'none' }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

function LoginFormWrapper() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  return <LoginForm callbackUrl={callbackUrl} />
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#050508',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      }
    >
      <LoginFormWrapper />
    </Suspense>
  )
}
