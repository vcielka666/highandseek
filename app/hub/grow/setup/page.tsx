'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/stores/languageStore'

// ── Types ──────────────────────────────────────────────────────────────────────

interface StrainOption {
  slug:           string
  name:           string
  type:           'indica' | 'sativa' | 'hybrid'
  floweringTime:  number
  difficulty:     'easy' | 'medium' | 'hard'
  imageUrl:       string
  shopProductSlug?: string
  shopImageUrl?:  string
}

interface CustomStrain {
  name:          string
  type:          'indica' | 'sativa' | 'hybrid'
  floweringTime: number
  difficulty:    'easy' | 'medium' | 'hard'
}

interface Setup {
  tentSize:          '60x60' | '80x80' | '100x100' | '120x120' | '150x150'
  lightType:         'led' | 'hps' | 'cmh' | 'cfl'
  lightWatts:        number
  lightBrand:        string
  medium:            'living_soil' | 'coco' | 'hydro'
  potSize:           'small' | 'medium' | 'large'
  watering:          'manual' | 'blumat' | 'drip'
  nutrients:         'organic' | 'mineral' | 'none'
  hasExhaustFan:     boolean
  exhaustCFM:        number
  hasCirculationFan: boolean
  hasCarbonFilter:   boolean
  hasPHMeter:        boolean
  hasECMeter:        boolean
  hasHygrometer:     boolean
  plantCount:        1 | 2 | 3 | 4
}

const DEFAULT_SETUP: Setup = {
  tentSize:          '100x100',
  lightType:         'led',
  lightWatts:        240,
  lightBrand:        '',
  medium:            'living_soil',
  potSize:           'medium',
  watering:          'manual',
  nutrients:         'organic',
  hasExhaustFan:     true,
  exhaustCFM:        200,
  hasCirculationFan: true,
  hasCarbonFilter:   false,
  hasPHMeter:        false,
  hasECMeter:        false,
  hasHygrometer:     true,
  plantCount:        1,
}

const MEDIUM_RULES: Record<Setup['medium'], {
  allowedNutrients: Setup['nutrients'][]
  allowedWatering:  Setup['watering'][]
}> = {
  living_soil: {
    allowedNutrients: ['organic', 'none'],
    allowedWatering:  ['manual', 'blumat'],
  },
  coco: {
    allowedNutrients: ['mineral'],
    allowedWatering:  ['manual', 'drip'],
  },
  hydro: {
    allowedNutrients: ['mineral'],
    allowedWatering:  ['drip'],
  },
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   '#00d4c8',
  medium: '#f0a830',
  hard:   '#cc00aa',
}

const TYPE_EMOJI: Record<string, string> = {
  indica:  '🔵',
  sativa:  '🟢',
  hybrid:  '🟡',
}

// Local strain images — slug → path in /public/strains/
// Used as primary source; falls back to shopImageUrl, then avatarLevels imageUrl
const STRAIN_LOCAL_IMG: Record<string, string> = {
  'cherrygasm':   '/strains/genetics/cherrygasm.jpg',
  'jack-herer':   '/strains/genetics/jack-herer.jpg',
  'odb':          '/strains/genetics/odb.jpg',
  'dosidos':      '/strains/dosidos.jpg',
  'milky-dreams': '/strains/genetics/milky-dreams.jpg',
  'tarte-tarin':  '/strains/genetics/tarte-tarin.jpg',
  'velvet-moon':  '/strains/genetics/velvet-moon.jpg',
}

// ── Quick setup presets ────────────────────────────────────────────────────────

const PRESET_BEGINNER: Setup = {
  tentSize:          '100x100',
  lightType:         'led',
  lightWatts:        240,
  lightBrand:        '',
  medium:            'living_soil',
  potSize:           'medium',
  watering:          'manual',
  nutrients:         'organic',
  hasExhaustFan:     true,
  exhaustCFM:        200,
  hasCirculationFan: true,
  hasCarbonFilter:   false,
  hasPHMeter:        false,
  hasECMeter:        false,
  hasHygrometer:     true,
  plantCount:        1,
}

const PRESET_PRO: Setup = {
  tentSize:          '120x120',
  lightType:         'led',
  lightWatts:        400,
  lightBrand:        '',
  medium:            'coco',
  potSize:           'medium',
  watering:          'drip',
  nutrients:         'mineral',
  hasExhaustFan:     true,
  exhaustCFM:        300,
  hasCirculationFan: true,
  hasCarbonFilter:   true,
  hasPHMeter:        true,
  hasECMeter:        true,
  hasHygrometer:     true,
  plantCount:        2,
}

