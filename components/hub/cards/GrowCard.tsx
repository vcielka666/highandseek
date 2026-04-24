'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  xpEarned?:          number
  setup:              { tentSize: string; lightType: string; lightWatts: number; medium: string }
  warnings:           Array<{ attribute: string; message: string; severity: string; resolvedAt?: string | null }>
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
    // failed state labels (from t.growUI)
    growFailedTitle?:     string
    growAbandonedTitle?:  string
    growFailedSub?:       string
    growAbandonedSub?:    string
    growEndDayLabel?:     string
    growEndDaySuffix?:    string
    growEndXpLabel?:      string
    growEndHealthLabel?:  string
    growEndWhyTitle?:     string
    growEndNoWarnings?:   string
    growEndStartNew?:     string
    growEndOkBtn?:        string
    growHistoryTitle?:    string
    growHistoryEmpty?:    string
    growHistoryBack?:     string
    growHistoryStatus?:   Record<string, string>
    growHistoryDay?:      string
    growHistoryYield?:    string
    growHistoryXp?:       string
  }
  onAcknowledge?: () => void
}

const STAGE_FRAMES: Record<string, string> = {
  seedling:     '/grow/plant/healthy/plant-day7-seedling.png',
  veg:          '/grow/plant/healthy/plant-mid-veg.png',
  flower:       '/grow/plant/healthy/plant-mid-flower.png',
  late_flower:  '/grow/plant/healthy/plant-late-flower.png',
  harvest:      '/grow/plant/healthy/plant-harvest.png',
  complete:     '/grow/plant/healthy/plant-harvest.png',
  failed:       '/grow/plant/healthy/plant-day7-seedling.png',
}

// ── Story block ───────────────────────────────────────────────────────────────

function StoryBlock({ originLabel, story1, story2, story3 }: { originLabel: string; story1: string; story2: string; story3: string }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.4)', marginBottom: '6px' }}>
        {originLabel}
      </div>
      {[story1, story2, story3].map((s, i) => (
        <p key={i} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.75, color: i === 2 ? 'rgba(232,240,239,0.7)' : 'rgba(232,240,239,0.45)', margin: '0 0 10px' }}>{s}</p>
      ))}
    </div>
  )
}

// ── Preview states ────────────────────────────────────────────────────────────

function PreviewNoGrow({ labels }: { labels: Props['labels'] }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background plant silhouette */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/grow/plant/healthy/plant-mid-veg.png"
        alt=""
        aria-hidden
        style={{
          position: 'absolute', bottom: 0, right: '-10px',
          height: '85%', width: 'auto', objectFit: 'contain',
          objectPosition: 'bottom right',
          mixBlendMode: 'screen',
          opacity: 0.12,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Header */}
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)', marginBottom: '10px' }}>
        {labels.growSim}
      </div>

      {/* Title */}
      <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '22px', color: '#e8f0ef', letterSpacing: '1px', marginBottom: '6px', lineHeight: 1.1 }}>
        Sadam&apos;s Farm
      </div>

      {/* Story teaser */}
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.45)', lineHeight: 1.65, flex: 1 }}>
        {labels.story1.length > 100 ? labels.story1.slice(0, 100) + '…' : labels.story1}
      </div>

      {/* CTA */}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4c8', boxShadow: '0 0 6px #00d4c8' }} />
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', letterSpacing: '1px' }}>
          {labels.startSetup}
        </span>
      </div>
    </div>
  )
}

