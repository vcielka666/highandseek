'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/stores/languageStore'

// ── Types ──────────────────────────────────────────────────────────────────────

interface StrainOption {
  slug:          string
  name:          string
  type:          'indica' | 'sativa' | 'hybrid'
  floweringTime: number
  difficulty:    'easy' | 'medium' | 'hard'
  imageUrl:      string
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
  hasHygrometer:     false,
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
  const [userCredits, setUserCredits]     = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/hub/strains')
      .then(r => r.json())
      .then(d => {
        const list: StrainOption[] = (d.strains ?? []).map((s: {
          slug: string; name: string; type: string; floweringTime: number; difficulty: string
          visuals?: { avatarLevels?: Array<{ imageUrl: string }> }
        }) => ({
          slug:          s.slug,
          name:          s.name,
          type:          s.type as 'indica' | 'sativa' | 'hybrid',
          floweringTime: s.floweringTime,
          difficulty:    s.difficulty as 'easy' | 'medium' | 'hard',
          imageUrl:      s.visuals?.avatarLevels?.[0]?.imageUrl ?? '',
        }))
        setStrains(list)
        setStrainsLoading(false)
      })
      .catch(() => setStrainsLoading(false))

    fetch('/api/hub/grow')
      .then(r => r.json())
      .then(d => { if (typeof d.credits === 'number') setUserCredits(d.credits) })
      .catch(() => null)
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
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= step && setStep(i)} style={{
            ...S.btn(i === step, i > step),
            fontSize: '9px', padding: '4px 9px',
          }}>
            {i < step ? '✓ ' : ''}{s}
          </button>
        ))}
      </div>

      {/* ── Step 0: Speed ── */}
      {step === 0 && (
        <div style={S.card}>
          <div style={S.label}>{g.speedLabel}</div>

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

          {/* Cycle estimate (if strain already selected) */}
          {strainReady && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
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
                    {/* Mini avatar */}
                    <div style={{ height: '80px', background: 'rgba(5,5,8,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
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
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830' }}>{g.ownStrainCost}</span>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ ...S.label, color: '#f0a830', marginBottom: 0 }}>{g.customFormTitle}</div>
                    {userCredits !== null && (
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: userCredits >= 5 ? '#f0a830' : '#cc00aa' }}>
                        {userCredits >= 5 ? `💎 ${userCredits} credits` : `⚠️ ${userCredits} / 5 credits`}
                      </div>
                    )}
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
      {step === 2 && (
        <div style={S.card}>
          <div style={S.label}>{g.tentSizeLabel}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {(['60x60', '80x80', '100x100', '120x120', '150x150'] as Setup['tentSize'][]).map(s => (
              <button key={s} onClick={() => set('tentSize', s)} style={S.btn(setup.tentSize === s)}>
                {s} cm
              </button>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
            {g.tentDescs[setup.tentSize]}
          </div>
        </div>
      )}

      {/* ── Step 3: Light ── */}
      {step === 3 && (
        <div style={S.card}>
          <div style={S.label}>{g.lightTypeLabel}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['led', 'hps', 'cmh', 'cfl'] as Setup['lightType'][]).map(l => (
              <button key={l} onClick={() => set('lightType', l)} style={S.btn(setup.lightType === l)}>
                {l.toUpperCase()}
              </button>
            ))}
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
      )}

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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={setup.hasExhaustFan} onChange={e => set('hasExhaustFan', e.target.checked)} />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.exhaustFan}</span>
            </label>
            {setup.hasExhaustFan && (
              <div style={{ marginLeft: '28px' }}>
                <div style={S.label}>{g.cfmLabel}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[100, 150, 200, 300, 400, 600].map(cfm => (
                    <button key={cfm} onClick={() => set('exhaustCFM', cfm)} style={S.btn(setup.exhaustCFM === cfm)}>
                      {cfm} CFM
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={setup.hasCirculationFan} onChange={e => set('hasCirculationFan', e.target.checked)} />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.circulationFan}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={setup.hasCarbonFilter} onChange={e => set('hasCarbonFilter', e.target.checked)} />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{g.carbonFilter}</span>
            </label>
          </div>

          <div style={S.label}>{g.monitoringLabel}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'hasPHMeter',    label: g.phMeter },
              { key: 'hasECMeter',    label: g.ecMeter },
              { key: 'hasHygrometer', label: g.hygrometer },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={setup[key as keyof Setup] as boolean}
                  onChange={e => set(key as keyof Setup, e.target.checked as Setup[keyof Setup])}
                />
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 7: Review ── */}
      {step === 7 && (
        <div style={S.card}>
          <div style={S.label}>{g.reviewLabel}</div>

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
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={S.btn(false, step === 0)}
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
