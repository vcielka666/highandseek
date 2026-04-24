'use client'

import React, { useEffect, useRef, useState, useTransition, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import Lottie from 'lottie-react'
import type PlantImageType from '@/lib/grow/PlantImage'
import { useLanguage } from '@/stores/languageStore'
import { calculateVPD, vpdStatus, generateSmartGuide } from '@/lib/grow/attributes'
import type { GrowStage, GrowAttributes, Setup } from '@/lib/grow/attributes'
import {
  TENT_LAYOUT, EQUIP_IMGS, SVG_W, PLANT_FO_Y, PLANT_FO_H,
  lampTopSVG, getLightImageUrl, getLampSVGWidth,
  getPlantContainerWidth, getPlantFOX,
} from '@/lib/grow/tentLayout'

type PlantImageProps = Parameters<typeof PlantImageType>[0]
const PlantImage = dynamic(() => import('@/lib/grow/PlantImage'), { ssr: false }) as React.ComponentType<PlantImageProps>

// ── Action animation data ──────────────────────────────────────────────────────
const ACTION_ANIMS: Partial<Record<string, string>> = {
  water: '/action animations/water.json',
}

// Equipment URLs and positions are in lib/grow/tentLayout.ts (EQUIP_IMGS + TENT_LAYOUT)

// ── Types ──────────────────────────────────────────────────────────────────────

interface AttributeRange {
  value: number
  optimal: { min: number; max: number }
  status: 'optimal' | 'warning' | 'critical'
}

const STRAIN_LOCAL_IMG: Record<string, string> = {
  'cherrygasm':   '/strains/genetics/cherrygasm.jpg',
  'jack-herer':   '/strains/genetics/jack-herer.jpg',
  'odb':          '/strains/genetics/odb.jpg',
  'dosidos':      '/strains/dosidos.jpg',
  'milky-dreams': '/strains/genetics/milky-dreams.jpg',
  'tarte-tarin':  '/strains/genetics/tarte-tarin.jpg',
  'velvet-moon':  '/strains/genetics/velvet-moon.jpg',
}

interface VirtualGrow {
  _id: string
  strainSlug: string
  strainName: string
  strainType: 'indica' | 'sativa' | 'hybrid'
  floweringTime: number
  stage: string
  currentDay: number
  health: number
  maxHealth: number
  yieldProjection: number
  xpEarned: number
  status: string
  setup: {
    tentSize: string; lightType: string; lightWatts: number; lightBrand: string
    medium: string; potSize: string; watering: string; nutrients: string
    hasExhaustFan: boolean; exhaustCFM: number; hasCirculationFan: boolean
    hasCarbonFilter: boolean; hasPHMeter: boolean; hasECMeter: boolean; hasHygrometer: boolean
    plantCount?: number
  }
  environment: { temperature: number; humidity: number; ph: number; ec: number; lightHours: number; lightHeight: number; exhaustFanSpeed: number }
  attributes: {
    temperature: AttributeRange; humidity: AttributeRange; light: AttributeRange
    ventilation: AttributeRange; nutrients: AttributeRange; watering: AttributeRange
  }
  warnings: Array<{ attribute: string; message: string; guide: string; severity: string; resolvedAt: string | null }>
  actions: Array<{ type: string; timestamp: string; xpEarned: number; effect: string }>
  journalEntries: Array<{ day: number; stage: string; mood: string; notes: string; photoUrl: string }>
  dayDurationSeconds: number
  timeMode: string
  isAccelerated: boolean
  isPerkEligible: boolean
  lastAdvanced: string
  createdAt: string
  manualFlipDay?: number | null
  isClone?: boolean
  hasLollipoped?: boolean
  purchasedUpgrades?: Array<{ type: string; name: string; creditsCost: number }>
  setupChangedGroups?: string[]
}

// ── Status color ───────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'optimal')  return '#56c254'  // natural plant green
  if (s === 'warning')  return '#f0a830'
  return '#ff4040'   // critical → red
}

// ── Attribute bar ──────────────────────────────────────────────────────────────

function AttrBar({
  label, attrKey, attr, tooltip,
}: {
  label: string; attrKey: string; attr: AttributeRange; tooltip: string
}) {
  const pct = Math.min(100, Math.max(0, (attr.value / (attr.optimal.max * 1.5)) * 100))
  const col = statusColor(attr.status)
  const [showTip, setShowTip] = useState(false)

  return (
    <div style={{ marginBottom: '10px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>
            {label}
          </span>
          <button
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onClick={() => setShowTip(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#4a6066', fontSize: '9px', lineHeight: 1 }}
          >
            ℹ️
          </button>
        </div>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: col }}>
          {attr.status} · {Math.round(attr.value)}
        </span>
      </div>
      <div style={{ height: '3px', background: 'rgba(74,96,102,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: '2px', transition: 'width 0.4s' }} />
      </div>
      {showTip && (
        <div style={{
          position: 'absolute', left: 0, top: '100%', zIndex: 20, marginTop: '4px',
          background: '#0a1a1c', border: '0.5px solid rgba(74,96,102,0.4)',
          borderRadius: '5px', padding: '10px 12px',
          fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#e8f0ef', lineHeight: 1.6,
          whiteSpace: 'pre-line', maxWidth: '240px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

// ── Tutorial overlay ───────────────────────────────────────────────────────────

function TutorialOverlay({ onClose, g }: { onClose: () => void; g: { tutorialSlides: ReadonlyArray<{ readonly icon: string; readonly title: string; readonly body: string }>; tutorialSkip: string; tutorialBack: string; tutorialNext: string; tutorialStart: string } }) {
  const [slide, setSlide] = useState(0)
  const slides = g.tutorialSlides
  const total = slides.length
  const current = slides[slide]
  const isLast = slide === total - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'rgba(13,0,20,0.98)', border: '0.5px solid rgba(204,0,170,0.3)',
        borderRadius: '12px', padding: '36px 32px', maxWidth: '440px', width: '100%',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px',
        }}>
          {g.tutorialSkip}
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>{current.icon}</div>
          <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '20px', color: '#e8f0ef', letterSpacing: '1px', marginBottom: '16px' }}>
            {current.title}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(232,240,239,0.65)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {current.body}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: i === slide ? '#cc00aa' : 'rgba(204,0,170,0.2)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {slide > 0 && (
            <button onClick={() => setSlide(s => s - 1)} style={{
              flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
              padding: '10px', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '5px',
              background: 'transparent', color: '#4a6066', cursor: 'pointer',
            }}>
              {g.tutorialBack}
            </button>
          )}
          {isLast ? (
            <button onClick={onClose} style={{
              flex: 2, fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px',
              padding: '10px', border: 'none', borderRadius: '5px',
              background: '#cc00aa', color: '#050508', cursor: 'pointer',
            }}>
              {g.tutorialStart}
            </button>
          ) : (
            <button onClick={() => setSlide(s => s + 1)} style={{
              flex: 2, fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
              padding: '10px', border: '0.5px solid rgba(204,0,170,0.3)', borderRadius: '5px',
              background: 'rgba(204,0,170,0.08)', color: '#cc00aa', cursor: 'pointer',
            }}>
              {g.tutorialNext}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stage guide ────────────────────────────────────────────────────────────────

function StageGuide({ stage, title, tips }: { stage: string; title: string; tips: readonly string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '0.5px solid rgba(0,212,200,0.15)', borderRadius: '6px', overflow: 'hidden', marginTop: '12px' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: 'rgba(0,212,200,0.05)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#00d4c8' }}>
          {title}
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {tips.map((tip, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.7)',
              lineHeight: 1.6, paddingLeft: '8px', marginBottom: i < tips.length - 1 ? '4px' : 0,
              borderLeft: '2px solid rgba(0,212,200,0.3)',
            }}>
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Status bar ─────────────────────────────────────────────────────────────────

function StatusBar({
  cycleLabel, cycleSub, cycleColor, cycleInfoTitle, cycleInfoBody,
  stageLabel, stageColor, stageInfoTitle, stageInfoBody,
  progressLabel, yieldLabel, yieldInfoTitle, yieldInfoBody,
}: {
  cycleLabel: string; cycleSub: string; cycleColor: string; cycleInfoTitle: string; cycleInfoBody: string
  stageLabel: string; stageColor: string; stageInfoTitle: string; stageInfoBody: string
  progressLabel: string; yieldLabel: string; yieldInfoTitle: string; yieldInfoBody: string
}) {
  const [open, setOpen] = useState<'cycle' | 'stage' | 'yield' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const seg = (
    id: 'cycle' | 'stage' | 'yield',
    label: string,
    color: string,
    infoTitle: string,
    infoBody: string,
  ) => (
    <span style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => v === id ? null : id)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color,
          letterSpacing: '0.3px',
          textDecoration: open === id ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          textDecorationColor: color,
        }}
      >
        {label} <span style={{ fontSize: '7px', opacity: 0.5 }}>ⓘ</span>
      </button>
      {open === id && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          width: '220px', background: '#050f14',
          border: '0.5px solid rgba(74,96,102,0.35)', borderRadius: '8px', padding: '12px',
          zIndex: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {infoTitle}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.7)', lineHeight: 1.6 }}>
            {infoBody}
          </div>
        </div>
      )}
    </span>
  )

  return (
    <div ref={ref} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginTop: '10px', flexWrap: 'wrap',
    }}>
      {seg('cycle', cycleLabel, cycleColor, cycleInfoTitle, cycleInfoBody)}
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>{cycleSub}</span>
      <span style={{ color: 'rgba(74,96,102,0.3)', fontSize: '10px' }}>·</span>
      {seg('stage', stageLabel, stageColor, stageInfoTitle, stageInfoBody)}
      <span style={{ color: 'rgba(74,96,102,0.3)', fontSize: '10px' }}>·</span>
      {seg('yield', `${progressLabel} · ${yieldLabel}`, '#00d4c8', yieldInfoTitle, yieldInfoBody)}
    </div>
  )
}

// ── Grow end overlay (failed / abandoned) ─────────────────────────────────────

