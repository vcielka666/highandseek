'use client'

import { useState } from 'react'

export interface GrowCardData {
  _id:                string
  strainName:         string
  strainType:         string
  stage:              string
  currentDay:         number
  health:             number
  yieldProjection:    number
  dayDurationSeconds: number
  status:             string
  setup:              { tentSize: string; lightType: string; lightWatts: number; medium: string }
}

export interface StrainPickerItem {
  slug:         string
  name:         string
  type:         string
  floweringTime?: number
  difficulty?:  string
}

interface Props {
  grow:            GrowCardData | null
  strains?:        StrainPickerItem[]
  expanded?:       boolean
  growsCompleted?: number
  userXP?:         number
  userCredits?:    number
  cloneBank?:      Array<{ strainSlug: string; strainName: string; strainType: string; floweringTime: number; takenAt: string }>
  labels: {
    growSim:            string
    noActiveGrow:       string
    startGrow:          string
    viewGrow:           string
    openFull:           string
    day:                string
    health:             string
    yield:              string
    originLabel:        string
    story1:             string
    story2:             string
    story3:             string
    noActiveDesc:       string
    startSetup:         string
    availableStrains:   string
    indica:             string
    sativa:             string
    hybrid:             string
    // expanded-only
    growsCompletedLabel?: string
    xpFromGrowsLabel?:    string
    creditsEarnedLabel?:  string
    realtimeTitle?:       string
    realtimeDesc?:        string
    realtimeFree?:        string
    addJournal?:          string
    cloneBankTitle?:      string
    cloneFreeLabel?:      string
    cloneSkipVegLabel?:   string
  }
}

const STAGE_FRAMES: Record<string, string> = {
  seedling:     '/grow/plant/healthy/plant-day7-seedling.png',
  veg:          '/grow/plant/healthy/plant-mid-veg.png',
  flower:       '/grow/plant/healthy/plant-mid-flower.png',
  late_flower:  '/grow/plant/healthy/plant-late-flower.png',
  harvest:      '/grow/plant/healthy/plant-harvest.png',
  complete:     '/grow/plant/healthy/plant-harvest.png',
  failed:       '/grow/plant/healthy/plant-day3-seedling.png',
}

function StoryBlock({ originLabel, story1, story2, story3 }: { originLabel: string; story1: string; story2: string; story3: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.4)', marginBottom: '6px' }}>
        {originLabel}
      </div>
      <div style={{ overflow: 'hidden', maxHeight: open ? '400px' : '60px', transition: 'max-height 0.5s ease' }}>
        {[story1, story2, story3].map((s, i) => (
          <p key={i} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.75, color: i === 2 ? 'rgba(232,240,239,0.7)' : 'rgba(232,240,239,0.45)', margin: '0 0 10px' }}>{s}</p>
        ))}
      </div>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', marginTop: '4px', background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.3)', color: '#cc00aa', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px' }}>{open ? 'read less' : 'read more'}</span>
        <span style={{ fontSize: '11px', display: 'inline-block', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
    </div>
  )
}

