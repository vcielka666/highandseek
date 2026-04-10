'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import { getXPProgress } from '@/lib/xp/utils'

const NAV_ITEMS = [
  { href: '/hub',             label: 'Hub Home',      icon: '⌂' },
  { href: '/hub/grow',        label: 'Virtual Grow',  icon: '🌿' },
  { href: '/hub/strains',     label: 'Strains',       icon: '🧬' },
  { href: '/hub/forum',       label: 'Forum Bridge',  icon: '🔍' },
  { href: '/hub/hunt',        label: 'Seekers Hunt',  icon: '🗺️' },
  { href: '/hub/academy',     label: 'Grow Academy',  icon: '📚' },
  { href: '/hub/leaderboard', label: 'Leaderboard',   icon: '🏆' },
] as const

const BOTTOM_NAV = [
  { href: '/shop', label: 'Shop', icon: '🛒', teal: true },
] as const

const MOBILE_TABS = [
  { href: '/hub',         label: 'Home',    icon: '⌂' },
  { href: '/hub/grow',    label: 'Grow',    icon: '🌿' },
  { href: '/hub/strains', label: 'Strains', icon: '🧬' },
  { href: '/hub/forum',   label: 'Forum',   icon: '🔍' },
  { href: '/hub/profile', label: 'Profile', icon: '👤' },
] as const

interface HubSidebarProps {
  session: Session
  credits: number
}

function Avatar({ username, avatar }: { username: string; avatar: string }) {
  if (avatar) {
    return (
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(204,0,170,0.4)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  const initials = username.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
      background: 'rgba(204,0,170,0.15)', border: '1.5px solid rgba(204,0,170,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#cc00aa',
    }}>
      {initials}
    </div>
  )
}

export default function HubSidebar({ session, credits }: HubSidebarProps) {
  const pathname = usePathname()
  const { current, next, percent } = getXPProgress(session.user.xp)

  const isActive = (href: string) =>
    href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(13,0,20,0.95)',
        borderRight: '0.5px solid rgba(204,0,170,0.15)',
        overflowY: 'auto',
      }} className="hidden lg:flex">

        {/* User block */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid rgba(204,0,170,0.1)' }}>
          <Link href={`/hub/profile/${session.user.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Avatar username={session.user.username} avatar={session.user.image ?? ''} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.username}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#f0a830', marginTop: '2px' }}>
                ⚡ Lv.{current.level} · {current.name}
              </div>
            </div>
          </Link>

          {/* XP bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>XP</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830' }}>
                {session.user.xp.toLocaleString()}{next ? ` / ${next.xpRequired.toLocaleString()}` : ''}
              </span>
            </div>
            <div style={{ height: '3px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #f0a830, #ffc040)',
                borderRadius: '2px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Credits */}
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', letterSpacing: '0.5px' }}>
            💎 {credits} credits
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive(href) ? 'rgba(204,0,170,0.1)' : 'transparent',
                borderLeft: isActive(href) ? '2px solid #cc00aa' : '2px solid transparent',
              }}
              className="hover:bg-[rgba(204,0,170,0.06)]"
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              <span style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                letterSpacing: '0.5px',
                color: isActive(href) ? '#cc00aa' : '#4a6066',
                transition: 'color 0.15s',
              }}>
                {label}
              </span>
            </Link>
          ))}

          {/* Profile */}
          <Link
            href={`/hub/profile/${session.user.username}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 16px',
              textDecoration: 'none',
              transition: 'all 0.15s',
              background: pathname.startsWith('/hub/profile') ? 'rgba(204,0,170,0.1)' : 'transparent',
              borderLeft: pathname.startsWith('/hub/profile') ? '2px solid #cc00aa' : '2px solid transparent',
            }}
            className="hover:bg-[rgba(204,0,170,0.06)]"
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>👤</span>
            <span style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              color: pathname.startsWith('/hub/profile') ? '#cc00aa' : '#4a6066',
            }}>
              My Profile
            </span>
          </Link>
        </nav>

        {/* Bottom: Shop link + settings + logout */}
        <div style={{ borderTop: '0.5px solid rgba(204,0,170,0.1)', padding: '8px 0' }}>
          {/* Shop cross-link — teal accent */}
          <Link
            href="/shop"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 16px', textDecoration: 'none', transition: 'all 0.15s',
              borderLeft: '2px solid transparent',
            }}
            className="hover:bg-[rgba(0,212,200,0.06)]"
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>🛒</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: '#007a74' }}>Shop</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 16px', width: '100%', background: 'transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
            className="hover:bg-[rgba(255,255,255,0.03)]"
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0, opacity: 0.5 }}>⎋</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: '#4a6066' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        display: 'flex',
        background: 'rgba(13,0,20,0.97)',
        borderTop: '0.5px solid rgba(204,0,170,0.2)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
      }} className="lg:hidden">
        {MOBILE_TABS.map(({ href, label, icon }) => {
          const active = href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '2px', textDecoration: 'none',
                borderTop: active ? '1.5px solid #cc00aa' : '1.5px solid transparent',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px', color: active ? '#cc00aa' : '#4a6066' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
