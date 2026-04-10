'use client'

import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'
import type { Locale } from '@/lib/i18n/translations'
import { useSession, signOut } from 'next-auth/react'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'cs', label: 'CS' },
]

export default function Navbar() {
  const { t, locale, setLocale } = useLanguage()
  const { data: session, status } = useSession()

  return (
    <nav
      className="px-4 md:px-12"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5,5,8,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid rgba(0,212,200,0.12)',
      }}
    >
      {/* Left: Logo + language switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-cacha)',
            fontSize: '18px',
            letterSpacing: '2px',
            color: '#e8f0ef',
          }}
        >
          HIGH<span style={{ color: '#00d4c8' }}>&amp;</span>SEEK
        </div>

        {/* Language switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {LOCALES.map(({ value, label }, i) => (
            <span key={value} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => setLocale(value)}
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  transition: 'all 0.15s',
                  color: locale === value ? '#00d4c8' : '#4a6066',
                  borderBottom: locale === value ? '0.5px solid #00d4c8' : '0.5px solid transparent',
                }}
              >
                {label}
              </button>
              {i < LOCALES.length - 1 && (
                <span style={{ color: '#4a6066', fontSize: '10px', opacity: 0.4 }}>|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Auth section */}
        {status === 'loading' ? (
          <div style={{ width: '120px' }} />
        ) : status === 'authenticated' && session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Username + XP stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: '#00d4c8', letterSpacing: '1px' }}>
                {session.user.username}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#f0a830' }}>
                {session.user.xp} XP
              </span>
            </div>

            {/* Logout icon button */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              title="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: '0.5px solid rgba(74,96,102,0.5)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#4a6066',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e8f0ef'
                e.currentTarget.style.borderColor = 'rgba(232,240,239,0.4)'
                e.currentTarget.style.background = 'rgba(232,240,239,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#4a6066'
                e.currentTarget.style.borderColor = 'rgba(74,96,102,0.5)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          /* Unauthenticated: show Login/Signup buttons */
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Login */}
            <Link
              href="/auth/login"
              title="Login"
              style={{ textDecoration: 'none', transition: 'all 0.2s' }}
              className="group"
            >
              {/* Icon — mobile only */}
              <span
                className="flex md:hidden items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: '0.5px solid rgba(74,96,102,0.5)',
                  color: '#4a6066',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              {/* Text — desktop only */}
              <span
                className="hidden md:flex items-center"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#4a6066',
                  border: '0.5px solid rgba(74,96,102,0.5)',
                  borderRadius: '4px',
                  padding: '7px 16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#00d4c8'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#00d4c8'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#4a6066'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,96,102,0.5)'
                }}
              >
                {t.nav.login}
              </span>
            </Link>

            {/* Sign up */}
            <Link
              href="/auth/register"
              title="Sign up"
              style={{ textDecoration: 'none', transition: 'all 0.2s' }}
            >
              {/* Icon — mobile only */}
              <span
                className="flex md:hidden items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  background: '#00d4c8',
                  color: '#050508',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              {/* Text — desktop only */}
              <span
                className="hidden md:flex items-center hover:bg-[#00f5e8] hover:shadow-[0_0_16px_rgba(0,212,200,0.4)]"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#050508',
                  background: '#00d4c8',
                  borderRadius: '4px',
                  padding: '7px 18px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {t.nav.signup}
              </span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
