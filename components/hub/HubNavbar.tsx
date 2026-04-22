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
  const dropRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const d = t.hubNavbar

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  return (
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
      {/* Left — HUB brand */}
      <Link href="/hub" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', letterSpacing: '3px', color: 'rgba(232,240,239,0.35)', textTransform: 'uppercase' }}>
          {d.brand}
        </span>
      </Link>

      {/* Center — Shop link */}
      <Link href="/shop" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8', border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '4px', padding: '4px 12px', transition: 'background 0.15s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,212,200,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          {d.shop} ↗
        </span>
      </Link>

      {/* Right — XP pill + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Credits */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#8844cc', background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
          💎 {credits}
        </div>
        {/* XP pill */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', background: 'rgba(240,168,48,0.1)', border: '0.5px solid rgba(240,168,48,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
          ⚡ {xp.toLocaleString('en-US')} XP
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
                { label: d.profile,  href: `/hub/profile/${username}` },
                { label: d.settings, href: '/hub/settings' },
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
  )
}
