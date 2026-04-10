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
          <circle cx="16" cy="16" r="13" stroke="rgba(204,0,170,0.15)" strokeWidth="2" />
          <path d="M16 3 A13 13 0 0 1 29 16" stroke="#cc00aa" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066' }}>
          Creating account...
        </span>
      </div>
    </div>
  )
}

function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      toast.error(data.error ?? 'Registration failed.')
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      toast.error('Account created but login failed. Please sign in manually.')
    } else {
      toast.success('Account created! Welcome.')
      router.push(callbackUrl)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(204,0,170,0.2)',
    borderRadius: '4px',
    color: '#e8f0ef',
    padding: '10px 14px',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const inputPasswordStyle: React.CSSProperties = { ...inputStyle, padding: '10px 40px 10px 14px' }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)',
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#4a6066',
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = '#cc00aa'
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'rgba(204,0,170,0.2)'
  }

  const EyeButton = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
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
      {show ? (
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
  )

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
            border: '0.5px solid rgba(204,0,170,0.15)',
            borderRadius: '8px',
            background: 'rgba(204,0,170,0.02)',
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
            Create Account
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={inputPasswordStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <EyeButton show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={inputPasswordStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <EyeButton show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#cc00aa',
                color: '#ffffff',
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
              Create Account
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
            Already have an account?{' '}
            <Link
              href="/auth/login"
              style={{ color: '#cc00aa', textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

function RegisterFormWrapper() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  return <RegisterForm callbackUrl={callbackUrl} />
}

export default function RegisterPage() {
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
      <RegisterFormWrapper />
    </Suspense>
  )
}
