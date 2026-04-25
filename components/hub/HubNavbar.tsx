'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'

interface Props {
  username: string
  avatar:   string
  xp:       number
  level:    number
  credits:  number
}

function Avatar({ username, avatar, size = 36 }: { username: string; avatar: string; size?: number }) {
  if (avatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(204,0,170,0.4)', cursor: 'pointer' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'rgba(204,0,170,0.15)', border: '1.5px solid rgba(204,0,170,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-orbitron)', fontSize: size * 0.33 + 'px', fontWeight: 700, color: '#cc00aa', cursor: 'pointer' }}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function HubNavbar({ username, avatar, xp, level, credits }: Props) {
  const [dropOpen, setDropOpen] = useState(false)
  const [pill, setPill] = useState<'xp' | 'credits' | null>(null)
  const [shopAlert, setShopAlert] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const d = t.hubNavbar

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) setPill(null)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  return (
    <>
      <style>{`
        .hub-breadcrumb { display: flex; align-items: center; gap: 6px; }
        @media (max-width: 768px) { .hub-breadcrumb { display: none; } }
      `}</style>

      <nav style={{
        position:        'sticky',
        top:             0,
        zIndex:          30,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 20px',
        height:          '52px',
        background:      'rgba(5,5,8,0.82)',
        backdropFilter:  'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:    '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Left — breadcrumb (desktop only) */}
        <div className="hub-breadcrumb">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-cacha)', fontSize: '18px', letterSpacing: '2px', color: '#e8f0ef' }}>
              HIGH<span style={{ color: '#00d4c8' }}>&amp;</span>SEEK
            </span>
          </Link>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.15)' }}>›</span>
          <Link href="/hub" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '2.5px', color: 'rgba(232,240,239,0.3)', textTransform: 'uppercase' }}>
              {d.brand}
            </span>
          </Link>
        </div>

        {/* Center — Shop button */}
        <button
          onClick={() => setShopAlert(true)}
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8', border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '4px', padding: '4px 12px', background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,200,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {d.shop} ↗
        </button>

        {/* Right — pills + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Clickable pills */}
          <div ref={pillRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Credits pill */}
            <button
              onClick={() => setPill(v => v === 'credits' ? null : 'credits')}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#8844cc', background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.25)', borderRadius: '20px', padding: '3px 10px', cursor: 'pointer' }}
            >
              💎 {credits}
            </button>
            {/* XP pill */}
            <button
              onClick={() => setPill(v => v === 'xp' ? null : 'xp')}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', background: 'rgba(240,168,48,0.1)', border: '0.5px solid rgba(240,168,48,0.25)', borderRadius: '20px', padding: '3px 10px', cursor: 'pointer' }}
            >
              {xp.toLocaleString('en-US')} XP
            </button>

            {/* Info popup */}
            {pill && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                background: 'rgba(13,13,18,0.97)', border: `0.5px solid ${pill === 'xp' ? 'rgba(240,168,48,0.25)' : 'rgba(136,68,204,0.25)'}`,
                borderRadius: '10px', padding: '14px 16px', minWidth: '220px', maxWidth: '260px',
                backdropFilter: 'blur(20px)', zIndex: 50,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: pill === 'xp' ? '#f0a830' : '#8844cc', marginBottom: '8px' }}>
                  {pill === 'xp' ? d.xpTitle : d.creditsTitle}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.55)', lineHeight: 1.6 }}>
                  {pill === 'xp' ? d.xpDesc : d.creditsDesc}
                </div>
                <div style={{ marginTop: '10px', fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: pill === 'xp' ? '#f0a830' : '#8844cc' }}>
                  {pill === 'xp' ? `${xp.toLocaleString('en-US')} XP` : `💎 ${credits}`}
                </div>
                {pill === 'credits' && (
                  <Link
                    href="/hub/credits"
                    onClick={() => setPill(null)}
                    style={{
                      display: 'block', marginTop: '12px',
                      fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
                      textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none',
                      color: '#050508', background: '#8844cc',
                      borderRadius: '6px', padding: '8px 12px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#9955dd')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#8844cc')}
                  >
                    {d.buyCredits}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div ref={dropRef} style={{ position: 'relative' }}>
            <div onClick={() => setDropOpen(v => !v)}>
              <Avatar username={username} avatar={avatar} />
            </div>

            {dropOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'rgba(13,13,18,0.97)', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '6px', minWidth: '160px',
                backdropFilter: 'blur(20px)', zIndex: 50,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '8px 10px 10px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#cc00aa', fontWeight: 700 }}>{username}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '1px' }}>Lv.{level}</div>
                </div>
                {[
                  { label: d.profile, href: `/hub/profile/${username}` },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{ display: 'block', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef', textDecoration: 'none', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#cc00aa', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,170,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {d.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Shop alert modal — outside nav to avoid sticky stacking context */}
      {shopAlert && (
        <>
          <div
            onClick={() => setShopAlert(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 70, background: 'rgba(13,13,18,0.98)',
            border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '16px',
            padding: '28px 24px', maxWidth: '280px', width: 'calc(100vw - 40px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '22px', color: '#e8f0ef', letterSpacing: '0.5px', marginBottom: '20px' }}>
              {d.shopAlertTitle}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShopAlert(false)}
                style={{ flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}
              >
                {d.shopAlertCancel}
              </button>
              <a
                href="/shop"
                style={{ flex: 1, fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '0.5px', color: '#050508', background: '#00d4c8', borderRadius: '6px', padding: '10px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {d.shopAlertConfirm}
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
