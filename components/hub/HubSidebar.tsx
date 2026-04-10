'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import type { Session } from 'next-auth'
import { getXPProgress, LEVELS } from '@/lib/xp/utils'
import { useLanguage } from '@/stores/languageStore'

const NAV_ITEMS = [
  { href: '/hub',               key: 'home'        as const, icon: '⌂',  seekers: false, image: null },
  { href: '/hub/hunt',          key: 'seekers'     as const, icon: '🗺️', seekers: true,  image: null },
  { href: '/hub/strains',       key: 'ganjatarz'   as const, icon: '🧬', seekers: false, image: '/icons/strainAvatarIcon.png' },
  { href: '/hub/grow',          key: 'growSim'     as const, icon: '🌿', seekers: false, image: null },
  { href: '/hub/academy',       key: 'academy'     as const, icon: '📚', seekers: false, image: null },
  { href: '/hub/forum',         key: 'forumBridge' as const, icon: '🔍', seekers: false, image: null },
  { href: '/hub/leaderboard',   key: 'leaderboard' as const, icon: '🏆', seekers: false, image: null },
  { href: '/hub/marketplace',   key: 'marketplace' as const, icon: '🏪', seekers: false, image: null },
]

interface HubSidebarProps {
  session:          Session
  credits:          number
  avatar:           string
  xp:               number
  criticalWarnings: number
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

function NavIcon({ href, seekers }: { href: string; seekers: boolean }) {
  if (seekers) {
    return (
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#06080a' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
      </div>
    )
  }
  return null
}

export default function HubSidebar({ session, credits, avatar, xp, criticalWarnings }: HubSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showLevelPopup, setShowLevelPopup] = useState(false)
  const { current, next, percent } = getXPProgress(xp)
  const { t } = useLanguage()
  const nav = t.hubNav