export default function GrowCard({ grow, strains = [], expanded = false, growsCompleted = 0, userXP = 0, userCredits = 0, cloneBank = [], labels }: Props) {
  const healthColor = !grow || grow.status === 'failed'
    ? '#e03535'
    : grow.health > 60 ? '#56c254' : grow.health > 30 ? '#f0a830' : '#e03535'

  const frame = STAGE_FRAMES[grow?.stage ?? 'veg'] ?? STAGE_FRAMES.veg

  const typeLabel: Record<string, string> = { indica: labels.indica, sativa: labels.sativa, hybrid: labels.hybrid }

  if (!expanded) {
    if (!grow) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(0,212,200,0.08)', border: '1.5px dashed rgba(0,212,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#00d4c8' }}>+</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{labels.noActiveGrow}</div>
        </div>
      )
    }
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)' }}>{labels.growSim}</div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flex: 1 }}>
          <div style={{ flexShrink: 0, width: '64px', height: '80px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame} alt={grow.strainName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', mixBlendMode: 'screen', animation: grow.status === 'active' ? 'pi-breathe 4s ease-in-out infinite' : 'none', filter: grow.status === 'failed' ? 'saturate(0) brightness(0.5)' : 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '16px', color: '#e8f0ef', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grow.strainName}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '3px' }}>{labels.day} {grow.currentDay} · {grow.stage.replace('_', ' ')}</div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>{labels.health}</span>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', color: healthColor, fontWeight: 700 }}>{grow.health}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(74,96,102,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${grow.health}%`, background: healthColor, borderRadius: '2px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Expanded: mirrors /hub/grow layout ──────────────────────────────────────
  const l = labels
  return (
    <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)', marginBottom: '10px' }}>{l.growSim}</div>

      <StoryBlock originLabel={l.originLabel} story1={l.story1} story2={l.story2} story3={l.story3} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
        {[
          { label: l.growsCompletedLabel ?? 'Grows', value: String(growsCompleted) },
          { label: l.xpFromGrowsLabel   ?? 'XP',     value: `${userXP} xp` },
          { label: l.creditsEarnedLabel ?? 'Credits', value: `${userCredits} 💎` },
        ].map(({ label: statLabel, value }) => (
          <div key={statLabel} style={{ background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.12)', borderRadius: '6px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#cc00aa', marginBottom: '3px' }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{statLabel}</div>
          </div>
        ))}
      </div>

      {/* Active grow */}
      {grow ? (
        <div style={{ background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.5)', marginBottom: '14px' }}>
            Active Grow
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ width: '80px', height: '100px', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame} alt={grow.strainName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', mixBlendMode: 'screen', filter: grow.status === 'failed' ? 'saturate(0) brightness(0.5)' : 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '22px', color: '#e8f0ef', letterSpacing: '1px', marginBottom: '4px' }}>{grow.strainName}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                {l.day} {grow.currentDay} · {grow.stage.replace('_', ' ')}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>{l.health}</span>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: healthColor, fontWeight: 700 }}>{grow.health}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(74,96,102,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${grow.health}%`, background: healthColor, borderRadius: '2px' }} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '8px' }}>
                {grow.setup.tentSize} · {grow.setup.lightWatts}W {grow.setup.lightType.toUpperCase()} · {grow.setup.medium.replace('_', ' ')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href={grow.status === 'active' ? `/hub/grow/${grow._id}` : '/hub/grow/setup'} style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '9px 20px', textDecoration: 'none' }}>
              {grow.status === 'active' ? l.viewGrow : l.startGrow}
            </a>
            {grow.status === 'active' && (
              <a href={`/hub/grow/${grow._id}/journal/new`} style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', color: '#00d4c8', background: 'transparent', border: '0.5px solid rgba(0,212,200,0.4)', borderRadius: '4px', padding: '9px 20px', textDecoration: 'none' }}>
                {l.addJournal ?? '+ Journal Entry'}
              </a>
            )}
          </div>
        </div>
      ) : (
        /* No active grow — start new */
        <div style={{ marginBottom: '28px' }}>
          <div style={{ background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#00d4c8', marginBottom: '6px' }}>
              {l.realtimeTitle ?? '🌱 Virtual Grow Simulator'}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, marginBottom: '10px' }}>
              {l.realtimeDesc ?? l.noActiveDesc}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#00d4c8', marginBottom: '12px' }}>
              {l.realtimeFree ?? '✓ Always free'}
            </div>
            <a href="/hub/grow/setup" style={{ fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '8px 16px', textDecoration: 'none', display: 'inline-block' }}>
              {l.startSetup}
            </a>
          </div>
        </div>
      )}

      {/* Clone bank */}
      {!grow && cloneBank.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8', marginBottom: '12px' }}>
            {l.cloneBankTitle ?? 'Clone Bank'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {cloneBank.map((clone, idx) => (
              <a key={`${clone.strainSlug}-${idx}`} href={`/hub/grow/setup?clone=${clone.strainSlug}`} style={{ display: 'block', background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '8px', padding: '14px', textDecoration: 'none' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#00d4c8', letterSpacing: '1px', marginBottom: '4px' }}>
                  🌿 CLONE · {clone.strainType.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '15px', color: '#e8f0ef', marginBottom: '6px' }}>
                  {clone.strainName}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>
                  {clone.floweringTime}d flower · {l.cloneFreeLabel ?? 'Free'}
                </div>
                <div style={{ marginTop: '8px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'rgba(0,212,200,0.5)', background: 'rgba(0,212,200,0.06)', borderRadius: '3px', padding: '4px 7px', display: 'inline-block' }}>
                  {l.cloneSkipVegLabel ?? 'Skip veg'}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Strain picker */}
      {!grow && strains.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '12px' }}>{l.availableStrains}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {strains.map(s => (
              <a key={s.slug} href={`/hub/grow/setup?strain=${s.slug}`} style={{ background: 'rgba(13,0,20,0.6)', border: '0.5px solid rgba(204,0,170,0.12)', borderRadius: '8px', padding: '12px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', marginBottom: '4px' }}>{s.name}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  {typeLabel[s.type] ?? s.type}{s.floweringTime ? ` · ${s.floweringTime}d` : ''}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