function GrowEndOverlay({ grow, g, onStartNew }: {
  grow: VirtualGrow
  g: Record<string, unknown>
  onStartNew: () => void
}) {
  const router = useRouter()
  const isFailed = grow.status === 'failed'
  const accentColor = isFailed ? '#cc00aa' : '#4a6066'
  const title = isFailed
    ? (g.growFailedTitle as string)
    : (g.growAbandonedTitle as string)
  const sub = isFailed
    ? (g.growFailedSub as string)
    : (g.growAbandonedSub as string)

  const lastWarnings = grow.warnings
    .filter(w => !w.resolvedAt && w.severity === 'critical')
    .slice(0, 3)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(5,5,8,0.93)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'rgba(10,0,16,0.98)',
        border: `0.5px solid ${accentColor}40`,
        borderRadius: '12px', padding: '36px 28px', maxWidth: '420px', width: '100%',
        animation: 'dropIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
        boxShadow: `0 0 60px ${accentColor}18, 0 24px 60px rgba(0,0,0,0.7)`,
      }}>

        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px', lineHeight: 1 }}>
            {isFailed ? '💀' : '🚪'}
          </div>
          <div style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(22px,5vw,32px)', color: '#e8f0ef', letterSpacing: '2px', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
            {grow.strainName} · {sub}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: g.growEndDayLabel as string, value: `${grow.currentDay}`, sub: g.growEndDaySuffix as string },
            { label: g.growEndXpLabel as string,  value: `+${grow.xpEarned}`, sub: 'xp' },
            { label: g.growEndHealthLabel as string, value: `${Math.round(grow.health)}%`, sub: '' },
          ].map(({ label, value, sub: s }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(74,96,102,0.15)',
              borderRadius: '8px', padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '6px' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: '#e8f0ef' }}>
                {value}
              </div>
              {s && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '2px' }}>{s}</div>}
            </div>
          ))}
        </div>

        {/* What went wrong */}
        {isFailed && (
          <div style={{
            background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.15)',
            borderRadius: '6px', padding: '14px 16px', marginBottom: '24px',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
              {g.growEndWhyTitle as string}
            </div>
            {lastWarnings.length > 0 ? lastWarnings.map((w, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.7)',
                paddingLeft: '8px', borderLeft: '2px solid rgba(204,0,170,0.35)',
                marginBottom: i < lastWarnings.length - 1 ? '8px' : 0, lineHeight: 1.5,
              }}>
                {w.message}
              </div>
            )) : (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
                {g.growEndNoWarnings as string}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onStartNew}
            style={{
              fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
              color: '#050508', background: '#cc00aa', border: 'none', borderRadius: '4px',
              padding: '12px 20px', cursor: 'pointer', width: '100%',
            }}
          >
            {g.growEndStartNew as string}
          </button>
          <button
            onClick={() => router.push('/hub')}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
              color: '#4a6066', background: 'transparent',
              border: '0.5px solid rgba(74,96,102,0.25)', borderRadius: '4px',
              padding: '11px 20px', cursor: 'pointer', width: '100%',
            }}
          >
            {g.growEndBackHub as string}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ActiveGrowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLanguage()
  const g = t.growUI

  const [grow, setGrow]       = useState<VirtualGrow | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, start]      = useTransition()
  const [activeWarning, setActiveWarning] = useState<VirtualGrow['warnings'][0] | null>(null)
  const [activeTab, setActiveTab]         = useState<'attributes' | 'environment' | 'setup' | 'stats'>('attributes')
  const [countdown, setCountdown]         = useState('')
  const [canAdvance, setCanAdvance]       = useState(false)
  const [dayProgress, setDayProgress]    = useState(0)
  const [showTutorial, setShowTutorial]   = useState(false)
  const [envExpanded, setEnvExpanded]    = useState<string | null>(null)
  const [isLight, setIsLight]            = useState(true)
  const [cycleCountdown, setCycleCountdown] = useState('')
  const [upgradePending, setUpgradePending] = useState<string | null>(null)
  const [editingSetup, setEditingSetup]     = useState<string | null>(null)

  // Lamp drag slider
  const [lampSliderActive, setLampSliderActive] = useState(false)
  const [dragHeight, setDragHeight]             = useState(60)
  const [committedHeight, setCommittedHeight]   = useState<number | null>(null)
  const dragStartY      = useRef(0)
  const dragStartH      = useRef(60)
  const dragHeightRef   = useRef(60)
  const isDragging      = useRef(false)

  // Defoliate confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; title: string; body: string; severity: 'warning' | 'danger' } | null>(null)

  // Action animation overlay
  const [actionAnim, setActionAnim] = useState<{ src: string; animData: object } | null>(null)

  // Fan speed drag slider
  const [fanSliderActive, setFanSliderActive]   = useState(false)
  const [dragFanSpeed, setDragFanSpeed]         = useState(100)
  const [committedFanSpeed, setCommittedFanSpeed] = useState<number | null>(null)
  const fanDragStartY   = useRef(0)
  const fanDragStartS   = useRef(100)
  const fanDragSpeedRef = useRef(100)
  const isFanDragging   = useRef(false)

  useEffect(() => {
    fetch(`/api/hub/grow?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.grow) setGrow(d.grow); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('hs-grow-tutorial-seen')) {
      setShowTutorial(true)
    }
  }, [])

  // Countdown + day progress bar
  useEffect(() => {
    if (!grow) return
    const intervalMs = (grow.dayDurationSeconds ?? 86400) * 1000
    const tick = () => {
      const startedAt = new Date(grow.lastAdvanced).getTime()
      const nextAt    = startedAt + intervalMs
      const msLeft    = nextAt - Date.now()
      const elapsed   = Date.now() - startedAt
      setDayProgress(Math.min(100, Math.max(0, Math.round((elapsed / intervalMs) * 100))))
      if (msLeft <= 0) {
        setCanAdvance(true)
        setCountdown('')
        return
      }
      setCanAdvance(false)
      const totalSecs = Math.ceil(msLeft / 1000)
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      const s = totalSecs % 60
      setCountdown(`${h > 0 ? `${h}h ` : ''}${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [grow?.lastAdvanced, grow?.isAccelerated])

  // Auto-advance: fire when countdown reaches zero
  useEffect(() => {
    if (!canAdvance || pending || !grow || grow.status !== 'active' || grow.stage === 'harvest') return
    advanceDay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdvance])

  // Day / night cycle — synced to lastAdvanced so lights ON = start of each grow day
  useEffect(() => {
    if (!grow) return
    const tick = () => {
      const lightHours = grow.environment.lightHours ?? 18
      const cycleSecs  = grow.dayDurationSeconds ?? 86400
      const lightSecs  = (lightHours / 24) * cycleSecs
      const darkSecs   = cycleSecs - lightSecs
      // Position within the CURRENT day (since last advance)
      const elapsedSecs = (Date.now() - new Date(grow.lastAdvanced).getTime()) / 1000
      const posInCycle  = Math.min(elapsedSecs, cycleSecs)
      const lit         = posInCycle < lightSecs
      setIsLight(lit)
      const secsLeft = lit
        ? Math.ceil(lightSecs - posInCycle)
        : Math.ceil(darkSecs - (posInCycle - lightSecs))
      const h = Math.floor(secsLeft / 3600)
      const m = Math.floor((secsLeft % 3600) / 60)
      const s = secsLeft % 60
      // Show seconds for fast grows (cycle < 1h)
      setCycleCountdown(cycleSecs < 3600
        ? `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
        : `${h > 0 ? `${h}h ` : ''}${m}m`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [grow?.lastAdvanced, grow?.environment.lightHours, grow?.dayDurationSeconds])

  const closeTutorial = () => {
    localStorage.setItem('hs-grow-tutorial-seen', '1')
    setShowTutorial(false)
  }

  // ── Lamp drag ──────────────────────────────────────────────────────────────

  const startLampDrag = (clientY: number) => {
    const h = grow?.environment.lightHeight ?? 60
    dragStartY.current    = clientY
    dragStartH.current    = h
    dragHeightRef.current = h
    setDragHeight(h)
    setLampSliderActive(true)
    isDragging.current    = true
  }

  useEffect(() => {
    if (!lampSliderActive) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      // dragging up = raising lamp = more distance from plant (higher cm)
      const delta = dragStartY.current - clientY
      const newH  = Math.min(100, Math.max(20, Math.round(dragStartH.current + delta * 0.5)))
      dragHeightRef.current = newH
      setDragHeight(newH)
    }

    const onEnd = async () => {
      if (!isDragging.current) return
      isDragging.current = false
      const h = dragHeightRef.current
      setLampSliderActive(false)
      setCommittedHeight(h)            // hold visual position while API is in flight
      const res  = await fetch('/api/hub/grow/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'light_height', value: h }),
      })
      const data = await res.json()
      if (res.ok) {
        setGrow(data.grow)
        setCommittedHeight(null)       // grow state now has the updated height
        toast.success(data.effect)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lampSliderActive])

  // ── Fan speed drag ─────────────────────────────────────────────────────────

  const startFanDrag = (clientY: number) => {
    const s = grow?.environment.exhaustFanSpeed ?? 100
    fanDragStartY.current   = clientY
    fanDragStartS.current   = s
    fanDragSpeedRef.current = s
    setDragFanSpeed(s)
    setFanSliderActive(true)
    isFanDragging.current   = true
  }

  useEffect(() => {
    if (!fanSliderActive) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isFanDragging.current) return
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      // dragging up = higher speed, dragging down = lower speed
      const delta = fanDragStartY.current - clientY
      const newS  = Math.min(100, Math.max(0, Math.round(fanDragStartS.current + delta * 0.8)))
      fanDragSpeedRef.current = newS
      setDragFanSpeed(newS)
    }

    const onEnd = async () => {
      if (!isFanDragging.current) return
      isFanDragging.current = false
      const s = fanDragSpeedRef.current
      setFanSliderActive(false)
      setCommittedFanSpeed(s)
      const res  = await fetch('/api/hub/grow/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fan_speed', value: s }),
      })
      const data = await res.json()
      if (res.ok) {
        setGrow(data.grow)
        setCommittedFanSpeed(null)
        toast.success(data.effect)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fanSliderActive])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function doAction(type: string) {
    // Fire animation immediately, before API responds
    const animSrc = ACTION_ANIMS[type]
    if (animSrc) {
      fetch(animSrc).then(r => r.json()).then(d => setActionAnim({ src: animSrc, animData: d })).catch(() => {})
    }
    start(async () => {
      const res  = await fetch('/api/hub/grow/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Action failed'); return }
      setGrow(data.grow)
      toast.success(data.effect)
    })
  }

  function requestAction(type: string) {
    if (type === 'defoliate' && grow) {
      const seedlingEnd = grow.isClone ? 4 : 7
      const vegDays = grow.currentDay - seedlingEnd
      const prevDefoCount = grow.actions.filter(a => a.type === 'defoliate').length

      if (grow.stage === 'seedling') {
        setConfirmDialog({ type, title: g.defoliateSeedlingTitle, body: g.defoliateSeedlingBody, severity: 'danger' })
        return
      }
      if (grow.stage === 'veg' && vegDays < 14) {
        setConfirmDialog({ type, title: g.defoliateEarlyVegTitle, body: g.defoliateEarlyVegBody, severity: 'warning' })
        return
      }
      if ((grow.stage === 'late_flower' || grow.stage === 'harvest') && prevDefoCount >= 2) {
        setConfirmDialog({ type, title: g.defoliateLatFlowerTitle, body: g.defoliateLatFlowerBody, severity: 'warning' })
        return
      }
    }
    doAction(type)
  }

  async function advanceDay() {
    start(async () => {
      const res  = await fetch('/api/hub/grow/advance-day', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) { toast.error(g.nextAdvanceIn(Math.ceil(data.secondsLeft / 3600))); return }
        if (res.status === 409 && data.readyToHarvest) {
          toast.success('🌾 Your plant is ready to harvest!')
          return
        }
        toast.error(data.error ?? 'Failed'); return
      }
      setGrow(data.grow)
      if (data.daysAdvanced > 1) toast.success(`⏩ Caught up ${data.daysAdvanced} days`)
      if (data.stageChanged) toast.success(g.stageChanged(data.grow.stage.replace('_', ' ')))
    })
  }

  async function doReset() {
    if (!window.confirm(g.resetGrowConfirm)) return
    const res  = await fetch('/api/hub/grow/reset', { method: 'POST' })
    if (res.ok) {
      toast.success(g.resetGrowSuccess)
      router.push('/hub/grow')
    }
  }

  async function doHarvest() {
    start(async () => {
      const res  = await fetch('/api/hub/grow/harvest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Harvest failed'); return }
      router.push(`/hub/grow/${id}/harvest`)
    })
  }

  async function doSetupChange(fields: Record<string, unknown>) {
    setEditingSetup(null)
    const res  = await fetch('/api/hub/grow/setup', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 402) toast.error(g.notEnoughCreditsGrow)
      else toast.error(data.error ?? 'Failed to update setup')
      return
    }
    setGrow(data.grow)
    if (data.firstChange) toast.success(g.setupUpdatedFirst(data.xpAwarded))
    else toast.success(g.setupUpdated)
  }

  async function doUpgrade(type: string, cost: number) {
    setUpgradePending(type)
    try {
      const res  = await fetch('/api/hub/grow/upgrade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) toast.error(g.upgradeErrorCredits(data.required - cost))
        else toast.error(data.error ?? 'Upgrade failed')
        return
      }
      setGrow(data.grow)
      toast.success(g.upgradeSuccess(data.grow.purchasedUpgrades?.at(-1)?.name ?? type))
    } finally {
      setUpgradePending(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
      {g.loadingGrow}
    </div>
  )

  if (!grow) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', marginBottom: '16px' }}>
        {g.growNotFound}
      </div>
      <Link href="/hub/grow" style={{ color: '#cc00aa', fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>{g.backLink}</Link>
    </div>
  )

  // Completed grow → redirect to harvest report
  if (grow.status === 'completed') {
    router.replace(`/hub/grow/${id}/harvest`)
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
        {g.loadingGrow}
      </div>
    )
  }

  // Failed / abandoned → show end overlay over a minimal dark background
  if (grow.status === 'failed' || grow.status === 'abandoned') {
    return (
      <div style={{ minHeight: '100vh', background: '#050508' }}>
        <GrowEndOverlay
          grow={grow}
          g={g as unknown as Record<string, unknown>}
          onStartNew={() => router.push('/hub/grow')}
        />
      </div>
    )
  }

  // hasMeter — hygrometer either in original setup or purchased as upgrade
  const hasMeter = grow.setup.hasHygrometer || (grow.purchasedUpgrades?.some(u => u.type === 'thermohygrometer') ?? false)

  // Setup change cost hint — shown on groups not yet changed
  const setupChangedGroups = grow.setupChangedGroups ?? []
  const FREE_SETUP_GROUPS = new Set(['phMeter', 'hygrometer'])
  const setupCostHint = (group: string) => !setupChangedGroups.includes(group)
    ? FREE_SETUP_GROUPS.has(group)
      ? <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(0,212,200,0.5)' }}>FREE·+50xp</span>
      : <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(240,168,48,0.45)' }}>1cr·+50xp</span>
    : null

  // Only show DB warnings whose attribute is still non-optimal — stale warnings auto-hide when recovered
  const activeWarnings = grow.warnings.filter(w => {
    if (w.resolvedAt) return false
    const attrKey = w.attribute as keyof typeof grow.attributes
    const attr = grow.attributes[attrKey]
    return !attr || attr.status !== 'optimal'
  })
  const criticalCount  = activeWarnings.filter(w => w.severity === 'critical').length
  const lightImg       = getLightImageUrl(grow.setup.lightType, isLight)
  const currentHeight  = lampSliderActive ? dragHeight : (committedHeight ?? grow.environment.lightHeight ?? 60)
  const lampTop        = lampTopSVG(currentHeight)  // SVG Y coordinate
  const currentFanSpeed = fanSliderActive ? dragFanSpeed : (committedFanSpeed ?? grow.environment.exhaustFanSpeed ?? 100)

  const stageTips = (g.stageGuide as Record<string, readonly string[]>)[grow.stage]
    ?? (g.stageGuide as Record<string, readonly string[]>).veg

  const lampLabel = currentHeight <= 30 ? g.lampHot
    : currentHeight <= 50 ? g.lampWarm
    : currentHeight <= 70 ? g.lampOptimal
    : g.lampFar

  const fanSpeedLabel = currentFanSpeed === 0 ? g.fanOff
    : currentFanSpeed < 40 ? g.fanLow
    : currentFanSpeed < 75 ? g.fanModerate
    : g.fanStrong

  // VPD — derived from calculated temp + humidity attributes
  const vpdValue = calculateVPD(grow.attributes.temperature.value, grow.attributes.humidity.value)
  const vpdStat  = vpdStatus(vpdValue, grow.stage as GrowStage)

  // Smart guide — conflict-aware warnings with upgrade solutions
  const smartGuide = generateSmartGuide(
    grow.attributes as unknown as GrowAttributes,
    grow.setup as unknown as Setup,
    grow.stage as GrowStage,
  )

  return (
    <div style={{ maxWidth: '960px', padding: '16px 16px 60px' }} className="md:px-7 md:pt-6">

      {showTutorial && <TutorialOverlay onClose={closeTutorial} g={g} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/hub/grow" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textDecoration: 'none' }}>
            {g.backLink}
          </Link>
          <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '26px', color: '#e8f0ef', margin: '4px 0 0', letterSpacing: '1px' }}>
            {grow.strainName}
          </h1>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginTop: '3px' }}>
            Day {grow.currentDay} · {grow.stage.replace('_', ' ')} · {(() => {
              const dds = grow.dayDurationSeconds ?? 86400
              if (dds >= 86400) return g.realtimeLabel
              if (dds >= 3600) { const h = Math.round(dds / 3600); return `⚡ ${h}h/day` }
              if (dds >= 60) { const m = Math.round(dds / 60); return `⚡ ${m}m/day` }
              return `⚡ ${dds}s/day`
            })()}
          </div>
          {/* Day progress bar */}
          <div style={{ marginTop: '8px', maxWidth: '220px' }}>
            <div style={{ height: '2px', background: 'rgba(74,96,102,0.18)', borderRadius: '1px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${dayProgress}%`,
                background: pending
                  ? 'linear-gradient(90deg, #00d4c8, #00ffd0)'
                  : 'linear-gradient(90deg, rgba(0,212,200,0.4), rgba(0,212,200,0.7))',
                borderRadius: '1px', transition: 'width 0.8s linear',
              }} />
              {pending && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,208,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 1.5s infinite',
                }} />
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066', marginTop: '3px', letterSpacing: '0.5px' }}>
              {pending ? g.growingLabel : `${dayProgress}%`}
            </div>
          </div>
        </div>

        {/* Right side: strain photo + journal + harvest */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          {/* Genetics photo card */}
          {STRAIN_LOCAL_IMG[grow.strainSlug] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={STRAIN_LOCAL_IMG[grow.strainSlug]}
              alt={grow.strainName}
              style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }}
            />
          )}

          {/* Journal card button */}
          <Link href={`/hub/grow/${id}/journal/new`} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: '80px', height: '80px', flexShrink: 0,
            background: 'rgba(0,212,200,0.06)',
            border: '0.5px solid rgba(0,212,200,0.25)',
            borderRadius: '8px',
            textDecoration: 'none', gap: '5px',
          }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>📓</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#00d4c8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {g.journalBtn}
            </span>
          </Link>

          {/* Harvest button */}
          {grow.stage === 'harvest' && (
            <button onClick={doHarvest} disabled={pending} style={{
              fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px',
              padding: '7px 16px', background: '#f0a830', border: 'none',
              borderRadius: '4px', color: '#050508', cursor: 'pointer',
              alignSelf: 'center',
            }}>
              {g.harvestBtn}
            </button>
          )}
        </div>
      </div>

      {/* ── Harvest-ready banner ── */}
      {grow.stage === 'harvest' && (() => {
        const flipDay = grow.manualFlipDay ?? 35
        const totalFlowerDays = grow.currentDay - flipDay
        const vegDays = flipDay - (grow.isClone ? 4 : 7)
        const techniques = [
          grow.actions.some(a => a.type === 'lst')       && 'LST',
          grow.actions.some(a => a.type === 'top')       && 'Topping',
          grow.actions.some(a => a.type === 'defoliate') && 'Defoliation',
          grow.hasLollipoped                              && 'Lollipopping',
        ].filter(Boolean) as string[]
        const quality = Math.round(grow.health + (techniques.length * 3))
        const qualityLabel = quality >= 90 ? 'Exceptional' : quality >= 70 ? 'Premium' : quality >= 50 ? 'Good' : 'Standard'
        const qualityColor = quality >= 90 ? '#00d4c8' : quality >= 70 ? '#f0a830' : '#e8f0ef'
        const tipsByStrain: Record<string, string> = {
          indica:  'Indica plants typically produce dense, resinous buds. Flush for 1–2 weeks before harvest for the cleanest smoke.',
          sativa:  'Sativa buds can look sparse but pack a punch. Check trichomes under a loupe — milky-amber mix signals peak harvest.',
          hybrid:  'Hybrid phenos can express either parent heavily. Watch for pistil color (70–80% orange/red) alongside trichome maturity.',
        }
        return (
          <div style={{
            background: 'rgba(240,168,48,0.08)',
            border: '0.5px solid rgba(240,168,48,0.55)',
            borderRadius: '8px', padding: '20px', marginBottom: '20px',
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f0a830', marginBottom: '14px' }}>
              🌾 READY TO HARVEST
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total days',    value: String(grow.currentDay) },
                { label: 'Veg days',      value: String(Math.max(0, vegDays)) },
                { label: 'Flower days',   value: String(Math.max(0, totalFlowerDays)) },
                { label: 'Est. yield',    value: `${Math.max(0, grow.yieldProjection)}g` },
                { label: 'Health',        value: `${grow.health}%` },
                { label: 'Quality est.',  value: qualityLabel },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(240,168,48,0.06)', border: '0.5px solid rgba(240,168,48,0.18)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: qualityColor, marginBottom: '2px' }}>{value}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
            {techniques.length > 0 && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginBottom: '10px' }}>
                Techniques applied: {techniques.join(' · ')}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.6)', lineHeight: 1.6, marginBottom: '14px', borderLeft: '2px solid rgba(240,168,48,0.3)', paddingLeft: '12px' }}>
              {tipsByStrain[grow.strainType] ?? tipsByStrain.hybrid}
            </div>
            <button onClick={doHarvest} disabled={pending} style={{
              fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '10px 24px', background: '#f0a830', border: 'none', borderRadius: '4px',
              color: '#050508', cursor: pending ? 'not-allowed' : 'pointer',
            }}>
              🌾 {g.harvestBtn}
            </button>
          </div>
        )
      })()}

      {/* Warnings banner */}
      {activeWarnings.length > 0 && (
        <div style={{
          background: criticalCount > 0 ? 'rgba(255,64,64,0.08)' : 'rgba(240,168,48,0.08)',
          border: `0.5px solid ${criticalCount > 0 ? 'rgba(255,64,64,0.45)' : 'rgba(240,168,48,0.35)'}`,
          borderRadius: '6px', padding: '12px 16px', marginBottom: '20px',
          animation: criticalCount > 0 ? 'glowPulse 2s ease-in-out infinite' : 'none',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: criticalCount > 0 ? 'rgba(255,64,64,0.9)' : 'rgba(240,168,48,0.7)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            {criticalCount > 0 ? g.criticalBadge(criticalCount) : g.warningBadge(activeWarnings.length)}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeWarnings.map((w, i) => (
              <button key={i} onClick={() => setActiveWarning(w)} style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 10px',
                border: `0.5px solid ${w.severity === 'critical' ? 'rgba(255,64,64,0.5)' : 'rgba(240,168,48,0.5)'}`,
                borderRadius: '3px', background: 'transparent',
                color: w.severity === 'critical' ? '#ff4040' : '#f0a830', cursor: 'pointer',
              }}>
                {w.severity === 'critical' ? '🚨' : '⚠️'} {w.attribute}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning detail overlay */}
      {activeWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(6px)', padding: '20px',
        }} onClick={() => setActiveWarning(null)}>
          <div style={{
            background: '#050508', border: `0.5px solid ${activeWarning.severity === 'critical' ? 'rgba(255,64,64,0.35)' : 'rgba(240,168,48,0.35)'}`,
            borderRadius: '8px', padding: '24px', maxWidth: '480px', width: '100%',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: activeWarning.severity === 'critical' ? '#ff4040' : '#f0a830', marginBottom: '12px' }}>
              {activeWarning.severity} · {activeWarning.attribute}
            </div>
            <pre style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: '0 0 20px' }}>
              {activeWarning.guide}
            </pre>
            <button onClick={() => setActiveWarning(null)} style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '7px 16px',
              border: '0.5px solid rgba(74,96,102,0.4)', borderRadius: '4px',
              background: 'transparent', color: '#4a6066', cursor: 'pointer',
            }}>
              {g.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 items-start">

        {/* ── Tent ── */}
        <div>
        {/* ── SVG Tent — viewBox 0 0 1000 750, all positions in TENT_LAYOUT ── */}
        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 1000 750"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            {/* Light cone gradients (LED / CFL / HPS-CMH) */}
            <radialGradient id="cone-led" cx="50%" cy="0%" r="80%" fx="50%" fy="0%">
              <stop offset="0%"  stopColor="#b4ffb4" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#64ff78" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#64ff78" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cone-cfl" cx="50%" cy="0%" r="80%" fx="50%" fy="0%">
              <stop offset="0%"  stopColor="#f0f5ff" stopOpacity="0.26" />
              <stop offset="40%" stopColor="#c8dcff" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#c8dcff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cone-hps" cx="50%" cy="0%" r="80%" fx="50%" fy="0%">
              <stop offset="0%"  stopColor="#ffdc3c" stopOpacity="0.30" />
              <stop offset="40%" stopColor="#ffb40a" stopOpacity="0.10" />
              <stop offset="75%" stopColor="#ffb40a" stopOpacity="0" />
            </radialGradient>
            {/* Lamp glow drop-shadows */}
            <filter id="glow-led" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation={lampSliderActive ? 14 : 8} floodColor="#a0ffa0" floodOpacity={lampSliderActive ? 0.9 : 0.6} />
            </filter>
            <filter id="glow-cfl" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation={lampSliderActive ? 14 : 8} floodColor="#dce8ff" floodOpacity={lampSliderActive ? 0.95 : 0.7} />
            </filter>
            <filter id="glow-hps" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation={lampSliderActive ? 16 : 10} floodColor="#ffd228" floodOpacity={lampSliderActive ? 0.95 : 0.75} />
            </filter>
          </defs>

          {/* ── Layer 1: Tent backgrounds (day / night crossfade) ── */}
          <image href={EQUIP_IMGS.tentBg}     x="0" y="0" width="1000" height="750" preserveAspectRatio="xMidYMid slice"
            style={{ opacity: isLight ? 0.7 : 0, transition: 'opacity 2s ease' }} />
          <image href={EQUIP_IMGS.tentBgDark} x="0" y="0" width="1000" height="750" preserveAspectRatio="xMidYMid slice"
            style={{ opacity: isLight ? 0 : 0.85, transition: 'opacity 2s ease' }} />

          {/* ── Layer 2: Equipment ── */}

          {/* Carbon filter — rotated */}
          {grow.setup.hasCarbonFilter && (
            <image
              href={EQUIP_IMGS.filter}
              x={TENT_LAYOUT.filter.x} y={TENT_LAYOUT.filter.y}
              width={TENT_LAYOUT.filter.w} height={TENT_LAYOUT.filter.h}
              transform={`rotate(55,${TENT_LAYOUT.filter.x + TENT_LAYOUT.filter.w / 2},${TENT_LAYOUT.filter.y + TENT_LAYOUT.filter.h / 2})`}
              style={{ filter: 'drop-shadow(-2px 0 8px rgba(0,0,0,0.5))' }}
            />
          )}

          {/* Circulation fan — left wall */}
          {grow.setup.hasCirculationFan && (
            <image
              href={EQUIP_IMGS.circulation}
              x={TENT_LAYOUT.circ.x} y={TENT_LAYOUT.circ.y}
              width={TENT_LAYOUT.circ.w} height={TENT_LAYOUT.circ.h}
              style={{ opacity: 0.85, filter: 'drop-shadow(2px 0 6px rgba(0,0,0,0.5))' }}
            />
          )}

          {/* Medium bag — bottom left */}
          <image
            href={EQUIP_IMGS.mediumSoil}
            x={TENT_LAYOUT.medium.x} y={TENT_LAYOUT.medium.y}
            width={TENT_LAYOUT.medium.w} height={TENT_LAYOUT.medium.h}
            style={{ opacity: 0.82 }}
          />

          {/* Exhaust fan — top right, draggable fan-speed slider */}
          {grow.setup.hasExhaustFan && (
            <image
              href={EQUIP_IMGS.exhaust}
              x={TENT_LAYOUT.exhaust.x} y={TENT_LAYOUT.exhaust.y}
              width={TENT_LAYOUT.exhaust.w} height={TENT_LAYOUT.exhaust.h}
              style={{
                opacity: 0.88, cursor: fanSliderActive ? 'grabbing' : 'grab',
                touchAction: 'none',
                filter: fanSliderActive
                  ? 'drop-shadow(-2px 0 12px rgba(0,212,200,0.7))'
                  : 'drop-shadow(-2px 0 6px rgba(0,0,0,0.5))',
                transition: 'filter 0.15s',
              }}
              onMouseDown={(e) => { e.preventDefault(); startFanDrag(e.clientY) }}
              onTouchStart={(e) => { e.preventDefault(); startFanDrag(e.touches[0].clientY) }}
            />
          )}

          {/* Fan speed badge — left of exhaust, only when dragging */}
          {grow.setup.hasExhaustFan && (fanSliderActive || committedFanSpeed !== null) && (
            <g transform={`translate(${TENT_LAYOUT.exhaust.x - 76},${TENT_LAYOUT.exhaust.y + 50})`}>
              <rect x={0} y={0} width={62} height={40} rx={4}
                fill="rgba(0,212,200,0.2)" stroke="rgba(0,212,200,0.6)" strokeWidth={0.5} />
              <text x={8} y={22} fontFamily="var(--font-orbitron), monospace" fontSize={13} fontWeight={700} fill="#00d4c8">
                {currentFanSpeed}%
              </text>
              <text x={8} y={35} fontFamily="DM Mono, monospace" fontSize={7} fill="#4a6066">
                {fanSpeedLabel}
              </text>
            </g>
          )}

          {/* ── Layer 3: Light cone + Lamp ── */}

          {/* Light cone — radiates downward from lamp bottom */}
          {(() => {
            const lt = grow.setup.lightType
            const coneId = lt === 'led' ? 'cone-led' : lt === 'cfl' ? 'cone-cfl' : 'cone-hps'
            return (
              <ellipse
                cx={500} cy={lampTop + 70} rx={190} ry={310}
                fill={`url(#${coneId})`}
                style={{
                  opacity: isLight ? 1 : 0,
                  transition: 'opacity 2.5s ease',
                  animation: isLight ? 'hps-cone-pulse 4s ease-in-out infinite' : 'none',
                  pointerEvents: 'none',
                }}
              />
            )
          })()}

          {/* Lamp image — draggable to adjust height */}
          {lightImg && (() => {
            const lt      = grow.setup.lightType
            const lampW   = getLampSVGWidth(lt)
            const lampX   = SVG_W / 2 - lampW / 2
            const glowId  = lt === 'led' ? 'glow-led' : lt === 'cfl' ? 'glow-cfl' : 'glow-hps'
            const opacity = (lt === 'hps' || lt === 'cfl') ? 1 : (isLight ? 1 : 0.25)
            return (
              <>
                <image
                  href={lightImg}
                  x={lampX} y={lampTop}
                  width={lampW} height={200}
                  style={{
                    cursor: lampSliderActive ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    filter: isLight ? `url(#${glowId})` : 'none',
                    opacity,
                    animation: lt !== 'led' && isLight ? 'hps-flicker 8s ease-in-out infinite' : 'none',
                    transition: 'filter 0.15s, opacity 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => { e.preventDefault(); startLampDrag(e.clientY) }}
                  onTouchStart={(e) => { e.preventDefault(); startLampDrag(e.touches[0].clientY) }}
                />
                {/* Height badge — left of lamp, visible only while dragging */}
                {(lampSliderActive || committedHeight !== null) && (
                  <g transform={`translate(${lampX - 74},${lampTop + 4})`}
                    style={{ opacity: isLight ? 1 : 0.35 }}>
                    <rect x={0} y={0} width={62} height={40} rx={4}
                      fill="rgba(240,168,48,0.2)" stroke="rgba(240,168,48,0.6)" strokeWidth={0.5} />
                    <text x={8} y={22} fontFamily="var(--font-orbitron), monospace" fontSize={13} fontWeight={700} fill="#f0a830">
                      {currentHeight}cm
                    </text>
                    <text x={8} y={35} fontFamily="DM Mono, monospace" fontSize={7} fill="#4a6066">
                      {lampLabel}
                    </text>
                  </g>
                )}
              </>
            )
          })()}

          {/* ── Layer 4: Plant (foreignObject, bottom-anchored) ── */}
          {(() => {
            const pc         = grow.setup.plantCount ?? 1
            const containerW = getPlantContainerWidth(pc, grow.setup.tentSize)
            const foX        = getPlantFOX(containerW)
            return (
              <foreignObject
                x={foX} y={PLANT_FO_Y}
                width={containerW} height={PLANT_FO_H}
                style={{ filter: isLight ? 'none' : 'brightness(0.12)', transition: 'filter 2s ease' }}
              >
                <div style={{ width: containerW, height: PLANT_FO_H }}>
                  <PlantImage
                    stage={grow.stage}
                    strainType={grow.strainType}
                    health={grow.health}
                    day={grow.currentDay}
                    techniques={{
                      lstApplied:       grow.actions.some(a => a.type === 'lst'),
                      toppingApplied:   grow.actions.some(a => a.type === 'top'),
                      defoliationCount: grow.actions.filter(a => a.type === 'defoliate').length,
                      lollipopApplied:  grow.hasLollipoped ?? false,
                    }}
                    potCount={pc}
                    potSize={grow.setup.potSize as 'small' | 'medium' | 'large'}
                    containerWidth={containerW}
                    tentSize={grow.setup.tentSize}
                  />
                </div>
              </foreignObject>
            )
          })()}

          {/* ── Layer 5: Lottie action animation (center) ── */}
          {actionAnim && (
            <foreignObject x={350} y={200} width={300} height={300}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Lottie
                  animationData={actionAnim.animData}
                  loop={false}
                  onComplete={() => setActionAnim(null)}
                  style={{ width: '140px', height: '140px' }}
                />
              </div>
            </foreignObject>
          )}

          {/* ── Layer 6: HUD ── */}

          {/* Health badge — top left */}
          {(() => {
            const hCol = grow.health > 60 ? '#56c254' : grow.health > 30 ? '#f0a830' : '#e03535'
            const barW  = Math.round(grow.health * 0.74)
            const capX  = (grow.maxHealth ?? 100) < 100 ? Math.round((grow.maxHealth ?? 100) * 0.74) : null
            return (
              <g>
                <rect x={12} y={12} width={106} height={62} rx={5} fill="rgba(5,5,8,0.88)" />
                <text x={20} y={27} fontFamily="DM Mono,monospace" fontSize={8} letterSpacing={0.5} fill="#4a6066">
                  {g.healthLabel as string}
                </text>
                <text x={20} y={47} fontFamily="var(--font-orbitron),monospace" fontSize={14} fontWeight={700} fill={hCol}>
                  {grow.health}%
                  {(grow.maxHealth ?? 100) < 100 && (
                    <tspan fontSize={8} fill="#4a6066"> / {grow.maxHealth ?? 100}</tspan>
                  )}
                </text>
                <rect x={20} y={54} width={74} height={4} rx={2} fill="rgba(74,96,102,0.25)" />
                <rect x={20} y={54} width={barW} height={4} rx={2} fill={hCol}
                  style={{ transition: 'width 0.5s' }} />
                {capX !== null && (
                  <rect x={20 + capX} y={52} width={2} height={8} rx={1} fill="rgba(255,80,80,0.7)" />
                )}
              </g>
            )
          })()}

        </svg>
        </div>{/* /SVG border-radius wrapper */}

        {/* ── Actions ── */}
        <div style={{ marginTop: '6px', padding: '12px 14px', background: 'rgba(13,0,20,0.6)', border: '0.5px solid rgba(74,96,102,0.15)', borderRadius: '8px' }}>
          {(() => {
            const isVeg = grow.stage === 'veg' || grow.stage === 'seedling'
            const lollipopDone = grow.hasLollipoped ?? false
            const actions = [
              { type: 'water',     label: g.actionWater,     xp: 5,  disabled: false },
              { type: 'feed',      label: g.actionFeed,      xp: 10, disabled: false },
              { type: 'ph_check',  label: g.actionPh,        xp: 5,  disabled: false },
              isVeg
                ? { type: 'lst',      label: g.actionLst,      xp: 25, disabled: false }
                : { type: 'lollipop', label: g.actionLollipop, xp: 20, disabled: lollipopDone },
              { type: 'defoliate', label: g.actionDefoliate, xp: 15, disabled: false },
              { type: 'flush',     label: g.actionFlush,     xp: 5,  disabled: false },
            ] as const
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '7px' }}>
                  {actions.map(({ type, label, xp, disabled }) => (
                    <button
                      key={type}
                      onClick={() => requestAction(type)}
                      disabled={pending || disabled}
                      title={(g.actionTooltips as Record<string, string>)[type] ?? ''}
                      style={{
                        fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
                        padding: '9px 4px', borderRadius: '4px',
                        border: `0.5px solid ${disabled ? 'rgba(74,96,102,0.12)' : 'rgba(74,96,102,0.3)'}`,
                        background: 'rgba(10,36,40,0.5)',
                        color: disabled ? '#3a4a50' : '#e8f0ef',
                        cursor: (pending || disabled) ? 'not-allowed' : 'pointer',
                        opacity: pending ? 0.5 : 1, textAlign: 'center',
                      }}
                    >
                      {label}
                      <span style={{ display: 'block', fontSize: '8px', color: disabled ? '#2a3a40' : '#4a6066', marginTop: '2px' }}>
                        {disabled ? g.doneLbl : `+${xp}xp`}
                      </span>
                    </button>
                  ))}
                </div>

                {confirmDialog && (
                  <div style={{
                    marginTop: '10px', padding: '12px 14px',
                    background: confirmDialog.severity === 'danger' ? 'rgba(204,0,0,0.08)' : 'rgba(240,168,48,0.07)',
                    border: `0.5px solid ${confirmDialog.severity === 'danger' ? 'rgba(204,0,0,0.4)' : 'rgba(240,168,48,0.4)'}`,
                    borderRadius: '6px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: confirmDialog.severity === 'danger' ? '#ff4040' : '#f0a830', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      {confirmDialog.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.7)', lineHeight: 1.5, marginBottom: '10px' }}>
                      {confirmDialog.body}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { const t = confirmDialog.type; setConfirmDialog(null); doAction(t) }}
                        style={{
                          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
                          padding: '6px 12px', borderRadius: '3px', cursor: 'pointer',
                          border: `0.5px solid ${confirmDialog.severity === 'danger' ? 'rgba(204,0,0,0.5)' : 'rgba(240,168,48,0.5)'}`,
                          background: confirmDialog.severity === 'danger' ? 'rgba(204,0,0,0.15)' : 'rgba(240,168,48,0.12)',
                          color: confirmDialog.severity === 'danger' ? '#ff4040' : '#f0a830',
                        }}
                      >
                        {g.confirmActionBtn}
                      </button>
                      <button
                        onClick={() => setConfirmDialog(null)}
                        style={{
                          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
                          padding: '6px 12px', borderRadius: '3px', cursor: 'pointer',
                          border: '0.5px solid rgba(74,96,102,0.3)',
                          background: 'transparent', color: '#4a6066',
                        }}
                      >
                        {g.cancelActionBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Status bar ── */}
                {(() => {
                  const flipDay     = grow.manualFlipDay ?? 35
                  const seedlingEnd = grow.isClone ? 4 : 7
                  const vegDays     = Math.max(0, flipDay - seedlingEnd)
                  const flowerDay   = Math.max(0, grow.currentDay - flipDay)
                  const daysLeft    = Math.max(0, (flipDay + grow.floweringTime) - grow.currentDay)
                  const inFlower    = ['flower', 'late_flower', 'harvest'].includes(grow.stage)
                  const stageColor  = grow.stage === 'harvest' ? '#f0a830' : grow.stage === 'seedling' ? '#56c254' : '#cc00aa'

                  const stageBodyMap = (g.stageInfoBody as Record<string, string>)
                  const stageInfoBody = stageBodyMap[grow.stage] ?? stageBodyMap.veg

                  return (
                    <StatusBar
                      cycleLabel={pending ? g.growingLabel : (isLight ? g.dayLabel : g.nightLabel)}
                      cycleSub={`${isLight ? g.lightOffIn : g.lightOnIn} ${cycleCountdown}`}
                      cycleColor={isLight ? '#f0c832' : '#8888cc'}
                      cycleInfoTitle={g.cycleInfoTitle}
                      cycleInfoBody={g.cycleInfoBody}

                      stageLabel={`Day ${grow.currentDay} · ${grow.stage.replace('_', ' ')}`}
                      stageColor={stageColor}
                      stageInfoTitle={g.stageInfoTitle}
                      stageInfoBody={stageInfoBody}

                      progressLabel={inFlower
                        ? `F${flowerDay}/${grow.floweringTime}${daysLeft > 0 ? ` · ~${daysLeft}${g.daysAbbr}` : ' · 🌾'}`
                        : `${vegDays}${g.daysAbbr} ${g.vegDaysLabel.toLowerCase()}`}

                      yieldLabel={`~${Math.max(0, grow.yieldProjection)}g`}
                      yieldInfoTitle={g.yieldInfoTitle}
                      yieldInfoBody={g.yieldInfoBody}
                    />
                  )
                })()}
              </>
            )
          })()}
        </div>
        </div>

        {/* ── Tabbed panel ── */}
        <div style={{ background: 'rgba(13,0,20,0.7)', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(204,0,170,0.12)', background: 'rgba(204,0,170,0.04)' }}>
            {([
              { id: 'attributes',  label: g.tabAttributes },
              { id: 'environment', label: g.tabEnvironment },
              { id: 'setup',       label: g.tabSetup },
              { id: 'stats',       label: g.tabStats },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
                textTransform: 'uppercase', padding: '11px 6px', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #cc00aa' : '2px solid transparent',
                background: activeTab === tab.id ? 'rgba(204,0,170,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#cc00aa' : 'rgba(74,96,102,0.7)', cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: '-0.5px',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px' }}>

            {/* Attributes tab */}
            {activeTab === 'attributes' && (
              <div>
                {/* No hygrometer nudge — go to My Setup */}
                {!hasMeter && (
                  <div style={{
                    marginBottom: '12px', padding: '9px 12px',
                    background: 'rgba(0,212,200,0.04)', border: '0.5px solid rgba(0,212,200,0.2)',
                    borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.5)' }}>
                      {g.meterLockedDesc}
                    </div>
                    <button onClick={() => setActiveTab('setup')} style={{
                      fontFamily: 'var(--font-dm-mono)', fontSize: '8px', padding: '5px 9px', borderRadius: '3px', flexShrink: 0,
                      border: '0.5px solid rgba(0,212,200,0.35)', background: 'transparent',
                      color: '#00d4c8', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      {g.meterFreeBtn}
                    </button>
                  </div>
                )}
                {([
                  { key: 'temperature', label: g.attrTemp },
                  { key: 'humidity',    label: g.attrHumidity },
                  { key: 'light',       label: g.attrLight },
                  { key: 'ventilation', label: g.attrVentilation },
                  { key: 'nutrients',   label: g.attrNutrients },
                  { key: 'watering',    label: g.attrWatering },
                ] as const).map(({ key, label }) => {
                  const meterGated = !hasMeter && (key === 'temperature' || key === 'humidity')
                  if (meterGated) {
                    return (
                      <div key={key} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{label}</span>
                          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>? · ?</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(74,96,102,0.12)', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: '50%', background: 'rgba(74,96,102,0.25)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    )
                  }
                  return (
                    <AttrBar
                      key={key}
                      label={label}
                      attrKey={key}
                      attr={grow.attributes[key]}
                      tooltip={(g.tooltips as Record<string, string>)[key] ?? ''}
                    />
                  )
                })}

                {/* Stage guide */}
                <StageGuide stage={grow.stage} title={g.stageGuideTitle} tips={stageTips} />

                {/* Smart guide — conflict-aware warnings with upgrade buttons */}
                {smartGuide.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {smartGuide.map(sw => (
                      <div key={sw.id} style={{
                        padding: '10px 12px',
                        background: sw.severity === 'critical' ? 'rgba(255,64,64,0.06)' : 'rgba(240,168,48,0.06)',
                        border: `0.5px solid ${sw.severity === 'critical' ? 'rgba(255,64,64,0.3)' : 'rgba(240,168,48,0.25)'}`,
                        borderRadius: '6px',
                      }}>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: sw.severity === 'critical' ? '#ff4040' : '#f0a830', marginBottom: '5px' }}>
                          {sw.severity === 'critical' ? '🚨' : '⚠️'} {sw.attributes.join(' + ')}
                        </div>
                        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.8)', lineHeight: 1.5, marginBottom: sw.solutions.length ? '8px' : 0 }}>
                          {sw.message}
                        </div>
                        {sw.conflictNote && (
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830', marginBottom: '6px', opacity: 0.7 }}>
                            ℹ️ {sw.conflictNote}
                          </div>
                        )}
                        {sw.solutions.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {sw.solutions.map((sol, si) => {
                              const isUpgrade = sol.action?.startsWith('upgrade_') || ['circulation_fan','dehumidifier','humidifier'].includes(sol.action ?? '')
                              const alreadyOwned = isUpgrade && (grow.purchasedUpgrades?.some(u => u.type === sol.action) ?? false)
                              const isGrowAction = !isUpgrade && sol.action && ['water','feed','flush','ph_check','lst','defoliate','fan_speed','light_raise'].includes(sol.action)
                              return (
                                <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.65)', flex: 1 }}>
                                    → {sol.text}
                                  </span>
                                  {isUpgrade && !alreadyOwned && (
                                    <button
                                      onClick={() => doUpgrade(sol.action!, sol.cost ?? 0)}
                                      disabled={upgradePending === sol.action}
                                      style={{
                                        fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px',
                                        padding: '4px 8px', borderRadius: '3px', flexShrink: 0,
                                        border: sol.cost === 0 ? '0.5px solid rgba(0,212,200,0.4)' : '0.5px solid rgba(240,168,48,0.4)',
                                        background: sol.cost === 0 ? 'rgba(0,212,200,0.1)' : 'rgba(240,168,48,0.1)',
                                        color: sol.cost === 0 ? '#00d4c8' : '#f0a830',
                                        cursor: upgradePending === sol.action ? 'not-allowed' : 'pointer',
                                        opacity: upgradePending === sol.action ? 0.5 : 1,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {upgradePending === sol.action ? g.upgradeInstalling : g.upgradeSmartBtn(sol.cost ?? 0)}
                                    </button>
                                  )}
                                  {isUpgrade && alreadyOwned && (
                                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#00d4c8', opacity: 0.6 }}>{g.installedBadge}</span>
                                  )}
                                  {isGrowAction && (
                                    <button
                                      onClick={() => doAction(sol.action!)}
                                      disabled={pending}
                                      style={{
                                        fontFamily: 'var(--font-dm-mono)', fontSize: '8px',
                                        padding: '4px 8px', borderRadius: '3px', flexShrink: 0,
                                        border: '0.5px solid rgba(0,212,200,0.3)',
                                        background: 'rgba(0,212,200,0.08)',
                                        color: '#00d4c8', cursor: pending ? 'not-allowed' : 'pointer',
                                        opacity: pending ? 0.5 : 1,
                                      }}
                                    >
                                      {g.doItBtn}
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Clone flip window prompt */}
                {grow.isClone && grow.stage === 'veg' && !grow.manualFlipDay && (() => {
                  const d = grow.currentDay
                  const windowOpen  = d >= 4
                  const windowClose = d <= 13
                  const inWindow    = windowOpen && windowClose
                  const windowPast  = d > 13
                  if (!windowOpen) return null
                  return (
                    <div style={{
                      marginBottom: '12px', padding: '10px 12px',
                      background: inWindow ? 'rgba(0,212,200,0.08)' : 'rgba(240,168,48,0.06)',
                      border: `0.5px solid ${inWindow ? 'rgba(0,212,200,0.35)' : 'rgba(240,168,48,0.25)'}`,
                      borderRadius: '5px',
                    }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: inWindow ? '#00d4c8' : '#f0a830', marginBottom: '4px' }}>
                        {inWindow ? g.cloneWindowTitle : g.cloneWindowLateTitle}
                      </div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.65)', lineHeight: 1.5 }}>
                        {inWindow
                          ? g.cloneWindowDesc(d, 13 - d + 1)
                          : g.cloneWindowLateDesc}
                      </div>
                    </div>
                  )
                })()}

                {/* Flip suggestion when no smart guide issues */}
                {smartGuide.length === 0 && grow.stage === 'veg' && grow.currentDay >= 25 && !grow.manualFlipDay && !grow.isClone && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(204,0,170,0.06)', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '5px' }}>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.75)' }}>{g.suggestFlipReady}</div>
                  </div>
                )}

                {/* Flip to 12/12 card — visible only in veg */}
                {grow.stage === 'veg' && (() => {
                  const d = grow.currentDay
                  const alreadyFlipped = grow.manualFlipDay != null
                  const timingColor = d < 21 ? '#ff4040' : d < 28 ? '#f0a830' : d <= 35 ? '#00d4c8' : d <= 42 ? '#f0a830' : '#ff4040'
                  const timingMsg = alreadyFlipped
                    ? g.flipAlreadyDone(grow.manualFlipDay!)
                    : d < 21 ? g.flipVeryEarly(d) : d < 28 ? g.flipTooEarly(d) : d <= 35 ? g.flipOptimal : d <= 42 ? g.flipLate(d) : g.flipVeryLate(d)
                  return (
                    <div style={{
                      marginTop: '12px', padding: '12px 14px',
                      background: 'rgba(204,0,170,0.06)', border: '0.5px solid rgba(204,0,170,0.2)',
                      borderRadius: '6px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#cc00aa', letterSpacing: '1px', marginBottom: '3px' }}>
                            {g.flipTitle}
                          </div>
                          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.6)' }}>
                            {g.flipDesc}
                          </div>
                        </div>
                        {!alreadyFlipped && (
                          <button onClick={() => doAction('flip_12_12')} disabled={pending} style={{
                            fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
                            padding: '7px 12px', borderRadius: '4px', flexShrink: 0, marginLeft: '10px',
                            border: '0.5px solid rgba(204,0,170,0.5)', background: 'rgba(204,0,170,0.12)',
                            color: '#cc00aa', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1,
                          }}>
                            {g.flipBtn}
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'rgba(74,96,102,0.7)' }}>
                          {g.flipWindowLabel}: <span style={{ color: '#00d4c8' }}>{g.flipWindow}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: timingColor, textAlign: 'right', maxWidth: '60%' }}>
                          {timingMsg}
                        </div>
                      </div>
                    </div>
                  )
                })()}

              </div>
            )}

            {/* Environment tab */}
            {activeTab === 'environment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { key: 'temp',   label: g.envTempLabel,        value: `${Math.round(grow.attributes.temperature.value)}°C`,  desc: g.envTempDesc,        info: g.envTempInfo },
                  { key: 'hum',    label: g.envHumLabel,         value: `${Math.round(grow.attributes.humidity.value)}%`,      desc: g.envHumDesc,         info: g.envHumInfo },
                  { key: 'ph',     label: g.envPhLabel,          value: String(grow.environment.ph),     desc: g.envPhDesc,          info: g.envPhInfo },
                  { key: 'ec',     label: g.envEcLabel,          value: `${grow.environment.ec} mS/cm`,  desc: g.envEcDesc,          info: g.envEcInfo },
                  { key: 'cycle',  label: g.envLightCycleLabel,  value: grow.manualFlipDay ? `12h / 12h ✓` : `${grow.environment.lightHours}h / ${24 - grow.environment.lightHours}h`, calcValue: undefined, desc: grow.stage === 'veg' && !grow.manualFlipDay ? g.flipDesc : g.envLightCycleDesc, info: g.envLightCycleInfo },
                  { key: 'height', label: g.envLightHeightLabel, value: `${grow.environment.lightHeight ?? 60}cm`, calcValue: undefined, desc: g.envLightHeightDesc, info: g.envLightHeightInfo },
                  { key: 'vpd',    label: g.vpdLabel,            value: `${vpdValue} kPa`,  desc: g.vpdDesc,            info: g.vpdInfo },
                  ...(grow.setup.hasExhaustFan ? [{ key: 'fan', label: g.fanHint, value: `${grow.environment.exhaustFanSpeed ?? 100}%`, calcValue: undefined, desc: fanSpeedLabel, info: '' }] : []),
                ] as Array<{ key: string; label: string; value: string; calcValue?: string; desc: string; info: string }>).map(({ key, label, value, desc, info }) => {
                  const isVpd = key === 'vpd'
                  const attrKey = key === 'temp' ? 'temperature' : key === 'hum' ? 'humidity' : null
                  const attrStatus = attrKey ? grow.attributes[attrKey as keyof typeof grow.attributes]?.status : null
                  const borderColor = attrStatus === 'critical' ? 'rgba(255,64,64,0.4)' : attrStatus === 'warning' ? 'rgba(240,168,48,0.35)' : isVpd && vpdStat !== 'optimal' ? `${statusColor(vpdStat)}44` : 'rgba(74,96,102,0.15)'
                  const valueColor = isVpd ? statusColor(vpdStat) : '#e8f0ef'
                  const isOpen = envExpanded === key
                  return (
                    <div key={key} style={{
                      background: 'rgba(10,36,40,0.4)', borderRadius: '5px', border: `0.5px solid ${borderColor}`,
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => setEnvExpanded(isOpen ? null : key)}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: '10px 12px', background: 'transparent', border: 'none', cursor: info ? 'pointer' : 'default', textAlign: 'left',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(74,96,102,0.7)' }}>{desc}</div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: valueColor, fontWeight: 600, whiteSpace: 'nowrap' }}>{value}</div>
                          {isVpd && (
                            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: valueColor, opacity: 0.7, marginTop: '1px' }}>
                              {vpdStat === 'optimal' ? g.vpdOptimal : vpdStat === 'critical' ? g.vpdHigh : g.vpdLow}
                            </div>
                          )}
                          {info && (
                            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: isOpen ? '#00d4c8' : 'rgba(74,96,102,0.4)', marginTop: '3px', letterSpacing: '0.5px' }}>
                              {isOpen ? g.envLess : g.envMore}
                            </div>
                          )}
                        </div>
                      </button>
                      {isOpen && info && (
                        <div style={{
                          padding: '0 12px 12px',
                          borderTop: '0.5px solid rgba(74,96,102,0.12)',
                        }}>
                          <div style={{
                            fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.65)',
                            lineHeight: 1.7, paddingTop: '10px',
                          }}>
                            {info}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* My Setup tab */}
            {activeTab === 'setup' && (
              <div>
                <div style={{ padding: '10px 12px', background: 'rgba(204,0,170,0.07)', borderRadius: '5px', border: '0.5px solid rgba(204,0,170,0.15)', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '3px' }}>{g.setupStrain}</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', fontWeight: 500 }}>{grow.strainName}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', marginTop: '2px' }}>
                    {grow.strainType} · {grow.floweringTime}{g.setupFlowering}
                  </div>
                </div>

                {/* Fixed fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                  {[
                    { icon: '⬜', label: g.setupTent,   value: `${grow.setup.tentSize} cm`, fixed: true },
                    { icon: '🪴', label: g.setupMedium, value: (g.mediumNames as Record<string, string>)[grow.setup.medium] ?? grow.setup.medium.replace('_', ' '), fixed: true },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'rgba(10,36,40,0.3)',
                      borderRadius: '4px', border: '0.5px solid rgba(74,96,102,0.08)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>{icon} {label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(232,240,239,0.5)' }}>{value}</span>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066', opacity: 0.5 }}>fixed</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Editable fields */}
                {(() => {
                  const btnStyle = (active: boolean): React.CSSProperties => ({
                    fontFamily: 'var(--font-dm-mono)', fontSize: '8px', padding: '3px 7px',
                    borderRadius: '3px', border: `0.5px solid ${active ? 'rgba(0,212,200,0.5)' : 'rgba(74,96,102,0.25)'}`,
                    background: active ? 'rgba(0,212,200,0.12)' : 'transparent',
                    color: active ? '#00d4c8' : '#4a6066', cursor: 'pointer', whiteSpace: 'nowrap',
                  })
                  const rows: Array<{ key: string; icon: string; label: string; current: string; options: Array<{ label: string; fields: Record<string, unknown> }> }> = [
                    {
                      key: 'light', icon: '💡', label: g.setupLight,
                      current: `${grow.setup.lightWatts}W ${grow.setup.lightType.toUpperCase()}`,
                      options: [
                        { label: '100W LED',  fields: { lightType: 'led', lightWatts: 100 } },
                        { label: '200W LED',  fields: { lightType: 'led', lightWatts: 200 } },
                        { label: '300W LED',  fields: { lightType: 'led', lightWatts: 300 } },
                        { label: '480W LED',  fields: { lightType: 'led', lightWatts: 480 } },
                        { label: '250W HPS',  fields: { lightType: 'hps', lightWatts: 250 } },
                        { label: '400W HPS',  fields: { lightType: 'hps', lightWatts: 400 } },
                        { label: '600W HPS',  fields: { lightType: 'hps', lightWatts: 600 } },
                        { label: '315W CMH',  fields: { lightType: 'cmh', lightWatts: 315 } },
                        { label: '100W CFL',  fields: { lightType: 'cfl', lightWatts: 100 } },
                      ],
                    },
                    {
                      key: 'potSize', icon: '🪣', label: g.setupContainer,
                      current: grow.setup.potSize,
                      options: [
                        { label: 'small (5–7L)',   fields: { potSize: 'small' } },
                        { label: 'medium (11–15L)', fields: { potSize: 'medium' } },
                        { label: 'large (20–25L)',  fields: { potSize: 'large' } },
                      ],
                    },
                    {
                      key: 'watering', icon: '💧', label: g.setupWatering,
                      current: grow.setup.watering,
                      options: [
                        { label: 'manual',  fields: { watering: 'manual' } },
                        { label: 'blumat',  fields: { watering: 'blumat' } },
                        { label: 'drip',    fields: { watering: 'drip' } },
                      ],
                    },
                    {
                      key: 'nutrients', icon: '🌿', label: g.setupNutrients,
                      current: grow.setup.nutrients,
                      options: [
                        { label: 'organic', fields: { nutrients: 'organic' } },
                        { label: 'mineral', fields: { nutrients: 'mineral' } },
                        { label: 'none',    fields: { nutrients: 'none' } },
                      ],
                    },
                  ]
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                      {rows.map(row => (
                        <div key={row.key} style={{
                          background: 'rgba(10,36,40,0.4)', borderRadius: '4px',
                          border: `0.5px solid ${editingSetup === row.key ? 'rgba(204,0,170,0.3)' : 'rgba(74,96,102,0.12)'}`,
                          overflow: 'hidden',
                        }}>
                          <button
                            onClick={() => setEditingSetup(editingSetup === row.key ? null : row.key)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>{row.icon} {row.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {editingSetup !== row.key && setupCostHint(row.key === 'light' ? 'light' : row.key)}
                              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#e8f0ef' }}>{row.current}</span>
                              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: editingSetup === row.key ? '#cc00aa' : 'rgba(74,96,102,0.5)' }}>
                                {editingSetup === row.key ? '▲' : '✏️'}
                              </span>
                            </div>
                          </button>
                          {editingSetup === row.key && (
                            <div style={{ padding: '8px 12px', borderTop: '0.5px solid rgba(74,96,102,0.12)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {row.options.map(opt => {
                                const isCurrent = Object.entries(opt.fields).every(([k, v]) => (grow.setup as Record<string, unknown>)[k] === v)
                                return (
                                  <button key={opt.label} onClick={() => doSetupChange(opt.fields)} style={btnStyle(isCurrent)}>
                                    {isCurrent ? '✓ ' : ''}{opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Accessories — toggleable */}
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '7px' }}>
                  {g.setupAccessories}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {([
                    { key: 'hasExhaustFan',     group: 'exhaustFan', label: grow.setup.hasExhaustFan ? `Exhaust fan ${grow.setup.exhaustCFM} CFM` : 'No exhaust fan',
                      subOptions: grow.setup.hasExhaustFan ? null : [
                        { label: '100 CFM', fields: { hasExhaustFan: true, exhaustCFM: 100 } },
                        { label: '200 CFM', fields: { hasExhaustFan: true, exhaustCFM: 200 } },
                        { label: '400 CFM', fields: { hasExhaustFan: true, exhaustCFM: 400 } },
                        { label: '600 CFM', fields: { hasExhaustFan: true, exhaustCFM: 600 } },
                      ],
                      cfmOptions: grow.setup.hasExhaustFan ? [
                        { label: '100 CFM', fields: { exhaustCFM: 100 } },
                        { label: '200 CFM', fields: { exhaustCFM: 200 } },
                        { label: '400 CFM', fields: { exhaustCFM: 400 } },
                        { label: '600 CFM', fields: { exhaustCFM: 600 } },
                        { label: 'Remove fan', fields: { hasExhaustFan: false, exhaustCFM: 0 } },
                      ] : null,
                    },
                    { key: 'hasCirculationFan', group: 'circulationFan', label: 'Circulation fan', subOptions: null, cfmOptions: null },
                    { key: 'hasCarbonFilter',   group: 'carbonFilter',   label: 'Carbon filter',   subOptions: null, cfmOptions: null },
                    { key: 'hasPHMeter',        group: 'phMeter',        label: 'pH meter',        subOptions: null, cfmOptions: null },
                    { key: 'hasECMeter',        group: 'ecMeter',        label: 'EC meter',        subOptions: null, cfmOptions: null },
                    { key: 'hasHygrometer',     group: 'hygrometer',     label: 'Hygrometer',      subOptions: null, cfmOptions: null },
                  ] as Array<{ key: string; group: string; label: string; subOptions: null | Array<{ label: string; fields: Record<string, unknown> }>; cfmOptions: null | Array<{ label: string; fields: Record<string, unknown> }> }>).map(({ key, group, label, subOptions, cfmOptions }) => {
                    const active = grow.setup[key as keyof typeof grow.setup] as boolean
                    const isEditing = editingSetup === key
                    const optionsToShow = active ? cfmOptions : subOptions
                    const canToggle = !active && !subOptions // simple boolean toggle when no sub-options
                    return (
                      <div key={key} style={{
                        background: active ? 'rgba(0,212,200,0.05)' : 'rgba(10,36,40,0.3)',
                        borderRadius: '4px', overflow: 'hidden',
                        border: `0.5px solid ${active ? 'rgba(0,212,200,0.2)' : isEditing ? 'rgba(204,0,170,0.3)' : 'rgba(74,96,102,0.1)'}`,
                      }}>
                        <button
                          onClick={() => {
                            if (canToggle) doSetupChange({ [key]: true })
                            else if (active && !cfmOptions) doSetupChange({ [key]: false })
                            else setEditingSetup(isEditing ? null : key)
                          }}
                          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: active ? '#00d4c8' : '#4a6066' }}>
                              {active ? '✓' : '○'} {label}
                            </span>
                            {!active && setupCostHint(group)}
                          </div>
                          {(subOptions || cfmOptions) && (
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: isEditing ? '#cc00aa' : 'rgba(74,96,102,0.4)' }}>
                              {isEditing ? '▲' : '✏️'}
                            </span>
                          )}
                          {!subOptions && !cfmOptions && !active && (
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(0,212,200,0.5)' }}>+ add</span>
                          )}
                          {!subOptions && !cfmOptions && active && (
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(74,96,102,0.4)' }}>✕ remove</span>
                          )}
                        </button>
                        {isEditing && optionsToShow && (
                          <div style={{ padding: '7px 12px', borderTop: '0.5px solid rgba(74,96,102,0.1)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {optionsToShow.map(opt => {
                              const isCurrent = opt.fields.exhaustCFM !== undefined && (grow.setup as Record<string, unknown>).exhaustCFM === opt.fields.exhaustCFM
                              return (
                                <button key={opt.label} onClick={() => doSetupChange(opt.fields)} style={{
                                  fontFamily: 'var(--font-dm-mono)', fontSize: '8px', padding: '3px 7px',
                                  borderRadius: '3px', border: `0.5px solid ${isCurrent ? 'rgba(0,212,200,0.5)' : opt.label === 'Remove fan' ? 'rgba(255,64,64,0.3)' : 'rgba(74,96,102,0.25)'}`,
                                  background: isCurrent ? 'rgba(0,212,200,0.12)' : opt.label === 'Remove fan' ? 'rgba(255,64,64,0.06)' : 'transparent',
                                  color: isCurrent ? '#00d4c8' : opt.label === 'Remove fan' ? '#ff4040' : '#4a6066',
                                  cursor: 'pointer',
                                }}>
                                  {isCurrent ? '✓ ' : ''}{opt.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Stats tab ── */}
            {activeTab === 'stats' && (() => {
              // Aggregate action counts
              const actionCounts: Record<string, number> = {}
              const actionXP: Record<string, number> = {}
              for (const a of grow.actions) {
                actionCounts[a.type] = (actionCounts[a.type] ?? 0) + 1
                actionXP[a.type] = (actionXP[a.type] ?? 0) + a.xpEarned
              }
              const actionOrder = ['water', 'feed', 'ph_check', 'lst', 'defoliate', 'flush', 'topdress', 'top']
              const maxCount = Math.max(1, ...Object.values(actionCounts))
              const activeWarningCount = grow.warnings.filter(w => !w.resolvedAt).length
              const actionEmoji: Record<string, string> = {
                water: '💧', feed: '🌿', ph_check: '🧪', lst: '📎',
                defoliate: '✂️', flush: '🚿', topdress: '🪱', top: '✂️',
              }
              // Recent actions (last 8, skip light/fan adjustments)
              const recentActions = [...grow.actions]
                .filter(a => !['light_height', 'light_raise', 'light_lower', 'fan_speed'].includes(a.type))
                .reverse()
                .slice(0, 8)

              const maxH = grow.maxHealth ?? 100
              const healthColor = grow.health > 60 ? '#56c254' : grow.health > 30 ? '#f0a830' : '#e03535'

              return (
                <div>
                  {/* Health info card */}
                  <div style={{
                    background: `${healthColor}0d`,
                    border: `0.5px solid ${healthColor}30`,
                    borderRadius: '6px', padding: '12px 14px', marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', color: healthColor, fontWeight: 700 }}>
                        {grow.health}%
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '6px' }}>
                          {g.healthLabel}
                        </span>
                      </div>
                      {maxH < 100 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>{g.healthCeiling}</div>
                          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: 'rgba(255,80,80,0.7)' }}>{maxH}%</div>
                        </div>
                      )}
                    </div>

                    {/* Bar with cap marker */}
                    <div style={{ position: 'relative', height: '6px', background: 'rgba(74,96,102,0.2)', borderRadius: '3px', marginBottom: '10px' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${grow.health}%`,
                        background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`,
                        borderRadius: '3px', transition: 'width 0.5s',
                      }} />
                      {maxH < 100 && (
                        <div style={{
                          position: 'absolute', top: '-3px', bottom: '-3px',
                          left: `${maxH}%`, width: '2px',
                          background: 'rgba(255,80,80,0.8)', borderRadius: '1px',
                        }} title={`Max health: ${maxH}%`} />
                      )}
                    </div>

                    {/* Explanation */}
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.5)', lineHeight: 1.6 }}>
                      {g.healthInfo}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {([
                        { icon: '🔴', text: g.healthCriticalRule },
                        { icon: '🟡', text: g.healthWarningRule },
                        { icon: '🟢', text: g.healthRecoveryRule },
                        { icon: '⚠️', text: g.healthCeilingRule },
                      ] as const).map(({ icon, text }) => (
                        <div key={text} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', display: 'flex', gap: '6px' }}>
                          <span>{icon}</span><span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grow round timeline */}
                  {(() => {
                    const flipDay = grow.manualFlipDay ?? 35
                    const seedlingEnd = grow.isClone ? 4 : 7
                    const vegDays = Math.max(0, flipDay - seedlingEnd)
                    const flowerDay = Math.max(0, grow.currentDay - flipDay)
                    const harvestAtDay = flipDay + grow.floweringTime
                    const daysLeft = Math.max(0, harvestAtDay - grow.currentDay)
                    const inFlower = ['flower', 'late_flower', 'harvest'].includes(grow.stage)
                    return (
                      <div style={{ background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '5px', padding: '10px 12px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
                          {g.growRoundLabel}
                          {grow.isClone && <span style={{ marginLeft: '8px', color: '#00d4c8', fontSize: '7px' }}>CLONE</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          {[
                            { label: grow.isClone ? g.cloneRootingLabel : g.seedlingLabel, value: `${seedlingEnd}d`, color: '#4a6066' },
                            { label: g.vegDaysLabel, value: `${vegDays}d`, color: grow.stage === 'veg' ? '#cc00aa' : '#4a6066' },
                            { label: g.flowerDayLabel, value: inFlower ? `${flowerDay}/${grow.floweringTime}d` : `—/${grow.floweringTime}d`, color: inFlower ? '#cc00aa' : '#4a6066' },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color, fontWeight: 600 }}>{value}</div>
                              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066', marginTop: '2px' }}>{label}</div>
                            </div>
                          ))}
                        </div>
                        {inFlower && daysLeft > 0 && (
                          <div style={{ marginTop: '8px', padding: '5px 8px', background: 'rgba(240,168,48,0.07)', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '3px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(240,168,48,0.8)', textAlign: 'center' }}>
                            {g.harvestInLabel} ~{daysLeft} {g.daysAbbr} (day {harvestAtDay})
                          </div>
                        )}
                        {grow.stage === 'harvest' && (
                          <div style={{ marginTop: '8px', padding: '5px 8px', background: 'rgba(0,212,200,0.07)', border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '3px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', textAlign: 'center' }}>
                            {g.readyToHarvestLabel}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                    {[
                      { label: g.statsXp,       value: String(grow.xpEarned),     color: '#f0a830' },
                      { label: g.statsActions,   value: String(grow.actions.filter(a => !['light_height','light_raise','light_lower','fan_speed'].includes(a.type)).length), color: '#00d4c8' },
                      { label: g.statsDays,      value: String(grow.currentDay),   color: '#cc00aa' },
                      { label: g.statsWarnings,  value: `${activeWarningCount} ${g.statsActive}`, color: activeWarningCount > 0 ? '#cc00aa' : '#4a6066' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{
                        padding: '10px 12px', background: 'rgba(10,36,40,0.5)',
                        borderRadius: '5px', border: '0.5px solid rgba(74,96,102,0.12)',
                      }}>
                        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', color, fontWeight: 700 }}>{value}</div>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '0.5px', marginTop: '2px' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action breakdown bars */}
                  {Object.keys(actionCounts).length > 0 ? (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
                        {g.statsActionBreakdown}
                      </div>
                      {actionOrder.filter(k => actionCounts[k]).concat(
                        Object.keys(actionCounts).filter(k => !actionOrder.includes(k))
                      ).map(type => {
                        const count = actionCounts[type] ?? 0
                        const pct = Math.round((count / maxCount) * 100)
                        return (
                          <div key={type} style={{ marginBottom: '7px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#e8f0ef' }}>
                                {actionEmoji[type] ?? '·'} {type.replace('_', ' ')}
                              </span>
                              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '8px', color: '#00d4c8', fontWeight: 600 }}>
                                {count}×
                              </span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(74,96,102,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`, borderRadius: '2px',
                                background: 'linear-gradient(90deg, #00d4c8, #008888)',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', textAlign: 'center', padding: '16px 0', marginBottom: '16px' }}>
                      {g.statsNoActions}
                    </div>
                  )}

                  {/* Recent activity */}
                  {recentActions.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
                        {g.statsRecentActivity}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {recentActions.map((a, i) => {
                          const msAgo = Date.now() - new Date(a.timestamp).getTime()
                          const hAgo  = Math.floor(msAgo / 3600000)
                          const mAgo  = Math.floor((msAgo % 3600000) / 60000)
                          const timeStr = msAgo < 60000 ? g.statsJustNow : g.statsTimeAgo(hAgo, mAgo)
                          return (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '6px 10px', background: 'rgba(10,36,40,0.4)',
                              borderRadius: '4px', border: '0.5px solid rgba(74,96,102,0.1)',
                            }}>
                              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#e8f0ef' }}>
                                {actionEmoji[a.type] ?? '·'} {a.type.replace('_', ' ')}
                              </span>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {a.xpEarned > 0 && (
                                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#f0a830' }}>+{a.xpEarned}xp</span>
                                )}
                                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066' }}>{timeStr}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Abandon grow — testing utility */}
                  <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '0.5px solid rgba(255,64,64,0.1)' }}>
                    <button
                      onClick={doReset}
                      style={{
                        width: '100%', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
                        padding: '8px', borderRadius: '4px', cursor: 'pointer',
                        border: '0.5px solid rgba(255,64,64,0.25)', background: 'rgba(255,64,64,0.05)',
                        color: 'rgba(255,64,64,0.5)', transition: 'all 0.15s',
                      }}
                    >
                      {g.resetGrowBtn}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Journal strip */}
      {grow.journalEntries.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '12px' }}>
            {g.journalLabel}
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
            {grow.journalEntries.slice(-6).reverse().map((e, i) => (
              <div key={i} style={{ minWidth: '140px', background: 'rgba(13,0,20,0.6)', border: '0.5px solid rgba(204,0,170,0.1)', borderRadius: '6px', padding: '12px', flexShrink: 0 }}>
                {e.photoUrl ? (
                  <img src={e.photoUrl} alt="" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '3px', marginBottom: '6px' }} />
                ) : (
                  <div style={{ height: '70px', background: 'rgba(74,96,102,0.1)', borderRadius: '3px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px' }}>{e.mood === 'great' ? '🌟' : e.mood === 'bad' ? '😔' : '🌱'}</span>
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>Day {e.day} · {e.stage}</div>
                {e.notes && (
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.5)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