function randomSetup(): Setup {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const medium = pick<Setup['medium']>(['living_soil', 'coco', 'hydro'])
  const rules  = MEDIUM_RULES[medium]
  return {
    tentSize:          pick<Setup['tentSize']>(['60x60', '80x80', '100x100', '120x120', '150x150']),
    lightType:         pick<Setup['lightType']>(['led', 'hps', 'cmh', 'cfl']),
    lightWatts:        pick([100, 150, 200, 240, 300, 400, 600]),
    lightBrand:        '',
    medium,
    potSize:           pick<Setup['potSize']>(['small', 'medium', 'large']),
    watering:          pick(rules.allowedWatering),
    nutrients:         pick(rules.allowedNutrients),
    hasExhaustFan:     Math.random() > 0.2,
    exhaustCFM:        pick([100, 150, 200, 300, 400]),
    hasCirculationFan: Math.random() > 0.25,
    hasCarbonFilter:   Math.random() > 0.5,
    hasPHMeter:        Math.random() > 0.5,
    hasECMeter:        medium !== 'living_soil' ? Math.random() > 0.4 : false,
    hasHygrometer:     Math.random() > 0.15,
    plantCount:        pick<Setup['plantCount']>([1, 2, 3, 4]),
  }
}

const SPEED_PRESETS = [
  { label: '1 min',  seconds: 60,    tier: 'practice' as const },
  { label: '5 min',  seconds: 300,   tier: 'practice' as const },
  { label: '15 min', seconds: 900,   tier: 'practice' as const },
  { label: '30 min', seconds: 1800,  tier: 'practice' as const },
  { label: '1 h',    seconds: 3600,  tier: 'standard' as const },
  { label: '3 h',    seconds: 10800, tier: 'standard' as const },
  { label: '6 h',    seconds: 21600, tier: 'standard' as const },
  { label: '12 h',   seconds: 43200, tier: 'standard' as const },
  { label: '24 h',   seconds: 86400, tier: 'full'     as const },
]

const TIER_COLORS = {
  full:     '#00d4c8',
  standard: '#f0a830',
  practice: '#cc00aa',
}