  const isActive = (href: string) =>
    href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)

  const close = () => setIsOpen(false)

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '0.5px solid rgba(204,0,170,0.15)',
        overflowY: 'auto',
      }} className="hidden lg:flex flex-col">

        {/* User block */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid rgba(204,0,170,0.1)' }}>
          <Link href={`/hub/profile/${session.user.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Avatar username={session.user.username} avatar={avatar} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.username}
              </div>
              <button
                onClick={() => setShowLevelPopup(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#f0a830', marginTop: '2px' }}>
                  ⚡ Lv.{current.level} · {current.name}
                </div>
              </button>
            </div>
          </Link>

          {/* XP bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>XP</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830' }}>
                {xp.toLocaleString()}{next ? ` / ${next.xpRequired.toLocaleString()}` : ''}
              </span>
            </div>
            <div style={{ height: '3px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #f0a830, #ffc040)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Credits */}
          <Link href="/hub/credits" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', letterSpacing: '0.5px', textDecoration: 'none', transition: 'color 0.15s' }} className="hover:text-[#aa55ff]">
            💎 {credits} {nav.credits}
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(({ href, key, icon, seekers, image }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 16px', textDecoration: 'none', transition: 'all 0.15s',
                background: isActive(href) ? 'rgba(204,0,170,0.1)' : 'transparent',
                borderLeft: isActive(href) ? '2px solid #cc00aa' : '2px solid transparent',
              }}
              className="hover:bg-[rgba(204,0,170,0.06)]"
            >
              {seekers ? (
                <NavIcon href={href} seekers={seekers} />
              ) : image ? (
                <div style={{ width: '18px', height: '18px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isActive(href) ? 1 : 0.6 }} />
                </div>
              ) : (
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              )}
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px',
                color: isActive(href) ? '#cc00aa' : '#4a6066', transition: 'color 0.15s',
                flex: 1,
              }}>
                {nav[key]}
              </span>
              {href === '/hub/grow' && criticalWarnings > 0 && (
                <span style={{
                  background: '#cc00aa', color: '#050508',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '8px', fontWeight: 700,
                  borderRadius: '8px', padding: '1px 5px', flexShrink: 0,
                }}>
                  {criticalWarnings}
                </span>
              )}
            </Link>
          ))}

          {/* Profile */}
          <Link
            href={`/hub/profile/${session.user.username}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 16px', textDecoration: 'none', transition: 'all 0.15s',
              background: pathname.startsWith('/hub/profile') ? 'rgba(204,0,170,0.1)' : 'transparent',
              borderLeft: pathname.startsWith('/hub/profile') ? '2px solid #cc00aa' : '2px solid transparent',
            }}
            className="hover:bg-[rgba(204,0,170,0.06)]"
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>👤</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: pathname.startsWith('/hub/profile') ? '#cc00aa' : '#4a6066' }}>
              {nav.myProfile}
            </span>
          </Link>
        </nav>

        {/* Bottom: Shop + Logout */}
        <div style={{ borderTop: '0.5px solid rgba(204,0,170,0.1)', padding: '8px 0' }}>
          <Link
            href="/shop"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', textDecoration: 'none', transition: 'all 0.15s', borderLeft: '2px solid transparent' }}
            className="hover:bg-[rgba(0,212,200,0.06)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007a74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: '#007a74' }}>Shop</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            className="hover:bg-[rgba(255,255,255,0.03)]"
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0, opacity: 0.5 }}>⎋</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: '#4a6066' }}>{nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile: backdrop ── */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div
        className="flex flex-col lg:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '280px', zIndex: 100,
          background: 'rgba(8,0,16,0.98)',
          borderRight: '0.5px solid rgba(204,0,170,0.25)',
          backdropFilter: 'blur(20px)',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Drawer header */}
        <div style={{ padding: '16px', borderBottom: '0.5px solid rgba(204,0,170,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/hub/profile/${session.user.username}`} onClick={close} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <Avatar username={session.user.username} avatar={avatar} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.username}
              </div>
              <button
                onClick={() => setShowLevelPopup(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', marginTop: '1px' }}>
                  ⚡ Lv.{current.level} · {current.name}
                </div>
              </button>
            </div>
          </Link>
          <button
            onClick={close}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#4a6066', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* XP bar */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(204,0,170,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>XP</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830' }}>
              {xp.toLocaleString()}{next ? ` / ${next.xpRequired.toLocaleString()}` : ''}
            </span>
          </div>
          <div style={{ height: '3px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #f0a830, #ffc040)', borderRadius: '2px' }} />
          </div>
          <Link href="/hub/credits" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', marginTop: '8px', textDecoration: 'none', display: 'block', transition: 'color 0.15s' }} className="hover:text-[#aa55ff]">
            💎 {credits} {nav.credits}
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(({ href, key, icon, seekers, image }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', textDecoration: 'none',
                background: isActive(href) ? 'rgba(204,0,170,0.1)' : 'transparent',
                borderLeft: isActive(href) ? '2px solid #cc00aa' : '2px solid transparent',
              }}
            >
              {seekers ? (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#06080a' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
                </div>
              ) : image ? (
                <div style={{ width: '20px', height: '20px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isActive(href) ? 1 : 0.6 }} />
                </div>
              ) : (
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              )}
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '13px', letterSpacing: '0.5px',
                color: isActive(href) ? '#cc00aa' : '#e8f0ef',
              }}>
                {nav[key]}
              </span>
            </Link>
          ))}

          <Link
            href={`/hub/profile/${session.user.username}`}
            onClick={close}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', textDecoration: 'none',
              background: pathname.startsWith('/hub/profile') ? 'rgba(204,0,170,0.1)' : 'transparent',
              borderLeft: pathname.startsWith('/hub/profile') ? '2px solid #cc00aa' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>👤</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: pathname.startsWith('/hub/profile') ? '#cc00aa' : '#e8f0ef' }}>
              {nav.myProfile}
            </span>
          </Link>
        </nav>

        {/* Drawer footer */}
        <div style={{ borderTop: '0.5px solid rgba(204,0,170,0.1)', padding: '8px 0' }}>
          <Link
            href="/shop"
            onClick={close}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007a74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#007a74' }}>Shop</span>
          </Link>
          <button
            onClick={() => { close(); signOut({ callbackUrl: '/' }) }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', opacity: 0.5 }}>⎋</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#4a6066' }}>{nav.logout}</span>
          </button>
        </div>
      </div>

      {/* ── Mobile: bottom tab bar ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '56px',
        background: 'rgba(8,0,16,0.97)',
        borderTop: '0.5px solid rgba(204,0,170,0.2)',
        backdropFilter: 'blur(12px)',
        zIndex: 80,
      }} className="flex lg:hidden">
        {[
          { href: '/hub',         labelKey: 'home'      as const, icon: '⌂' },
          { href: '/hub/grow',    labelKey: 'growSim'   as const, icon: '🌿' },
          { href: '/hub/forum',   labelKey: 'forumBridge'as const, icon: '🔍' },
          { href: `/hub/profile/${session.user.username}`, labelKey: 'myProfile' as const, icon: '👤' },
        ].map(({ href, labelKey, icon }) => {
          const active = href.startsWith('/hub/profile')
            ? pathname.startsWith('/hub/profile')
            : href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '2px', textDecoration: 'none', position: 'relative',
                borderTop: active ? '1.5px solid #cc00aa' : '1.5px solid transparent',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px', color: active ? '#cc00aa' : '#4a6066' }}>
                {nav[labelKey]}
              </span>
              {href === '/hub/grow' && criticalWarnings > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '12px',
                  background: '#cc00aa', color: '#050508',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '7px', fontWeight: 700,
                  borderRadius: '6px', padding: '1px 4px',
                }}>
                  {criticalWarnings}
                </span>
              )}
            </Link>
          )
        })}

        {/* Menu button — opens drawer */}
        <button
          onClick={() => setIsOpen(true)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '2px', background: 'none', border: 'none', cursor: 'pointer',
            borderTop: '1.5px solid transparent',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a6066" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px', color: '#4a6066' }}>
            {nav.menu}
          </span>
        </button>
      </nav>

      {/* ── Level popup ── */}
      {showLevelPopup && (
        <>
          <div
            onClick={() => setShowLevelPopup(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 201, width: 'min(92vw, 380px)',
            background: 'rgba(8,0,16,0.98)', border: '0.5px solid rgba(240,168,48,0.3)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '0.5px solid rgba(240,168,48,0.12)' }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#f0a830', letterSpacing: '0.5px' }}>
                {nav.levelPopupTitle}
              </div>
              <button
                onClick={() => setShowLevelPopup(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '4px' }}
              >
                {nav.levelPopupClose}
              </button>
            </div>
            {/* Current XP bar */}
            <div style={{ padding: '12px 20px', borderBottom: '0.5px solid rgba(240,168,48,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '0.5px' }}>XP</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830' }}>
                  {xp.toLocaleString()}{next ? ` / ${next.xpRequired.toLocaleString()}` : ''}
                </span>
              </div>
              <div style={{ height: '3px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #f0a830, #ffc040)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
            {/* Level list */}
            <div style={{ overflowY: 'auto', maxHeight: '60vh', padding: '8px 0' }}>
              {LEVELS.map((lvl, i) => {
                const isCurrent = lvl.level === current.level
                const isReached = xp >= lvl.xpRequired
                const perk = (nav.levelPerks as readonly string[])[i] ?? ''
                return (
                  <div key={lvl.level} style={{
                    display: 'flex', gap: '12px', padding: '10px 20px',
                    background: isCurrent ? 'rgba(240,168,48,0.08)' : 'transparent',
                    borderLeft: isCurrent ? '2px solid #f0a830' : '2px solid transparent',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ flexShrink: 0, width: '28px', textAlign: 'center', paddingTop: '1px' }}>
                      <div style={{
                        fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700,
                        color: isCurrent ? '#f0a830' : isReached ? 'rgba(240,168,48,0.5)' : '#4a6066',
                      }}>
                        {lvl.level}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: isCurrent ? '#f0a830' : isReached ? 'rgba(240,168,48,0.6)' : '#4a6066', fontWeight: isCurrent ? 700 : 400 }}>
                          {lvl.name}
                          {isCurrent && <span style={{ marginLeft: '6px', fontSize: '8px', color: '#00d4c8' }}>← you</span>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', flexShrink: 0, marginLeft: '8px' }}>
                          {lvl.xpRequired > 0 ? `${lvl.xpRequired.toLocaleString()} ${nav.levelPopupXpLabel}` : '—'}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: isReached ? 'rgba(232,240,239,0.5)' : 'rgba(74,96,102,0.7)', lineHeight: 1.4 }}>
                        {isReached ? '✓ ' : ''}{perk}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
