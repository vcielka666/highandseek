'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import GuestRegisterPrompt from '@/components/hub/GuestRegisterPrompt'
import { EQUIP_IMGS } from '@/lib/grow/tentLayout'

interface GuestGrow {
  strainName:      string
  strainSlug:      string
  strainType:      string
  floweringTime:   number
  setup: {
    tentSize:       string
    lightType:      string
    lightWatts:     number
    medium:         string
  }
  dayDurationSeconds: number
}

const TYPE_COLOR: Record<string, string> = {
  indica:  '#8844cc',
  sativa:  '#00d4c8',
  hybrid:  '#cc00aa',
}

export default function GrowPreviewPage() {
  const router = useRouter()
  const [grow, setGrow]         = useState<GuestGrow | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('guestGrow') : null
    if (!raw) { router.replace('/hub/grow/setup'); return }
    try {
      setGrow(JSON.parse(raw) as GuestGrow)
    } catch {
      router.replace('/hub/grow/setup')
    }
  }, [router])

  // Reveal animation after 400ms
  useEffect(() => {
    if (!grow) return
    const t = setTimeout(() => setRevealed(true), 400)
    return () => clearTimeout(t)
  }, [grow])

  if (!grow) return null

  const accent     = TYPE_COLOR[grow.strainType] ?? '#cc00aa'
  const totalDays  = 7 + 28 + grow.floweringTime   // seedling + veg + flower
  const xpEstimate = Math.round(totalDays * 3.5)
  const creditsEstimate = Math.round(totalDays * 0.8)

  const ACTIONS = [
    { label: '💧 Water',      color: '#00d4c8' },
    { label: '🌿 Feed',       color: '#8844cc' },
    { label: '💡 Adjust Light', color: '#f0a830' },
  ]

  return (
    <>
      <GuestRegisterPrompt open={showPrompt} onClose={() => setShowPrompt(false)} variant="grow" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: 8 }}>
            GUEST PREVIEW · GROW SIMULATOR
          </div>
          <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(22px, 5vw, 34px)', color: '#e8f0ef', letterSpacing: '2px', margin: 0, lineHeight: 1 }}>
            {grow.strainName}
          </h1>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: accent, marginTop: 6 }}>
            {grow.strainType.toUpperCase()} · {grow.setup.tentSize} tent · {grow.setup.lightWatts}W {grow.setup.lightType.toUpperCase()}
          </div>
        </div>

        {/* Tent visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.96 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
            border: `0.5px solid ${accent}30`,
            marginBottom: 20,
            boxShadow: `0 0 40px ${accent}15`,
          }}
        >
          {/* Tent bg */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EQUIP_IMGS.tentBg}
            alt="tent"
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />

          {/* Day 1 seedling plant overlay */}
          <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '18%',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/grow/plant/healthy/plant-day3-seedling.png" alt="seedling" style={{ width: '100%', filter: `drop-shadow(0 0 12px ${accent}60)` }} />
          </div>

          {/* Day / stage badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '6px 12px',
            border: '0.5px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, color: '#e8f0ef' }}>Day 1</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: '#00d4c8', letterSpacing: '1px' }}>SEEDLING</div>
          </div>

          {/* Health badge */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '6px 12px',
            border: '0.5px solid rgba(0,212,200,0.2)',
          }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, color: '#00d4c8' }}>100%</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: '#4a6066', letterSpacing: '1px' }}>HEALTH</div>
          </div>

          {/* Guest overlay with CTA */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.6) 60%, transparent 100%)',
            padding: '40px 20px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'rgba(232,240,239,0.5)', marginBottom: 10, letterSpacing: '0.5px' }}>
              Register to grow this for real — XP and credits await at harvest
            </div>
            <button
              onClick={() => setShowPrompt(true)}
              style={{
                fontFamily: 'var(--font-cacha)', fontSize: 13, letterSpacing: '1px',
                color: '#050508', background: accent,
                border: 'none', borderRadius: 6, padding: '10px 24px',
                cursor: 'pointer',
              }}
            >
              Start Growing Free →
            </button>
          </div>
        </motion.div>

        {/* Care actions — all open registration prompt */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: 10 }}>
                CARE ACTIONS · REGISTER TO USE
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => setShowPrompt(true)}
                    style={{
                      fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '0.5px',
                      color: a.color, background: `${a.color}12`,
                      border: `0.5px solid ${a.color}30`,
                      borderRadius: 6, padding: '10px 18px',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${a.color}22`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${a.color}12`)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projected harvest stats */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{
                background: `${accent}08`,
                border: `0.5px solid ${accent}18`,
                borderRadius: 10, padding: '18px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: 14 }}>
                PROJECTED HARVEST (IF YOU REGISTER NOW)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Days', value: `~${totalDays}d`, color: '#e8f0ef' },
                  { label: 'XP Earned',  value: `~${xpEstimate}`,  color: '#f0a830' },
                  { label: 'Credits',    value: `💎 ~${creditsEstimate}`, color: '#8844cc' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 18, fontWeight: 700, color: stat.color, marginBottom: 3 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA row */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <button
                onClick={() => setShowPrompt(true)}
                style={{
                  fontFamily: 'var(--font-cacha)', fontSize: 12, letterSpacing: '1px',
                  color: '#050508', background: accent,
                  border: 'none', borderRadius: 6, padding: '11px 24px',
                  cursor: 'pointer', flex: 1, minWidth: 140,
                }}
              >
                Create Free Account
              </button>
              <Link
                href="/hub/grow/setup"
                style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '0.5px',
                  color: '#4a6066', textDecoration: 'none',
                  border: '0.5px solid rgba(74,96,102,0.3)',
                  borderRadius: 6, padding: '11px 18px', whiteSpace: 'nowrap',
                }}
              >
                ← Change Setup
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}
