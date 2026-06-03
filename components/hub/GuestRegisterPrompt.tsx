'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/stores/languageStore'

type Variant = 'grow' | 'strain' | 'market' | 'generic'

interface Props {
  open: boolean
  onClose: () => void
  variant?: Variant
}

export default function GuestRegisterPrompt({ open, onClose, variant = 'generic' }: Props) {
  const { t } = useLanguage()
  const g = t.guest

  const title = variant === 'grow'   ? g.promptGrowTitle
              : variant === 'strain' ? g.promptStrainTitle
              : variant === 'market' ? g.promptMarketTitle
              : g.promptTitle

  const body  = variant === 'grow'   ? g.promptGrowBody
              : variant === 'strain' ? g.promptStrainBody
              : variant === 'market' ? g.promptMarketBody
              : g.promptGenericBody

  const perks = variant === 'grow'
    ? [g.firstGrowFree, g.noCreditCard, g.free]
    : [g.free, g.noCreditCard]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(6px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'all',
                background: '#050508',
                border: '0.5px solid rgba(0,212,200,0.25)',
                borderRadius: 12,
                padding: '32px 28px',
                maxWidth: 420,
                width: '100%',
                boxShadow: '0 0 60px rgba(0,212,200,0.08), 0 24px 48px rgba(0,0,0,0.6)',
              }}
            >
              {/* Glow dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00d4c8', boxShadow: '0 0 12px #00d4c8',
                margin: '0 auto 20px',
              }} />

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-cacha)', fontSize: 'clamp(20px,4vw,26px)',
                color: '#e8f0ef', textAlign: 'center', letterSpacing: '1px',
                margin: '0 0 12px', lineHeight: 1.2,
              }}>
                {title}
              </h2>

              {/* Body */}
              <p style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: 14,
                color: '#7a9ea0', textAlign: 'center', lineHeight: 1.6,
                margin: '0 0 24px',
              }}>
                {body}
              </p>

              {/* Perks */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 10,
                flexWrap: 'wrap', marginBottom: 28,
              }}>
                {perks.map(p => (
                  <span key={p} style={{
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    color: 'rgba(0,212,200,0.8)',
                    background: 'rgba(0,212,200,0.06)',
                    border: '0.5px solid rgba(0,212,200,0.2)',
                    borderRadius: 4, padding: '4px 10px',
                  }}>
                    ✓ {p}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <a
                href="/auth/register"
                style={{
                  display: 'block', width: '100%', padding: '14px',
                  background: '#00d4c8', color: '#050508', borderRadius: 6,
                  fontFamily: 'var(--font-cacha)', fontSize: 14,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  textAlign: 'center', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#00f0e2' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#00d4c8' }}
              >
                {g.registerCTA}
              </a>

              {/* Sign in link */}
              <p style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: 11,
                color: '#4a6066', textAlign: 'center', marginTop: 16,
              }}>
                {g.alreadyHave}{' '}
                <a href="/auth/login" style={{ color: '#00d4c8', textDecoration: 'none' }}>
                  {g.signIn}
                </a>
              </p>

              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4a6066', padding: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