function PreviewFailed({ grow, labels }: { grow: GrowCardData; labels: Props['labels'] }) {
  const isFailed = grow.status === 'failed'
  const lastWarning = [...(grow.warnings ?? [])]
    .filter(w => !w.resolvedAt)
    .slice(-1)[0]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background dead plant */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STAGE_FRAMES[grow.stage] ?? STAGE_FRAMES.failed}
        alt=""
        aria-hidden
        style={{
          position: 'absolute', bottom: 0, right: '-4px',
          height: '80%', width: 'auto', objectFit: 'contain',
          objectPosition: 'bottom right',
          mixBlendMode: 'screen',
          opacity: 0.15,
          filter: 'saturate(0)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.4)' }}>
          {labels.growSim}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', color: isFailed ? '#e03535' : '#4a6066', background: isFailed ? 'rgba(224,53,53,0.1)' : 'rgba(74,96,102,0.1)', padding: '2px 7px', borderRadius: '3px' }}>
          {isFailed ? (labels.growFailedTitle ?? 'FAILED') : (labels.growAbandonedTitle ?? 'ABANDONED')}
        </div>
      </div>

      {/* Strain name */}
      <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '18px', color: 'rgba(232,240,239,0.6)', letterSpacing: '1px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {grow.strainName}
      </div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        {labels.day} {grow.currentDay} · {grow.stage.replace('_', ' ')}
      </div>

      {/* Last warning */}
      {lastWarning && (
        <div style={{ background: 'rgba(224,53,53,0.06)', border: '0.5px solid rgba(224,53,53,0.2)', borderRadius: '4px', padding: '8px 10px', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#e03535', marginBottom: '2px', letterSpacing: '0.5px' }}>
            ⚠ {lastWarning.attribute}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.5)', lineHeight: 1.4 }}>
            {lastWarning.message.length > 70 ? lastWarning.message.slice(0, 70) + '…' : lastWarning.message}
          </div>
        </div>
      )}

      {/* Health bar */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>{labels.health}</span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', color: '#e03535', fontWeight: 700 }}>{grow.health}%</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(74,96,102,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${grow.health}%`, background: '#e03535', borderRadius: '2px' }} />
        </div>
      </div>
    </div>
  )
}

function PreviewActive({ grow, labels }: { grow: GrowCardData; labels: Props['labels'] }) {
  const healthColor = grow.health > 60 ? '#56c254' : grow.health > 30 ? '#f0a830' : '#e03535'
  const frame = STAGE_FRAMES[grow.stage] ?? STAGE_FRAMES.veg

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)' }}>{labels.growSim}</div>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flex: 1 }}>
        <div style={{ flexShrink: 0, width: '64px', height: '80px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame} alt={grow.strainName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', mixBlendMode: 'screen', animation: 'pi-breathe 4s ease-in-out infinite' }} />
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

// ── History item type ─────────────────────────────────────────────────────────

interface HistoryGrow {
  _id: string
  strainName: string
  strainType: string
  stage: string
  currentDay: number
  health: number
  yieldProjection: number
  xpEarned: number
  status: string
  harvestData?: { gramsYield: number; qualityScore: number; creditsEarned: number }
  createdAt: string
}

// ── History row ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed: '#00d4c8',
  failed:    '#e03535',
  abandoned: '#4a6066',
}