function getTier(secs: number): 'full' | 'standard' | 'practice' {
  if (secs >= 86400) return 'full'
  if (secs >= 3600)  return 'standard'
  return 'practice'
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const S = {
  card: {
    background: 'rgba(13,0,20,0.7)',
    border: '0.5px solid rgba(204,0,170,0.2)',
    borderRadius: '8px',
    padding: '24px',
  } as React.CSSProperties,
  label: {
    fontFamily: 'var(--font-dm-mono)',
    fontSize: '9px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    color: '#4a6066',
    marginBottom: '10px',
  } as React.CSSProperties,
  btn: (active: boolean, disabled?: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-dm-mono)',
    fontSize: '11px',
    padding: '8px 14px',
    borderRadius: '4px',
    border: active ? '0.5px solid rgba(204,0,170,0.6)' : '0.5px solid rgba(74,96,102,0.4)',
    background: active ? 'rgba(204,0,170,0.15)' : 'transparent',
    color: disabled ? '#4a6066' : active ? '#cc00aa' : '#e8f0ef',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
}

// ── Main component ─────────────────────────────────────────────────────────────

function SetupWizardInner() {
  const { t }      = useLanguage()
  const g          = t.growSetup
  const router     = useRouter()
  const params     = useSearchParams()
  const preselect         = params.get('strain') ?? ''
  const cloneSlug         = params.get('clone') ?? ''
  const initDDS           = Math.min(86400, Math.max(60, Number(params.get('dds') ?? 86400)))

  const [step, setStep]           = useState(0)
  const [dayDurationSeconds, setDds] = useState<number>(initDDS)
  const [setup, setSetup]         = useState<Setup>(DEFAULT_SETUP)
  const [activePreset, setActivePreset] = useState<'beginner' | 'pro' | null>(null)
  const [pending, start]          = useTransition()

  // Strain state
  const [strains, setStrains]             = useState<StrainOption[]>([])
  const [strainsLoading, setStrainsLoading] = useState(true)
  const [selectedSlug, setSelectedSlug]   = useState(preselect)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customStrain, setCustomStrain]   = useState<CustomStrain>({
    name: '', type: 'hybrid', floweringTime: 63, difficulty: 'medium',
  })
  const [nameError, setNameError]         = useState(false)

  useEffect(() => {
    // Fetch strains + shop products in parallel
    Promise.all([
      fetch('/api/hub/strains').then(r => r.json()),
      fetch('/api/shop/products').then(r => r.json()).catch(() => ({ products: [] })),
    ])
      .then(([strainsData, productsData]) => {
        // Build slug → first image map from all shop products
        const shopImages: Record<string, string> = {}
        for (const p of (productsData.products ?? []) as Array<{ slug: string; images?: string[] }>) {
          if (p.images?.[0]) shopImages[p.slug] = p.images[0]
        }

        const raw: Array<{
          slug: string; name: string; type: string; floweringTime: number; difficulty: string
          visuals?: { avatarLevels?: Array<{ imageUrl: string }> }
          shopProductSlug?: string
        }> = strainsData.strains ?? []

        const list: StrainOption[] = raw.map(s => ({
          slug:            s.slug,
          name:            s.name,
          type:            s.type as 'indica' | 'sativa' | 'hybrid',
          floweringTime:   s.floweringTime,
          difficulty:      s.difficulty as 'easy' | 'medium' | 'hard',
          imageUrl:        s.visuals?.avatarLevels?.[0]?.imageUrl ?? '',
          shopProductSlug: s.shopProductSlug,
          shopImageUrl:    s.shopProductSlug ? shopImages[s.shopProductSlug] : undefined,
        }))
        setStrains(list)
        setStrainsLoading(false)
      })
      .catch(() => setStrainsLoading(false))
  }, [])

  const rules = MEDIUM_RULES[setup.medium]

  function set<K extends keyof Setup>(key: K, val: Setup[K]) {
    setSetup(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'medium') {
        const r = MEDIUM_RULES[val as Setup['medium']]
        if (!r.allowedNutrients.includes(next.nutrients)) next.nutrients = r.allowedNutrients[0]
        if (!r.allowedWatering.includes(next.watering))   next.watering  = r.allowedWatering[0]
      }
      return next
    })
  }

  const STEPS = g.steps

  const isCloneGrow      = !!cloneSlug
  const isCustom         = !isCloneGrow && selectedSlug === '__custom__'
  const selectedStrain   = strains.find(s => s.slug === selectedSlug)
  const strainReady      = isCloneGrow || (isCustom ? customStrain.name.trim().length > 0 : !!selectedSlug)

  function fmtSpeed(secs: number): string {
    if (secs >= 86400) return g.fmtRealtime
    if (secs >= 3600)  return g.fmtHours(Math.round(secs / 3600))
    if (secs >= 60)    return g.fmtMinutes(Math.round(secs / 60))
    return g.fmtSeconds(secs)
  }

  function cycleEstimate(flowerDays: number, secs: number): string {
    const total    = 7 + 28 + flowerDays
    const realSecs = total * secs
    if (realSecs >= 86400 * 2) return g.cycleEst(total, Math.round(realSecs / 86400))
    if (realSecs >= 3600)      return g.cycleEstHours(total, Math.round(realSecs / 3600))
    return g.cycleEstMinutes(total, Math.round(realSecs / 60))
  }

  function disabledNutMsg(): string | undefined {
    if (setup.medium === 'living_soil') return g.disabledSoilNut
    if (setup.medium === 'coco')        return g.disabledCocoNut
    if (setup.medium === 'hydro')       return g.disabledHydroNut
    return undefined
  }

  function disabledWatMsg(): string | undefined {
    if (setup.medium === 'coco')  return g.disabledCocoWat
    if (setup.medium === 'hydro') return g.disabledHydroWat
    return undefined
  }

  async function submit() {
    start(async () => {
      const body = isCloneGrow
        ? { cloneStrainSlug: cloneSlug, setup, dayDurationSeconds }
        : isCustom
          ? { customStrain, setup, dayDurationSeconds }
          : { strainSlug: selectedSlug, setup, dayDurationSeconds }

      const res  = await fetch('/api/hub/grow/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? g.startFailed)
        return
      }
      toast.success(g.startSuccess)
      router.push(`/hub/grow/${data.grow._id}`)
    })
  }

  return (
    <div style={{ maxWidth: '680px', padding: '20px 16px 60px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ ...S.label, marginBottom: '6px' }}>{g.stepLabel(step + 1, STEPS.length)}</div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', color: '#e8f0ef', margin: 0, letterSpacing: '1px' }}>
          {STEPS[step]}
        </h1>
        {dayDurationSeconds < 86400 && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: TIER_COLORS[getTier(dayDurationSeconds)], marginTop: '4px', display: 'block' }}>
            {fmtSpeed(dayDurationSeconds)} · {g[`tier${getTier(dayDurationSeconds).charAt(0).toUpperCase() + getTier(dayDurationSeconds).slice(1)}` as 'tierFull' | 'tierStandard' | 'tierPractice'].label}
          </span>
        )}
      </div>

      {/* Clone banner */}
      {isCloneGrow && (
        <div style={{
          background: 'rgba(0,212,200,0.06)',
          border: '0.5px solid rgba(0,212,200,0.3)',
          borderRadius: '6px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#00d4c8', marginBottom: '2px' }}>
              Clone grow — veg skipped
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
              4-day rooting · flip window opens day 4
            </div>
          </div>
        </div>
      )}

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => {
          // Preset active: steps 1-6 are all skipped, only step 0 and Review matter
          const presetSkipped = !!activePreset && i >= 1 && i < STEPS.length - 1
          const isDone  = presetSkipped || i < step
          const isActive = i === step
          const canClick = !presetSkipped && i <= step
          return (
            <button key={s} onClick={() => canClick && setStep(i)} style={{
              ...S.btn(isActive, !isDone && !isActive),
              fontSize: '9px', padding: '4px 9px',
              opacity: presetSkipped ? 0.3 : 1,
              cursor: canClick ? 'pointer' : 'default',
            }}>
              {isDone ? '✓ ' : ''}{s}
            </button>
          )
        })}
      </div>

      {/* ── Step 0: Speed ── */}
      {step === 0 && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a6066" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <div style={{ ...S.label, marginBottom: 0 }}>{g.speedLabel}</div>
          </div>

          {/* Preset grid */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {SPEED_PRESETS.map(p => {
              const active = dayDurationSeconds === p.seconds
              const color  = TIER_COLORS[p.tier]
              return (
                <button
                  key={p.seconds}
                  onClick={() => setDds(p.seconds)}
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '11px',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    border: active ? `0.5px solid ${color}80` : '0.5px solid rgba(74,96,102,0.4)',
                    background: active ? `${color}18` : 'transparent',
                    color: active ? color : '#e8f0ef',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Tier info box */}
          {(() => {
            const tier  = getTier(dayDurationSeconds)
            const color = TIER_COLORS[tier]
            const info  = g[`tier${tier.charAt(0).toUpperCase() + tier.slice(1)}` as 'tierFull' | 'tierStandard' | 'tierPractice']
            return (
              <div style={{
                background: `${color}10`,
                border: `0.5px solid ${color}40`,
                borderRadius: '6px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color, marginBottom: '4px' }}>
                  {info.label}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
                  {info.desc}
                </div>
              </div>
            )
          })()}

          {/* ── Quick Setup Presets ── */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '0.5px solid rgba(74,96,102,0.2)' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#e8f0ef', marginBottom: '4px' }}>
                {g.quickSetupTitle}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
                {g.quickSetupSub}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {([ 'beginner', 'pro' ] as const).map(key => {
                const info    = g.presets[key]
                const isActive = activePreset === key
                const colors: Record<string, { border: string; bg: string; text: string }> = {
                  beginner: { border: 'rgba(0,212,200,0.5)',   bg: 'rgba(0,212,200,0.08)',   text: '#00d4c8' },
                  pro:      { border: 'rgba(204,0,170,0.5)',   bg: 'rgba(204,0,170,0.08)',   text: '#cc00aa' },
                }
                const c = colors[key]
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSetup(key === 'beginner' ? PRESET_BEGINNER : PRESET_PRO)
                      setActivePreset(key)
                      setStep(STEPS.length - 1)
                    }}
                    style={{
                      background:   isActive ? c.bg : 'rgba(10,36,40,0.5)',
                      border:       isActive ? `1px solid ${c.border}` : '0.5px solid rgba(74,96,102,0.3)',
                      borderRadius: '6px',
                      padding:      '12px 10px',
                      cursor:       'pointer',
                      textAlign:    'left',
                      transition:   'all 0.2s',
                      boxShadow:    isActive ? `0 0 12px ${c.bg}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{info.icon}</div>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', color: isActive ? c.text : '#e8f0ef', marginBottom: '4px' }}>
                      {info.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', lineHeight: 1.5, marginBottom: '6px' }}>
                      {info.desc}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', color: isActive ? c.text : '#4a6066', fontStyle: 'italic' }}>
                      {info.hint}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: '8px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: c.text, letterSpacing: '0.5px' }}>
                        ✓ applied
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cycle estimate (if strain already selected) */}
          {strainReady && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginTop: '16px' }}>
              {cycleEstimate(
                isCustom ? customStrain.floweringTime : (selectedStrain?.floweringTime ?? 63),
                dayDurationSeconds,
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Strain ── */}
      {step === 1 && isCloneGrow && (
        <div style={S.card}>
          <div style={S.label}>Clone strain</div>
          <div style={{
            background: 'rgba(0,212,200,0.07)',
            border: '0.5px solid rgba(0,212,200,0.25)',
            borderRadius: '6px', padding: '16px',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#00d4c8', letterSpacing: '1px', marginBottom: '6px' }}>
              🌿 CLONE · FREE
            </div>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '18px', color: '#e8f0ef', marginBottom: '4px' }}>
              {cloneSlug}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
              Strain locked — taken from your clone bank. Veg phase replaced by 4-day rooting.
            </div>
          </div>
        </div>
      )}

      {step === 1 && !isCloneGrow && (
        <div style={S.card}>
          <div style={S.label}>{g.chooseStrain}</div>

          {strainsLoading ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>
              {g.loadingStrains}
            </div>
          ) : (
            <>
              {/* Strain grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {strains.map(s => (
                  <button
                    key={s.slug}
                    onClick={() => { setSelectedSlug(s.slug); setShowCustomForm(false) }}
                    style={{
                      background: selectedSlug === s.slug ? 'rgba(204,0,170,0.12)' : 'rgba(10,36,40,0.6)',
                      border: `0.5px solid ${selectedSlug === s.slug ? 'rgba(204,0,170,0.5)' : 'rgba(74,96,102,0.25)'}`,
                      borderRadius: '6px',
                      padding: '0',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Strain image — local first, then shop product, then avatar, then emoji */}
                    <div style={{ height: '80px', background: 'rgba(5,5,8,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {(STRAIN_LOCAL_IMG[s.slug] || s.shopImageUrl || s.imageUrl) ? (
                        <img src={STRAIN_LOCAL_IMG[s.slug] ?? s.shopImageUrl ?? s.imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                      ) : (
                        <span style={{ fontSize: '28px' }}>{TYPE_EMOJI[s.type]}</span>
                      )}
                      {selectedSlug === s.slug && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#cc00aa', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef', marginBottom: '3px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </div>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>
                          {s.floweringTime}d
                        </span>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: DIFFICULTY_COLOR[s.difficulty] }}>
                          {s.difficulty}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Custom strain option */}
                <button
                  onClick={() => { setSelectedSlug('__custom__'); setShowCustomForm(true) }}
                  style={{
                    background: selectedSlug === '__custom__' ? 'rgba(240,168,48,0.10)' : 'rgba(10,36,40,0.4)',
                    border: `0.5px dashed ${selectedSlug === '__custom__' ? 'rgba(240,168,48,0.5)' : 'rgba(74,96,102,0.3)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '22px' }}>✏️</span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#00d4c8' }}>{g.ownStrainCost}</span>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: selectedSlug === '__custom__' ? '#f0a830' : '#e8f0ef', fontWeight: 500 }}>
                      {g.ownStrain}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>
                      {g.ownStrainSub}
                    </div>
                  </div>
                </button>
              </div>

              {/* Custom strain form */}
              {showCustomForm && (
                <div style={{
                  background: 'rgba(240,168,48,0.05)',
                  border: '0.5px solid rgba(240,168,48,0.2)',
                  borderRadius: '6px',
                  padding: '16px',
                  marginTop: '4px',
                }}>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ ...S.label, color: '#f0a830', marginBottom: 0 }}>{g.customFormTitle}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Name */}
                    <div>
                      <label style={{ ...S.label, color: nameError ? '#cc00aa' : undefined }}>
                        {nameError ? g.strainNameError : g.strainNameLabel}
                      </label>
                      <input
                        value={customStrain.name}
                        onChange={e => {
                          setCustomStrain(p => ({ ...p, name: e.target.value.slice(0, 60) }))
                          if (e.target.value.trim()) setNameError(false)
                        }}
                        placeholder={g.strainNamePh}
                        autoFocus={nameError}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: nameError ? 'rgba(204,0,170,0.06)' : 'rgba(10,36,40,0.8)',
                          border: nameError ? '1px solid rgba(204,0,170,0.7)' : '0.5px solid rgba(74,96,102,0.4)',
                          borderRadius: '4px', padding: '9px 12px',
                          fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
                          color: '#e8f0ef', outline: 'none',
                          transition: 'border-color 0.15s, background 0.15s',
                          boxShadow: nameError ? '0 0 0 3px rgba(204,0,170,0.15)' : 'none',
                        }}
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label style={S.label}>{g.typeLabel}</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['indica', 'sativa', 'hybrid'] as const).map(type => (
                          <button key={type} onClick={() => setCustomStrain(p => ({ ...p, type }))} style={S.btn(customStrain.type === type)}>
                            {TYPE_EMOJI[type]} {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flowering time */}
                    <div>
                      <label style={S.label}>{g.floweringLabel}</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[49, 56, 63, 70, 77, 84].map(d => (
                          <button key={d} onClick={() => setCustomStrain(p => ({ ...p, floweringTime: d }))} style={S.btn(customStrain.floweringTime === d)}>
                            {d}d
                          </button>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', marginTop: '6px' }}>
                        {g.floweringExact}&nbsp;
                        <input
                          type="number"
                          value={customStrain.floweringTime}
                          min={42} max={120}
                          onChange={e => setCustomStrain(p => ({ ...p, floweringTime: Number(e.target.value) }))}
                          style={{
                            width: '56px', background: 'rgba(10,36,40,0.8)',
                            border: '0.5px solid rgba(74,96,102,0.4)', borderRadius: '4px',
                            padding: '4px 8px', color: '#e8f0ef',
                            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', outline: 'none',
                          }}
                        />
                        &nbsp;{g.floweringDays}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label style={S.label}>{g.difficultyLabel}</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['easy', 'medium', 'hard'] as const).map(d => (
                          <button key={d} onClick={() => setCustomStrain(p => ({ ...p, difficulty: d }))} style={{
                            ...S.btn(customStrain.difficulty === d),
                            color: customStrain.difficulty === d ? DIFFICULTY_COLOR[d] : '#e8f0ef',
                            border: customStrain.difficulty === d ? `0.5px solid ${DIFFICULTY_COLOR[d]}80` : '0.5px solid rgba(74,96,102,0.4)',
                            background: customStrain.difficulty === d ? `${DIFFICULTY_COLOR[d]}18` : 'transparent',
                          }}>
                            {g[`diff${d.charAt(0).toUpperCase() + d.slice(1)}` as 'diffEasy' | 'diffMedium' | 'diffHard']}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selection summary */}
              {strainReady && (
                <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(204,0,170,0.08)', borderRadius: '4px', border: '0.5px solid rgba(204,0,170,0.2)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#cc00aa' }}>
                    {isCustom ? g.customSelected(customStrain.name) : g.strainSelected(selectedStrain?.name ?? '')}
                    {isCustom && ` ${g.customCostNote}`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Tent ── */}
      {step === 2 && (() => {
        const TENT_DIMS: Record<Setup['tentSize'], string> = {
          '60x60':   '60×60×160',
          '80x80':   '80×80×180',
          '100x100': '100×100×200',
          '120x120': '120×120×200',
          '150x150': '150×150×220',
        }
        const TENT_IMG: Record<Setup['tentSize'], string> = {
          '60x60':   '/equip/growbox/homebox 1.png',
          '80x80':   '/equip/growbox/homebox 1.png',
          '100x100': '/equip/growbox/homebox 2.png',
          '120x120': '/equip/growbox/homebox 2.png',
          '150x150': '/equip/growbox/homebox 3.png',
        }
        // Height of tent image per size — shows full box, scales with tent size
        const TENT_IMG_H: Record<Setup['tentSize'], number> = {
          '60x60':   130,
          '80x80':   160,
          '100x100': 190,
          '120x120': 210,
          '150x150': 240,
        }
        return (
          <div style={{
            ...S.card,
            minHeight: '300px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Tent image — full box always visible */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TENT_IMG[setup.tentSize]}
              alt=""
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: `${TENT_IMG_H[setup.tentSize]}px`,
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.22,
                pointerEvents: 'none',
                transition: 'height 0.35s ease',
                userSelect: 'none',
              }}
            />

            {/* Content above image */}
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={S.label}>{g.tentSizeLabel}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(['60x60', '80x80', '100x100', '120x120', '150x150'] as Setup['tentSize'][]).map(s => (
                <button key={s} onClick={() => set('tentSize', s)} style={{
                  ...S.btn(setup.tentSize === s),
                  backdropFilter: 'blur(3px)',
                  background: setup.tentSize === s ? 'rgba(204,0,170,0.25)' : 'rgba(5,5,8,0.55)',
                }}>
                  {TENT_DIMS[s]}
                </button>
              ))}
            </div>

            {/* Dimensions badge */}
            <div style={{
              position: 'absolute', top: '20px', right: '20px',
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
              color: '#00d4c8', background: 'rgba(5,5,8,0.75)',
              padding: '3px 8px', borderRadius: '3px', letterSpacing: '1px',
            }}>
              {TENT_DIMS[setup.tentSize]} cm
            </div>

            {/* Spacer so image shows through in the middle */}
            <div style={{ height: '100px' }} />

            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#a0b8bc', lineHeight: 1.6, marginBottom: '20px' }}>
              {g.tentDescs[setup.tentSize]}
            </div>

            {/* ── Plant count ── */}
            {(() => {
              // Max comfortable plants per tent
              const TENT_MAX: Record<Setup['tentSize'], number> = {
                '60x60': 2, '80x80': 3, '100x100': 4, '120x120': 4, '150x150': 4,
              }
              const isCrowded = setup.plantCount > TENT_MAX[setup.tentSize]
              return (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '20px', color: '#e8f0ef', letterSpacing: '1px', marginBottom: '4px' }}>
                      {g.plantCountLabel}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
                      {g.plantCountSub}
                    </div>
                  </div>
                  <style>{`@media(max-width:480px){.plant-count-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
                  <div className="plant-count-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    {([1, 2, 3, 4] as const).map(n => {
                      const active = setup.plantCount === n
                      return (
                        <button
                          key={n}
                          onClick={() => set('plantCount', n)}
                          style={{
                            ...S.btn(false),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px',
                            padding: '10px 6px',
                            width: '100%',
                            border: active ? '1.5px solid #56c254' : '0.5px solid rgba(74,96,102,0.4)',
                            background: active ? 'rgba(86,194,84,0.12)' : 'transparent',
                            color: active ? '#56c254' : '#e8f0ef',
                            boxShadow: active ? '0 0 10px rgba(86,194,84,0.2)' : 'none',
                          }}
                        >
                          {/* Plant icons */}
                          <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end', height: '32px' }}>
                            {Array.from({ length: n }).map((_, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src="/grow/plant/healthy/plant-late-flower.png"
                                alt=""
                                style={{
                                  height: '32px',
                                  width:  'auto',
                                  maxWidth: `${Math.floor(56 / n)}px`,
                                  objectFit: 'contain',
                                  mixBlendMode: 'screen',
                                  filter: 'none',
                                }}
                              />
                            ))}
                          </div>
                          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}>{n}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: isCrowded ? '#f0a830' : '#4a6066', lineHeight: 1.5 }}>
                    {isCrowded
                      ? g.plantCountWarn(setup.plantCount, setup.tentSize)
                      : g.plantCountHint[setup.tentSize]}
                  </div>
                </>
              )
            })()}
            </div>{/* end content wrapper */}
          </div>
        )
      })()}

      {/* ── Step 3: Light ── */}
      {step === 3 && (() => {
        const LIGHT_IMG: Record<Setup['lightType'], string> = {
          led: '/equip/lights/led.png',
          hps: '/equip/lights/hps.png',
          cmh: '/equip/lights/cmh.png',
          cfl: '/equip/lights/cfl.png',
        }
        return (
        <div style={{
          ...S.card,
          backgroundImage: `linear-gradient(rgba(13,0,20,0.70) 0%, rgba(13,0,20,0.55) 40%, rgba(13,0,20,0.85) 100%), url('${LIGHT_IMG[setup.lightType]}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
          minHeight: '240px',
          transition: 'background-image 0.3s ease',
          position: 'relative',
        }}>
          <div style={S.label}>{g.lightTypeLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['led', 'hps', 'cmh', 'cfl'] as Setup['lightType'][]).map(l => (
              <button key={l} onClick={() => set('lightType', l)} style={{
                ...S.btn(setup.lightType === l),
                backdropFilter: 'blur(4px)',
                background: setup.lightType === l ? 'rgba(204,0,170,0.25)' : 'rgba(5,5,8,0.55)',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{
            background: 'rgba(13,0,20,0.65)',
            border: '0.5px solid rgba(204,0,170,0.15)',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '20px',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#a0b8bc', lineHeight: 1.6 }}>
              {g.lightDescs[setup.lightType]}
            </div>
          </div>

          <div style={S.label}>{g.wattageLabel}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[100, 150, 200, 240, 300, 400, 600, 800, 1000].map(w => (
              <button key={w} onClick={() => set('lightWatts', w)} style={S.btn(setup.lightWatts === w)}>
                {w}W
              </button>
            ))}
          </div>

          <div style={S.label}>{g.brandLabel}</div>
          <input
            value={setup.lightBrand}
            onChange={e => set('lightBrand', e.target.value)}
            placeholder={g.brandPh}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(10,36,40,0.8)',
              border: '0.5px solid rgba(74,96,102,0.4)',
              borderRadius: '4px', padding: '8px 12px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
              color: '#e8f0ef', outline: 'none',
            }}
          />
        </div>
        )
      })()}

      {/* ── Step 4: Medium ── */}
      {step === 4 && (
        <div style={S.card}>
          <div style={S.label}>{g.mediumLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['living_soil', 'coco', 'hydro'] as Setup['medium'][]).map(m => (
              <button key={m} onClick={() => set('medium', m)} style={S.btn(setup.medium === m)}>
                {g.mediumNames[m]}
              </button>
            ))}
          </div>

          <div style={S.label}>{g.containerLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['small', 'medium', 'large'] as Setup['potSize'][]).map(p => (
              <button key={p} onClick={() => set('potSize', p)} style={S.btn(setup.potSize === p)}>
                {g.potNames[p]}
              </button>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.6 }}>
            <span style={{ color: setup.medium === 'living_soil' ? '#4a6066' : '#f0a830' }}>
              {g.mediumDescs[setup.medium]}
            </span>
          </div>
        </div>
      )}

      {/* ── Step 5: Watering + Nutrients ── */}
      {step === 5 && (
        <div style={S.card}>
          <div style={S.label}>{g.wateringLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {(['manual', 'blumat', 'drip'] as Setup['watering'][]).map(w => {
              const disabled = !rules.allowedWatering.includes(w)
              return (
                <button key={w} onClick={() => !disabled && set('watering', w)} style={S.btn(setup.watering === w, disabled)}
                  title={disabled ? disabledWatMsg() : undefined}>
                  {g.waterNames[w]}
                </button>
              )
            })}
          </div>

          <div style={{
            background: 'rgba(204,0,170,0.05)',
            border: '0.5px solid rgba(204,0,170,0.15)',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '20px',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
              {g.waterDescs[setup.watering]}
            </div>
          </div>

          <div style={S.label}>{g.nutrientsLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['organic', 'mineral', 'none'] as Setup['nutrients'][]).map(n => {
              const disabled = !rules.allowedNutrients.includes(n)
              return (
                <button key={n} onClick={() => !disabled && set('nutrients', n)} style={S.btn(setup.nutrients === n, disabled)}
                  title={disabled ? disabledNutMsg() : undefined}>
                  {g.nutrientNames[n]}
                </button>
              )
            })}
          </div>

          {disabledNutMsg() && (
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.6 }}>
              ℹ️ {disabledNutMsg()}
            </div>
          )}
        </div>
      )}

      {/* ── Step 6: Accessories ── */}
      {step === 6 && (
        <div style={S.card}>
          <div style={S.label}>{g.ventilationLabel}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>

            {/* Exhaust fan */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '6px' }}>
                <input type="checkbox" checked={setup.hasExhaustFan} onChange={e => set('hasExhaustFan', e.target.checked)} />
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.exhaustFan}</span>
              </label>
              <div style={{ marginLeft: '28px', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5, marginBottom: setup.hasExhaustFan ? '10px' : '0' }}>
                {g.exhaustFanDesc}
              </div>
              {setup.hasExhaustFan && (
                <div style={{ marginLeft: '28px' }}>
                  {/* CFM selection over fan bg */}
                  <div style={{
                    borderRadius: '6px',
                    marginBottom: '12px',
                    border: '0.5px solid rgba(74,96,102,0.2)',
                    padding: '16px',
                    backgroundImage: `linear-gradient(rgba(13,0,20,0.65) 0%, rgba(13,0,20,0.50) 50%, rgba(13,0,20,0.75) 100%), url('/equip/fan/exhaust fan.png')`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center right',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '100px',
                  }}>
                    <div style={{ ...S.label, color: '#a0b8bc' }}>{g.cfmLabel}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[100, 150, 200, 300, 400, 600].map(cfm => (
                        <button key={cfm} onClick={() => set('exhaustCFM', cfm)} style={{
                          ...S.btn(setup.exhaustCFM === cfm),
                          backdropFilter: 'blur(3px)',
                          background: setup.exhaustCFM === cfm ? 'rgba(204,0,170,0.25)' : 'rgba(5,5,8,0.55)',
                        }}>
                          {cfm} CFM
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Circulation fan */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '6px' }}>
                <input type="checkbox" checked={setup.hasCirculationFan} onChange={e => set('hasCirculationFan', e.target.checked)} />
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.circulationFan}</span>
              </label>
              <div style={{ marginLeft: '28px', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
                {g.circulationFanDesc}
              </div>
            </div>

            {/* Carbon filter */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '6px' }}>
                <input type="checkbox" checked={setup.hasCarbonFilter} onChange={e => set('hasCarbonFilter', e.target.checked)} />
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.carbonFilter}</span>
              </label>
              <div style={{ marginLeft: '28px', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
                {g.carbonFilterDesc}
              </div>
            </div>
          </div>

          <div style={S.label}>{g.monitoringLabel}</div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '6px' }}>
              <input
                type="checkbox"
                checked={setup.hasHygrometer}
                onChange={e => set('hasHygrometer', e.target.checked)}
              />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.hygrometer}</span>
            </label>
            <div style={{ marginLeft: '28px', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
              {g.hygrometerDesc}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 7: Review ── */}
      {step === 7 && (
        <div style={S.card}>
          <div style={S.label}>{g.reviewLabel}</div>

          {/* Inline strain picker — shown when arriving via preset with no strain selected */}
          {!strainReady && activePreset && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#cc00aa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                {g.chooseStrain}
              </div>
              {strainsLoading ? (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{g.loadingStrains}</div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {strains.map(s => (
                    <button
                      key={s.slug}
                      onClick={() => setSelectedSlug(s.slug)}
                      style={{
                        fontFamily: 'var(--font-dm-sans)', fontSize: '11px',
                        padding: '6px 12px', borderRadius: '4px',
                        border: `0.5px solid ${selectedSlug === s.slug ? 'rgba(204,0,170,0.6)' : 'rgba(74,96,102,0.3)'}`,
                        background: selectedSlug === s.slug ? 'rgba(204,0,170,0.12)' : 'transparent',
                        color: selectedSlug === s.slug ? '#cc00aa' : '#e8f0ef',
                        cursor: 'pointer',
                      }}
                    >
                      {TYPE_EMOJI[s.type]} {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Strain summary */}
          <div style={{ background: 'rgba(204,0,170,0.07)', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px' }}>
            <div style={{ ...S.label, marginBottom: '4px' }}>{g.strainLabel}</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef', fontWeight: 500 }}>
              {isCustom ? customStrain.name : selectedStrain?.name ?? '—'}
              {isCustom && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', marginLeft: '10px' }}>{g.customBadge}</span>}
            </div>
            {!isCustom && selectedStrain && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '3px' }}>
                {selectedStrain.type} · {selectedStrain.floweringTime}d · {selectedStrain.difficulty}
              </div>
            )}
            {isCustom && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '3px' }}>
                {customStrain.type} · {customStrain.floweringTime}d · {customStrain.difficulty}
              </div>
            )}
          </div>

          {/* Setup grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: '24px' }}>
            {[
              [g.reviewTent,      setup.tentSize],
              [g.reviewLight,     `${setup.lightWatts}W ${setup.lightType.toUpperCase()}`],
              [g.reviewMedium,    g.mediumNames[setup.medium]],
              [g.reviewContainer, g.potNames[setup.potSize]],
              [g.reviewWatering,  g.waterNames[setup.watering]],
              [g.reviewNutrients, g.nutrientNames[setup.nutrients]],
              [g.reviewExhaust,   setup.hasExhaustFan ? `${setup.exhaustCFM} CFM` : g.valNone],
              [g.reviewCircFan,   setup.hasCirculationFan ? g.valYes : g.valNo],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ ...S.label, marginBottom: '2px' }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{v}</div>
              </div>
            ))}
          </div>

          {(() => {
            const tier       = getTier(dayDurationSeconds)
            const color      = TIER_COLORS[tier]
            const info       = g[`tier${tier.charAt(0).toUpperCase() + tier.slice(1)}` as 'tierFull' | 'tierStandard' | 'tierPractice']
            const flowerDays = isCustom ? customStrain.floweringTime : (selectedStrain?.floweringTime ?? 63)
            return (
              <div style={{ background: `${color}10`, border: `0.5px solid ${color}40`, borderRadius: '4px', padding: '12px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color, marginBottom: '4px' }}>
                  {fmtSpeed(dayDurationSeconds)} · {info.label}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
                  {info.desc}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginTop: '6px' }}>
                  {cycleEstimate(flowerDays, dayDurationSeconds)}
                </div>
              </div>
            )
          })()}

          <button
            onClick={submit}
            disabled={pending || !strainReady}
            style={{
              display: 'block', width: '100%',
              fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase',
              color: '#050508', background: pending ? '#4a6066' : '#cc00aa',
              border: 'none', borderRadius: '4px', padding: '14px 24px',
              cursor: pending ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            }}
          >
            {pending ? g.planting : g.plantSeed}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          onClick={() => {
            if (step === 0) { router.push('/hub/grow'); return }
            // Back from Review with preset → back to step 0 (Speed), not Accessories
            if (activePreset && step === STEPS.length - 1) { setStep(0); return }
            setStep(s => s - 1)
          }}
          style={S.btn(false)}
        >
          {g.back}
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => {
              if (step === 1 && !strainReady) {
                if (isCustom) setNameError(true)
                toast.error(g.selectStrainFirst)
                return
              }
              setStep(s => s + 1)
            }}
            style={S.btn(true)}
          >
            {g.next}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>…</div>}>
      <SetupWizardInner />
    </Suspense>
  )
}
