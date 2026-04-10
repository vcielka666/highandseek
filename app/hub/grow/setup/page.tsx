'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

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
  disabledNutrients?: string
  disabledWatering?:  string
}> = {
  living_soil: {
    allowedNutrients: ['organic', 'none'],
    allowedWatering:  ['manual', 'blumat'],
    disabledNutrients: 'Mineral salts disrupt the soil food web',
  },
  coco: {
    allowedNutrients: ['mineral'],
    allowedWatering:  ['manual', 'drip'],
    disabledNutrients: 'Coco is inert — organic nutrients require microbial breakdown',
    disabledWatering: 'Blumat works with soil only',
  },
  hydro: {
    allowedNutrients: ['mineral'],
    allowedWatering:  ['drip'],
    disabledNutrients: 'Hydro requires mineral nutrients',
    disabledWatering: 'Hydro uses recirculating drip systems',
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

const TIER_INFO = {
  full:     { color: '#00d4c8', label: 'Full rewards',    desc: 'XP + Credits + NFT cert. 1 real day = 1 grow day.' },
  standard: { color: '#f0a830', label: 'Standard',        desc: 'XP + Credits. No NFT cert.' },
  practice: { color: '#cc00aa', label: 'Practice',        desc: 'XP only. Fast learning mode.' },
}

function getTier(secs: number): 'full' | 'standard' | 'practice' {
  if (secs >= 86400) return 'full'
  if (secs >= 3600)  return 'standard'
  return 'practice'
}

function fmtSpeed(secs: number): string {
  if (secs >= 86400) return 'Realtime'
  if (secs >= 3600)  return `⚡ ${Math.round(secs / 3600)}h/day`
  if (secs >= 60)    return `⚡ ${Math.round(secs / 60)}m/day`
  return `⚡ ${secs}s/day`
}

function cycleEstimate(flowerDays: number, secs: number): string {
  const total = 7 + 28 + flowerDays
  const realSecs = total * secs
  if (realSecs >= 86400 * 2) return `~${total} grow days ≈ ${Math.round(realSecs / 86400)} real days`
  if (realSecs >= 3600)      return `~${total} grow days ≈ ${Math.round(realSecs / 3600)} real hours`
  return `~${total} grow days ≈ ${Math.round(realSecs / 60)} real minutes`
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
  const router     = useRouter()
  const params     = useSearchParams()
  const preselect         = params.get('strain') ?? ''
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

  const STEPS = ['Speed', 'Strain', 'Tent', 'Light', 'Medium', 'Watering', 'Accessories', 'Review']

  const isCustom         = selectedSlug === '__custom__'
  const selectedStrain   = strains.find(s => s.slug === selectedSlug)
  const strainReady      = isCustom ? customStrain.name.trim().length > 0 : !!selectedSlug

  async function submit() {
    start(async () => {
      const body = isCustom
        ? { customStrain, setup, dayDurationSeconds }
        : { strainSlug: selectedSlug, setup, dayDurationSeconds }

      const res  = await fetch('/api/hub/grow/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to start grow')
        return
      }
      toast.success('🌱 Grow started!')
      router.push(`/hub/grow/${data.grow._id}`)
    })
  }

  return (
    <div style={{ maxWidth: '680px', padding: '20px 16px 60px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ ...S.label, marginBottom: '6px' }}>Setup wizard · Step {step + 1} of {STEPS.length}</div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', color: '#e8f0ef', margin: 0, letterSpacing: '1px' }}>
          {STEPS[step]}
        </h1>
        {dayDurationSeconds < 86400 && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: TIER_INFO[getTier(dayDurationSeconds)].color, marginTop: '4px', display: 'block' }}>
            {fmtSpeed(dayDurationSeconds)} · {TIER_INFO[getTier(dayDurationSeconds)].label}
          </span>
        )}
      </div>

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
          <div style={S.label}>How fast should one grow day pass?</div>

          {/* Preset grid */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {SPEED_PRESETS.map(p => {
              const active = dayDurationSeconds === p.seconds
              const tier   = TIER_INFO[p.tier]
              return (
                <button
                  key={p.seconds}
                  onClick={() => setDds(p.seconds)}
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '11px',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    border: active ? `0.5px solid ${tier.color}80` : '0.5px solid rgba(74,96,102,0.4)',
                    background: active ? `${tier.color}18` : 'transparent',
                    color: active ? tier.color : '#e8f0ef',
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
            const tier = getTier(dayDurationSeconds)
            const info = TIER_INFO[tier]
            return (
              <div style={{
                background: `${info.color}10`,
                border: `0.5px solid ${info.color}40`,
                borderRadius: '6px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: info.color, marginBottom: '4px' }}>
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
      {step === 1 && (
        <div style={S.card}>
          <div style={S.label}>Choose a Strain</div>

          {strainsLoading ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>
              Loading strains...
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
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830' }}>5 💎 credits</span>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: selectedSlug === '__custom__' ? '#f0a830' : '#e8f0ef', fontWeight: 500 }}>
                      Own strain
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>
                      Add your own
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
                    <div style={{ ...S.label, color: '#f0a830', marginBottom: 0 }}>Your Strain Info · costs 5 💎 credits</div>
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
                        Strain name{nameError && ' — required'}
                      </label>
                      <input
                        value={customStrain.name}
                        onChange={e => {
                          setCustomStrain(p => ({ ...p, name: e.target.value.slice(0, 60) }))
                          if (e.target.value.trim()) setNameError(false)
                        }}
                        placeholder="e.g. My Special Pheno, Bubba OG #4..."
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
                      <label style={S.label}>Type</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['indica', 'sativa', 'hybrid'] as const).map(t => (
                          <button key={t} onClick={() => setCustomStrain(p => ({ ...p, type: t }))} style={S.btn(customStrain.type === t)}>
                            {TYPE_EMOJI[t]} {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flowering time */}
                    <div>
                      <label style={S.label}>Approximate flowering time (days)</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[49, 56, 63, 70, 77, 84].map(d => (
                          <button key={d} onClick={() => setCustomStrain(p => ({ ...p, floweringTime: d }))} style={S.btn(customStrain.floweringTime === d)}>
                            {d}d
                          </button>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', marginTop: '6px' }}>
                        Or enter exact: &nbsp;
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
                        &nbsp;days
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label style={S.label}>Difficulty</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['easy', 'medium', 'hard'] as const).map(d => (
                          <button key={d} onClick={() => setCustomStrain(p => ({ ...p, difficulty: d }))} style={{
                            ...S.btn(customStrain.difficulty === d),
                            color: customStrain.difficulty === d ? DIFFICULTY_COLOR[d] : '#e8f0ef',
                            border: customStrain.difficulty === d ? `0.5px solid ${DIFFICULTY_COLOR[d]}80` : '0.5px solid rgba(74,96,102,0.4)',
                            background: customStrain.difficulty === d ? `${DIFFICULTY_COLOR[d]}18` : 'transparent',
                          }}>
                            {d}
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
                    ✓ {isCustom ? `Custom: ${customStrain.name}` : selectedStrain?.name}
                    {isCustom && ' — 5 💎 credits will be deducted'}
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
          <div style={S.label}>Tent Size</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {(['60x60', '80x80', '100x100', '120x120', '150x150'] as Setup['tentSize'][]).map(s => (
              <button key={s} onClick={() => set('tentSize', s)} style={S.btn(setup.tentSize === s)}>
                {s} cm
              </button>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
            {setup.tentSize === '60x60'   && '0.36m² — micro grow, max 1-2 plants. Heat builds fast.'}
            {setup.tentSize === '80x80'   && '0.64m² — small grow, 2-3 plants. Good for beginners.'}
            {setup.tentSize === '100x100' && '1m² — standard grow, 4-6 plants. Most popular size.'}
            {setup.tentSize === '120x120' && '1.44m² — medium grow, up to 8 plants.'}
            {setup.tentSize === '150x150' && '2.25m² — large grow, serious setup required.'}
          </div>
        </div>
      )}

      {/* ── Step 3: Light ── */}
      {step === 3 && (
        <div style={S.card}>
          <div style={S.label}>Light Type</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['led', 'hps', 'cmh', 'cfl'] as Setup['lightType'][]).map(l => (
              <button key={l} onClick={() => set('lightType', l)} style={S.btn(setup.lightType === l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={S.label}>Wattage</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[100, 150, 200, 240, 300, 400, 600, 800, 1000].map(w => (
              <button key={w} onClick={() => set('lightWatts', w)} style={S.btn(setup.lightWatts === w)}>
                {w}W
              </button>
            ))}
          </div>

          <div style={S.label}>Brand (optional)</div>
          <input
            value={setup.lightBrand}
            onChange={e => set('lightBrand', e.target.value)}
            placeholder="e.g. Mars Hydro, AC Infinity..."
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
          <div style={S.label}>Growing Medium</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['living_soil', 'coco', 'hydro'] as Setup['medium'][]).map(m => (
              <button key={m} onClick={() => set('medium', m)} style={S.btn(setup.medium === m)}>
                {m === 'living_soil' ? 'Living Soil' : m === 'coco' ? 'Coco Coir' : 'Hydroponics'}
              </button>
            ))}
          </div>

          <div style={S.label}>Container Size</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['small', 'medium', 'large'] as Setup['potSize'][]).map(p => (
              <button key={p} onClick={() => set('potSize', p)} style={S.btn(setup.potSize === p)}>
                {p === 'small' ? 'Small (3-5L)' : p === 'medium' ? 'Medium (10-15L)' : 'Large (20-30L)'}
              </button>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.6 }}>
            {setup.medium === 'living_soil' && <span style={{ color: '#4a6066' }}>Rich microbial life supports self-sustaining nutrition. Organic nutrients only. Blumat or manual watering.</span>}
            {setup.medium === 'coco'        && <span style={{ color: '#f0a830' }}>⚠️ Coco is inert — mineral nutrients required at every watering. Organic nutrients will not work.</span>}
            {setup.medium === 'hydro'       && <span style={{ color: '#f0a830' }}>⚠️ Hydro requires recirculating mineral feed. EC and pH monitoring critical.</span>}
          </div>
        </div>
      )}

      {/* ── Step 5: Watering + Nutrients ── */}
      {step === 5 && (
        <div style={S.card}>
          <div style={S.label}>Watering Method</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['manual', 'blumat', 'drip'] as Setup['watering'][]).map(w => {
              const disabled = !rules.allowedWatering.includes(w)
              return (
                <button key={w} onClick={() => !disabled && set('watering', w)} style={S.btn(setup.watering === w, disabled)}
                  title={disabled ? rules.disabledWatering : undefined}>
                  {w === 'manual' ? 'Manual' : w === 'blumat' ? 'Blumat Auto' : 'Drip Timer'}
                </button>
              )
            })}
          </div>

          <div style={S.label}>Nutrients</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['organic', 'mineral', 'none'] as Setup['nutrients'][]).map(n => {
              const disabled = !rules.allowedNutrients.includes(n)
              return (
                <button key={n} onClick={() => !disabled && set('nutrients', n)} style={S.btn(setup.nutrients === n, disabled)}
                  title={disabled ? rules.disabledNutrients : undefined}>
                  {n === 'organic' ? 'Organic' : n === 'mineral' ? 'Mineral' : 'None'}
                </button>
              )
            })}
          </div>

          {rules.disabledNutrients && (
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.6 }}>
              ℹ️ {rules.disabledNutrients}
            </div>
          )}
        </div>
      )}

      {/* ── Step 6: Accessories ── */}
      {step === 6 && (
        <div style={S.card}>
          <div style={S.label}>Ventilation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={setup.hasExhaustFan} onChange={e => set('hasExhaustFan', e.target.checked)} />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>Exhaust fan</span>
            </label>
            {setup.hasExhaustFan && (
              <div style={{ marginLeft: '28px' }}>
                <div style={S.label}>CFM Rating</div>
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
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>Circulation fan</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={setup.hasCarbonFilter} onChange={e => set('hasCarbonFilter', e.target.checked)} />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>Carbon filter</span>
            </label>
          </div>

          <div style={S.label}>Monitoring</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'hasPHMeter',    label: 'pH meter' },
              { key: 'hasECMeter',    label: 'EC/TDS meter' },
              { key: 'hasHygrometer', label: 'Thermohygrometer' },
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
          <div style={S.label}>Review Setup</div>

          {/* Strain summary */}
          <div style={{ background: 'rgba(204,0,170,0.07)', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px' }}>
            <div style={{ ...S.label, marginBottom: '4px' }}>Strain</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef', fontWeight: 500 }}>
              {isCustom ? customStrain.name : selectedStrain?.name ?? '—'}
              {isCustom && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', marginLeft: '10px' }}>custom · 5 💎</span>}
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
              ['Tent',      setup.tentSize],
              ['Light',     `${setup.lightWatts}W ${setup.lightType.toUpperCase()}`],
              ['Medium',    setup.medium.replace('_', ' ')],
              ['Container', setup.potSize],
              ['Watering',  setup.watering],
              ['Nutrients', setup.nutrients],
              ['Exhaust',   setup.hasExhaustFan ? `${setup.exhaustCFM} CFM` : 'None'],
              ['Circ. fan', setup.hasCirculationFan ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ ...S.label, marginBottom: '2px' }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{v}</div>
              </div>
            ))}
          </div>

          {(() => {
            const tier = getTier(dayDurationSeconds)
            const info = TIER_INFO[tier]
            const flowerDays = isCustom ? customStrain.floweringTime : (selectedStrain?.floweringTime ?? 63)
            return (
              <div style={{ background: `${info.color}10`, border: `0.5px solid ${info.color}40`, borderRadius: '4px', padding: '12px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: info.color, marginBottom: '4px' }}>
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
            {pending ? 'Starting...' : '🌱 Plant Seed'}
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
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => {
              if (step === 1 && !strainReady) {
                if (isCustom) setNameError(true)
                toast.error('Select a strain to continue')
                return
              }
              setStep(s => s + 1)
            }}
            style={S.btn(true)}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Loading...</div>}>
      <SetupWizardInner />
    </Suspense>
  )
}