function HistoryRow({ h, labels }: { h: HistoryGrow; labels: Props['labels'] }) {
  const statusColor = STATUS_COLORS[h.status] ?? '#4a6066'
  const statusLabel = (labels.growHistoryStatus ?? {})[h.status] ?? h.status
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${statusColor}22`, borderRadius: '8px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '15px', color: '#e8f0ef', letterSpacing: '0.5px' }}>{h.strainName}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: statusColor, background: `${statusColor}18`, padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.5px' }}>
          {statusLabel}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: labels.growHistoryDay ?? 'Day', value: String(h.currentDay) },
          { label: labels.growHistoryXp ?? 'XP', value: `${h.xpEarned ?? 0}` },
          ...(h.status === 'completed' && h.harvestData?.gramsYield
            ? [{ label: labels.growHistoryYield ?? 'Yield', value: `${h.harvestData.gramsYield}g` }]
            : []),
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Expanded failed state (with history slide) ────────────────────────────────

function ExpandedFailed({ grow, labels, onAcknowledge }: { grow: GrowCardData; labels: Props['labels']; onAcknowledge?: () => void }) {
  const router = useRouter()
  const isFailed = grow.status === 'failed'
  const unresolvedWarnings = (grow.warnings ?? []).filter(w => !w.resolvedAt)
  const displayWarnings = unresolvedWarnings.slice(-3)

  const [view, setView] = useState<'report' | 'history'>('report')
  const [sliding, setSliding] = useState(false)
  const [history, setHistory] = useState<HistoryGrow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [showAll, setShowAll] = useState(false)

  async function handleOk() {
    setSliding(true)
    setHistoryLoading(true)

    // acknowledge in parallel with fetching history
    const [, histRes] = await Promise.all([
      fetch('/api/hub/grow/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ growId: grow._id }),
      }),
      fetch('/api/hub/grow/history').then(r => r.json()),
    ])

    setHistory(histRes.grows ?? [])
    setHistoryLoading(false)
    setAcknowledged(true)

    // switch view mid-slide, then notify parent so overlay closes to clean card
    setTimeout(() => {
      setView('history')
      setSliding(false)
      onAcknowledge?.()
    }, 320)

    router.refresh()
  }

  return (
    <div style={{ overflow: 'hidden', height: '100%', position: 'relative' }}>
      {/* Sliding wrapper */}
      <div style={{
        display: 'flex',
        width: '200%',
        height: '100%',
        transform: view === 'history' ? 'translateX(-50%)' : 'translateX(0)',
        transition: sliding ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' : view === 'history' ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}>

        {/* ── Panel 1: Report ── */}
        <div style={{ width: '50%', flexShrink: 0, overflowY: 'auto', padding: '28px 28px 48px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px' }}>{isFailed ? '💀' : '🚪'}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '24px', color: isFailed ? '#e03535' : '#4a6066', letterSpacing: '1px', marginBottom: '2px' }}>
                {isFailed ? (labels.growFailedTitle ?? 'Grow Failed') : (labels.growAbandonedTitle ?? 'Grow Abandoned')}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                {grow.strainName} · {isFailed ? (labels.growFailedSub ?? "Plant didn't make it.") : (labels.growAbandonedSub ?? 'Grow was abandoned.')}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: labels.growEndDayLabel ?? 'Survived', value: `${grow.currentDay}`, suffix: labels.growEndDaySuffix ?? 'days' },
              { label: labels.growEndXpLabel ?? 'XP Earned', value: `${grow.xpEarned ?? 0}`, suffix: 'xp' },
              { label: labels.growEndHealthLabel ?? 'Final Health', value: `${grow.health}`, suffix: '%' },
            ].map(({ label, value, suffix }) => (
              <div key={label} style={{ background: 'rgba(224,53,53,0.05)', border: '0.5px solid rgba(224,53,53,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: '#e8f0ef' }}>{value}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{suffix}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* What went wrong */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(224,53,53,0.5)', marginBottom: '12px' }}>
              {labels.growEndWhyTitle ?? 'What went wrong'}
            </div>
            {displayWarnings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayWarnings.map((w, i) => (
                  <div key={i} style={{ background: 'rgba(224,53,53,0.06)', border: '0.5px solid rgba(224,53,53,0.2)', borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#e03535', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{w.attribute}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.65)', lineHeight: 1.5 }}>{w.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
                {labels.growEndNoWarnings ?? 'Multiple critical issues led to plant death.'}
              </div>
            )}
          </div>

          {/* Setup recap */}
          <div style={{ background: 'rgba(74,96,102,0.06)', border: '0.5px solid rgba(74,96,102,0.2)', borderRadius: '6px', padding: '12px 14px', marginBottom: '28px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Setup</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.5)' }}>
              {grow.setup.tentSize} · {grow.setup.lightWatts}W {grow.setup.lightType.toUpperCase()} · {grow.setup.medium.replace('_', ' ')} · Day {grow.currentDay}
            </div>
          </div>

          {/* OK button */}
          <button
            onClick={handleOk}
            disabled={acknowledged}
            style={{ fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '12px 28px', border: 'none', cursor: 'pointer' }}
          >
            {labels.growEndOkBtn ?? 'OK, Got It →'}
          </button>
        </div>

        {/* ── Panel 2: History ── */}
        <div style={{ width: '50%', flexShrink: 0, overflowY: 'auto', padding: '28px 28px 48px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)' }}>
              {labels.growSim}
            </div>
            <div style={{ height: '1px', flex: 1, background: 'rgba(74,96,102,0.2)' }} />
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '18px', color: '#e8f0ef', letterSpacing: '1px' }}>
              {labels.growHistoryTitle ?? 'Grow History'}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: labels.growsCompletedLabel ?? 'Grows', value: String(history.length) },
              { label: labels.xpFromGrowsLabel ?? 'Total XP', value: `${history.reduce((s, h) => s + (h.xpEarned ?? 0), 0)}` },
              { label: labels.creditsEarnedLabel ?? 'Credits', value: `${history.filter(h => h.status === 'completed').reduce((s, h) => s + (h.harvestData?.creditsEarned ?? 0), 0)} 💎` },
            ].map(({ label: statLabel, value }) => (
              <div key={statLabel} style={{ background: 'rgba(0,212,200,0.04)', border: '0.5px solid rgba(0,212,200,0.1)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#00d4c8', marginBottom: '3px' }}>{value}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{statLabel}</div>
              </div>
            ))}
          </div>

          {historyLoading ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>…</div>
          ) : history.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
              {labels.growHistoryEmpty ?? 'No previous grows yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* First 3 — always visible */}
              {history.slice(0, 3).map(h => <HistoryRow key={String(h._id)} h={h} labels={labels} />)}

              {/* Remaining items — max-height animated */}
              {history.length > 3 && (
                <>
                  <div style={{
                    overflow: 'hidden',
                    maxHeight: showAll ? `${(history.length - 3) * 100}px` : '0px',
                    transition: 'max-height 0.55s cubic-bezier(0.4,0,0.2,1)',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    {history.slice(3).map(h => <HistoryRow key={String(h._id)} h={h} labels={labels} />)}
                  </div>

                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{
                      fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
                      color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(74,96,102,0.3)',
                      borderRadius: '4px', padding: '8px 0', cursor: 'pointer', width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8f0ef'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(74,96,102,0.6)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4a6066'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(74,96,102,0.3)' }}
                  >
                    {showAll ? '▲ show less' : `··· ${history.length - 3} more`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Start new grow CTA (only in history panel) */}
          <div style={{ marginTop: '28px' }}>
            <a href="/hub/grow/setup" style={{ display: 'inline-block', fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#cc00aa', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }}>
              {labels.growEndStartNew ?? '↺ Start New Grow'}
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GrowCard({ grow, strains = [], expanded = false, growsCompleted = 0, userXP = 0, userCredits = 0, cloneBank = [], labels, onAcknowledge }: Props) {
  const typeLabel: Record<string, string> = { indica: labels.indica, sativa: labels.sativa, hybrid: labels.hybrid }
  const isFailed = grow?.status === 'failed' || grow?.status === 'abandoned'

  // ── Preview ──────────────────────────────────────────────────────────────────
  if (!expanded) {
    if (!grow) return <PreviewNoGrow labels={labels} />
    if (isFailed) return <PreviewFailed grow={grow} labels={labels} />
    return <PreviewActive grow={grow} labels={labels} />
  }

  // ── Expanded: failed ─────────────────────────────────────────────────────────
  if (isFailed) {
    return <ExpandedFailed grow={grow} labels={labels} onAcknowledge={onAcknowledge} />
  }

  // ── Expanded: no grow ────────────────────────────────────────────────────────
  const l = labels
  if (!grow) {
    return (
      <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)', marginBottom: '10px' }}>{l.growSim}</div>

        <StoryBlock originLabel={l.originLabel} story1={l.story1} story2={l.story2} story3={l.story3} />

        <div style={{ background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '8px', padding: '20px', marginBottom: '28px' }}>
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

        {/* Clone bank */}
        {cloneBank.length > 0 && (
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
        {strains.length > 0 && (
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

  // ── Expanded: active grow ────────────────────────────────────────────────────
  const healthColor = grow.health > 60 ? '#56c254' : grow.health > 30 ? '#f0a830' : '#e03535'
  const frame = STAGE_FRAMES[grow.stage] ?? STAGE_FRAMES.veg

  return (
    <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)', marginBottom: '10px' }}>{l.growSim}</div>

      <StoryBlock originLabel={l.originLabel} story1={l.story1} story2={l.story2} story3={l.story3} />

      {/* Active grow panel */}
      <div style={{ background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.5)', marginBottom: '14px' }}>
          Active Grow
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div style={{ width: '80px', height: '100px', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame} alt={grow.strainName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', mixBlendMode: 'screen' }} />
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={`/hub/grow/${grow._id}`} style={{ flex: 1, fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '0.5px', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '9px 12px', textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {l.viewGrow}
          </a>
          <a href={`/hub/grow/${grow._id}/journal/new`} style={{ flex: 1, fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '0.5px', color: '#00d4c8', background: 'transparent', border: '0.5px solid rgba(0,212,200,0.4)', borderRadius: '4px', padding: '9px 12px', textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {l.addJournal ?? '+ Journal'}
          </a>
        </div>
      </div>
    </div>
  )
}
