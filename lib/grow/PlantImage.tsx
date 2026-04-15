'use client'

import React, { useEffect, useState } from 'react'

// ── Frame mapping ──────────────────────────────────────────────────────────────

const PLANT_FRAMES = {
  day3_seedling: '/grow/plant/healthy/plant-day3-seedling.png',
  day7_seedling: '/grow/plant/healthy/plant-day7-seedling.png',
  early_veg:     '/grow/plant/healthy/plant-early-veg.png',
  mid_veg:       '/grow/plant/healthy/plant-mid-veg.png',
  late_veg:      '/grow/plant/healthy/plant-late-veg.png',
  // early_flower uses mid_flower until a dedicated frame is added
  early_flower:  '/grow/plant/healthy/plant-mid-flower.png',
  mid_flower:    '/grow/plant/healthy/plant-mid-flower.png',
  late_flower:   '/grow/plant/healthy/plant-late-flower.png',
  harvest:       '/grow/plant/healthy/plant-harvest.png',
} as const

type FrameKey = keyof typeof PLANT_FRAMES

function getPlantFrame(day: number, stage: string): FrameKey {
  if (day <= 3) return 'day3_seedling'
  if (day <= 7) return 'day7_seedling'
  if (stage === 'seedling') return 'day7_seedling'
  if (stage === 'veg') {
    if (day <= 21) return 'early_veg'
    if (day <= 28) return 'mid_veg'
    return 'late_veg'
  }
  if (stage === 'flower') {
    if (day <= 14) return 'early_flower'
    if (day <= 35) return 'mid_flower'
    return 'late_flower'
  }
  if (stage === 'late_flower') return 'late_flower'
  if (stage === 'harvest') return 'harvest'
  return 'day3_seedling'
}

// ── Tent size → plant scale factor ────────────────────────────────────────────

const TENT_SCALE: Record<string, number> = {
  '60x60':   0.7,
  '80x80':   0.85,
  '100x100': 1.0,
  '120x120': 1.1,
  '150x150': 1.2,
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlantTechniques {
  lstApplied:       boolean
  toppingApplied:   boolean
  defoliationCount: number
  lollipopApplied:  boolean
}

export interface PlantImageProps {
  day:            number
  stage:          string
  health:         number
  strainType:     'indica' | 'sativa' | 'hybrid'
  potCount?:      number
  techniques?:    PlantTechniques
  containerWidth?: number
  tentSize?:      string
}

// ── Keyframe styles injected once ─────────────────────────────────────────────

const KEYFRAMES = `
@keyframes pi-breathe {
  0%, 100% { transform: var(--pi-base-transform) scale(1); }
  50%       { transform: var(--pi-base-transform) scale(1.025); }
}
@keyframes pi-wilt {
  0%, 100% { transform: var(--pi-base-transform) rotate(0deg); }
  25%      { transform: var(--pi-base-transform) rotate(-3deg); }
  75%      { transform: var(--pi-base-transform) rotate(2deg); }
}
@keyframes pi-harvest-pulse {
  0%, 100% { filter: var(--pi-health-filter) drop-shadow(0 0 15px #f0a830) drop-shadow(0 0 30px rgba(240,168,48,0.4)); }
  50%      { filter: var(--pi-health-filter) drop-shadow(0 0 35px #f0a830) drop-shadow(0 0 60px rgba(240,168,48,0.3)); }
}
@keyframes pi-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pi-shimmer-float {
  0%   { transform: translateY(0)   scale(1);   opacity: 0.9; }
  50%  { transform: translateY(-18px) scale(1.3); opacity: 0.5; }
  100% { transform: translateY(-36px) scale(0.8); opacity: 0; }
}
`

let keyframesInjected = false

function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.textContent = KEYFRAMES
  document.head.appendChild(el)
  keyframesInjected = true
}

// ── Health filter ──────────────────────────────────────────────────────────────

