'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/stores/languageStore'
import type { Locale } from '@/lib/i18n/translations'
import { useSession, signOut } from 'next-auth/react'

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'cs', label: 'CS', flag: '🇨🇿' },
  { value: 'en', label: 'EN', flag: '🇬🇧' },
]

export default function Navbar() {
  const { t, locale, setLocale } = useLanguage()
  const { data: session, status } = useSession()
  const [dropOpen, setDropOpen] = useState(false)
  const [pill, setPill]         = useState<'xp' | 'credits' | null>(null)
  const [credits, setCredits]   = useState<number | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const d = t.hubNavbar

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => setCredits(data.credits ?? 0))
      .catch(() => setCredits(0))
  }, [status])

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
        setPill(null)
      }
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  return (
    <nav
      className="px-4 md:px-12"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
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
        <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '18px', letterSpacing: '2px', color: '#e8f0ef' }}>
          HIGH<span style={{ color: '#00d4c8' }}>&amp;</span>SEEK
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {LOCALES.map(({ value, flag }, i) => (
            <span key={value} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => setLocale(value)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: '3px', transition: 'all 0.15s',
                  color: locale === value ? '#00d4c8' : '#4a6066',
                  borderBottom: locale === value ? '0.5px solid #00d4c8' : '0.5px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{flag}</span>
              </button>
              {i < LOCALES.length - 1 && (
                <span style={{ color: '#4a6066', fontSize: '10px', opacity: 0.4 }}>|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {status === 'loading' ? (
          <div style={{ width: '120px' }} />
        ) : status === 'authenticated' && session ? (
          <div ref={dropRef} style={{ position: 'relative' }}>
            {/* Username trigger */}
            <button
              onClick={() => { setDropOpen(v => !v); setPill(null) }}
              style={{
                fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700,
                color: '#00d4c8', letterSpacing: '1px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: '4px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,200,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {session.user.username}
            </button>

            {dropOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'rgba(13,13,18,0.97)',
                border: '0.5px solid rgba(0,212,200,0.15)',
                borderRadius: '10px', padding: '6px',
                minWidth: '200px',
                backdropFilter: 'blur(20px)',
                zIndex: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {/* Header */}
                <div style={{ padding: '8px 10px 10px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#00d4c8', fontWeight: 700 }}>
                    {session.user.username}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                      Lv.{session.user.level}
                    </span>
                  </div>
                  <button
                    onClick={() => setPill(v => v === 'xp' ? null : 'xp')}
                    style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'block', marginTop: '2px' }}
                  >
                    {session.user.xp} XP
                  </button>
                  <button
                    onClick={() => setPill(v => v === 'credits' ? null : 'credits')}
                    style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'block', marginTop: '1px' }}
                  >
                    💎 {credits ?? '…'}
                  </button>
                </div>

                {/* Pill info popup — fixed so it's always on-screen on mobile too */}
                {pill && (
                  <div style={{
                    position: 'fixed', top: '64px', right: '16px',
                    background: 'rgba(13,13,18,0.97)',
                    border: `0.5px solid ${pill === 'xp' ? 'rgba(240,168,48,0.25)' : 'rgba(136,68,204,0.25)'}`,
                    borderRadius: '10px', padding: '14px 16px',
                    width: 'min(260px, calc(100vw - 32px))',
                    backdropFilter: 'blur(20px)', zIndex: 201,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: pill === 'xp' ? '#f0a830' : '#8844cc', marginBottom: '8px' }}>
                      {pill === 'xp' ? d.xpTitle : d.creditsTitle}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.55)', lineHeight: 1.6 }}>
                      {pill === 'xp' ? d.xpDesc : d.creditsDesc}
                    </div>
                    <div style={{ marginTop: '10px', fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: pill === 'xp' ? '#f0a830' : '#8844cc' }}>
                      {pill === 'xp' ? `${session.user.xp.toLocaleString('en-US')} XP` : `💎 ${credits ?? '…'}`}
                    </div>
                  </div>
                )}

                {/* Links */}
                {[
                  { label: t.nav.profile, href: `/hub/profile/${session.user.username}` },
                  { label: t.nav.orders,  href: '/shop/orders' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { setDropOpen(false); setPill(null) }}
                    style={{ display: 'block', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef', textDecoration: 'none', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#cc00aa', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,170,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {t.nav.logout}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Login */}
            <Link href="/auth/login" title="Login" style={{ textDecoration: 'none', transition: 'all 0.2s' }} className="group">
              <span
                className="flex md:hidden items-center justify-center"
                style={{ width: '32px', height: '32px', borderRadius: '4px', border: '0.5px solid rgba(74,96,102,0.5)', color: '#4a6066', transition: 'all 0.2s' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span
                className="hidden md:flex items-center"
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.5)', borderRadius: '4px', padding: '7px 16px', transition: 'all 0.2s' }}
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
            <Link href="/auth/register" title="Sign up" style={{ textDecoration: 'none', transition: 'all 0.2s' }}>
              <span
                className="flex md:hidden items-center justify-center"
                style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#00d4c8', color: '#050508', transition: 'all 0.2s' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span
                className="hidden md:flex items-center hover:bg-[#00f5e8] hover:shadow-[0_0_16px_rgba(0,212,200,0.4)]"
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '7px 18px', fontWeight: 500, transition: 'all 0.2s' }}
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
