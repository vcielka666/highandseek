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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 48px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5,5,8,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid rgba(0,212,200,0.12)',
      }}
    >
      {/* Logo */}
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

      {/* Right side: language switcher + auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

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

        {/* Auth section */}
        {status === 'loading' ? (
          <div style={{ width: '120px' }} />
        ) : status === 'authenticated' && session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Username */}
            <span
              style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#00d4c8',
                letterSpacing: '1px',
              }}
            >
              {session.user.username}
            </span>

            {/* XP badge */}
            <span
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '1px',
                color: '#f0a830',
              }}
            >
              {session.user.xp} XP
            </span>

            {/* Logout button */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#4a6066',
                background: 'transparent',
                border: '0.5px solid #4a6066',
                borderRadius: '4px',
                padding: '7px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e8f0ef'
                e.currentTarget.style.borderColor = '#e8f0ef'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#4a6066'
                e.currentTarget.style.borderColor = '#4a6066'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          /* Unauthenticated: show Login/Signup buttons */
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/auth/login"
              style={{
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#4a6066',
                background: 'transparent',
                border: '0.5px solid #4a6066',
                borderRadius: '4px',
                padding: '7px 16px',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              className="hover:text-[#00d4c8] hover:border-[#00d4c8]"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/auth/register"
              style={{
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#050508',
                background: '#00d4c8',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 18px',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              className="hover:bg-[#00f5e8] hover:shadow-[0_0_16px_rgba(0,212,200,0.4)]"
            >
              {t.nav.signup}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