function getHealthFilter(health: number, isHarvest: boolean): string {
  if (isHarvest) return 'none' // harvest pulse handles filter via CSS var
  if (health >= 70) return 'none'
  if (health >= 40) return 'saturate(0.5) brightness(0.85) hue-rotate(15deg)'
  if (health >= 20) return 'saturate(0.2) brightness(0.7) sepia(0.3) hue-rotate(20deg)'
  return 'saturate(0) brightness(0.5) sepia(0.6)'
}

// ── Health scale modifier ──────────────────────────────────────────────────────

function getHealthScale(health: number): number {
  if (health >= 80) return 1.0
  if (health >= 50) return 0.9
  if (health >= 20) return 0.75
  return 0.6
}

// ── Animation ─────────────────────────────────────────────────────────────────

function getAnimation(health: number, stage: string): string {
  if (stage === 'harvest') return 'pi-harvest-pulse 2s ease-in-out infinite'
  if (health < 30)         return 'pi-wilt 6s ease-in-out infinite'
  if (health > 60)         return 'pi-breathe 4s ease-in-out infinite'
  return 'none'
}

// ── Harvest shimmer particles ──────────────────────────────────────────────────

function HarvestShimmer() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id:    i,
    left:  10 + Math.random() * 80,
    top:   15 + Math.random() * 65,
    size:  2 + Math.random() * 2,
    delay: Math.random() * 3,
    dur:   2 + Math.random() * 2,
  }))

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position:         'absolute',
            left:             `${p.left}%`,
            top:              `${p.top}%`,
            width:            `${p.size}px`,
            height:           `${p.size}px`,
            borderRadius:     '50%',
            background:       '#f0a830',
            boxShadow:        '0 0 4px #f0a830',
            pointerEvents:    'none',
            animation:        `pi-shimmer-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

// ── Single plant ──────────────────────────────────────────────────────────────

interface SinglePlantProps {
  day:            number
  stage:          string
  health:         number
  strainType:     'indica' | 'sativa' | 'hybrid'
  techniques:     PlantTechniques
  width:          number   // px
  height:         number   // px
  heightScale?:   number   // 0–1, for multi-pot height variation
}

function SinglePlant({ day, stage, health, strainType, techniques, width, height, heightScale = 1 }: SinglePlantProps) {
  const frame = getPlantFrame(day, stage)
  const isHarvest = stage === 'harvest'

  // Strain size transform
  const strainTransform =
    strainType === 'indica'  ? 'scaleX(1.2) scaleY(0.9)' :
    strainType === 'sativa'  ? 'scaleX(0.85) scaleY(1.15)' :
    ''

  // LST: wider, flatter canopy
  const lstTransform = techniques.lstApplied ? 'scaleX(1.3) scaleY(0.85)' : ''

  // Combine non-animation transforms
  const baseTransform = [strainTransform, lstTransform].filter(Boolean).join(' ') || 'none'

  const healthFilter = getHealthFilter(health, isHarvest)
  const animation    = getAnimation(health, stage)

  // For harvest pulse the filter is set via CSS custom property
  const cssVars: React.CSSProperties = isHarvest
    ? ({ '--pi-health-filter': healthFilter, '--pi-base-transform': baseTransform } as React.CSSProperties)
    : ({ '--pi-base-transform': baseTransform } as React.CSSProperties)

  const imgStyle: React.CSSProperties = {
    width:           '100%',
    height:          '100%',
    objectFit:       'contain',
    objectPosition:  'bottom center',
    mixBlendMode:    'screen',
    filter:          isHarvest ? undefined : (healthFilter !== 'none' ? healthFilter : undefined),
    transform:       baseTransform !== 'none' ? baseTransform : undefined,
    transformOrigin: 'bottom center',
    animation,
    ...cssVars,
  }

  const actualHeight = Math.round(height * heightScale)

  // Topping: render two smaller sub-plants side by side
  if (techniques.toppingApplied) {
    const subW = Math.round(width * 0.7)
    const subH = Math.round(actualHeight * 0.7)
    const gap  = Math.round(width * 0.08)

    return (
      <div style={{ position: 'relative', width, height: actualHeight, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap }}>
        {[0, 1].map(i => (
          <div key={i} style={{ position: 'relative', width: subW, height: subH, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={frame}
              src={PLANT_FRAMES[frame]}
              alt={`Cannabis plant ${i + 1}`}
              style={{ ...imgStyle, animation: `pi-fade-in 1.5s ease forwards, ${animation !== 'none' ? animation : ''}`.replace(/, $/, '') }}
            />
          </div>
        ))}
        {isHarvest && <HarvestShimmer />}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width, height: actualHeight }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={frame}
        src={PLANT_FRAMES[frame]}
        alt="Cannabis plant"
        style={{
          ...imgStyle,
          animation: [`pi-fade-in 1.5s ease forwards`, animation !== 'none' ? animation : ''].filter(Boolean).join(', '),
        }}
      />

      {/* Lollipop overlay — darkens bottom 35% */}
      {techniques.lollipopApplied && (
        <div
          style={{
            position:      'absolute',
            inset:         0,
            pointerEvents: 'none',
            background:    'linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.7) 20%, transparent 40%)',
            transition:    'opacity 2s ease',
          }}
        />
      )}

      {/* Harvest shimmer particles */}
      {isHarvest && <HarvestShimmer />}
    </div>
  )
}

// ── PlantImage — main export ───────────────────────────────────────────────────

const DEFAULT_TECHNIQUES: PlantTechniques = {
  lstApplied: false, toppingApplied: false,
  defoliationCount: 0, lollipopApplied: false,
}

// Per-pot layout configs: [widthFraction, heightScale]
const POT_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[0.35, 1.00]],
  2: [[0.26, 1.00], [0.26, 0.93]],
  3: [[0.20, 1.00], [0.20, 0.90], [0.20, 0.95]],
  4: [[0.17, 1.00], [0.17, 0.88], [0.17, 0.95], [0.17, 0.91]],
}

export default function PlantImage({
  day,
  stage,
  health,
  strainType,
  potCount     = 1,
  techniques   = DEFAULT_TECHNIQUES,
  containerWidth = 160,
  tentSize,
}: PlantImageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    injectKeyframes()
    setMounted(true)
  }, [])

  if (!mounted) return null

  const clampedCount = Math.min(4, Math.max(1, potCount)) as 1 | 2 | 3 | 4
  const layout = POT_LAYOUTS[clampedCount]

  // Tent size multiplier on base plant width
  const tentMult = tentSize ? (TENT_SCALE[tentSize] ?? 1.0) : 1.0

  // Health-based overall scale
  const healthScale = getHealthScale(health)

  // Container height = roughly 1.6× container width (plant area)
  const containerH = Math.round(containerWidth * 1.6)

  // Gap between plants
  const gap = Math.round(containerWidth * 0.04)

  // Seedling scale — small plants look proportionally tiny
  const seedlingScale = day <= 3 ? 0.45 : day <= 7 ? 0.65 : 1.0

  return (
    <div style={{
      position:       'relative',
      width:          containerWidth,
      height:         containerH,
      display:        'flex',
      alignItems:     'flex-end',
      justifyContent: 'center',
      gap,
    }}>
      {layout.map(([widthFrac, hScale], i) => {
        const plantW = Math.round(containerWidth * widthFrac * tentMult * healthScale * seedlingScale)
        const plantH = Math.round(containerH * 0.92 * tentMult * healthScale * seedlingScale)

        return (
          <SinglePlant
            key={i}
            day={day}
            stage={stage}
            health={health}
            strainType={strainType}
            techniques={techniques}
            width={plantW}
            height={plantH}
            heightScale={hScale}
          />
        )
      })}
    </div>
  )
}
