'use client'

import React, { useEffect } from 'react'

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
  potSize?:       'small' | 'medium' | 'large'
  techniques?:    PlantTechniques
  containerWidth?: number
  tentSize?:      string
}

const POT_IMGS: Record<'small' | 'medium' | 'large', string> = {
  small:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046945/pot-small_lr05r7.png',
  medium: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046946/pot-medium_cmrorl.png',
  large:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046949/pot-large_upcfrg.png',
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

// ── Perspective layout definitions ────────────────────────────────────────────

interface PlantSlot {
  xFrac:       number   // center X as fraction of containerWidth
  bottomFrac:  number   // CSS bottom as fraction of containerH (0 = at container bottom)
  scale:       number   // size multiplier relative to base
  brightness:  number   // depth dimming (1 = full, 0.6 = 40% darker)
  zIndex:      number
}

const FLAT_SLOT: PlantSlot = { xFrac: 0.5, bottomFrac: 0, scale: 1.0, brightness: 1.0, zIndex: 1 }
const BACK_SLOT: PlantSlot = { xFrac: 0.5, bottomFrac: 0.05, scale: 0.84, brightness: 0.82, zIndex: 1 }
const FRONT_SLOT: PlantSlot = { xFrac: 0.5, bottomFrac: 0.00, scale: 1.00, brightness: 1.0, zIndex: 3 }

const PERSPECTIVE_LAYOUTS: Record<1|2|3|4, PlantSlot[]> = {
  1: [{ xFrac: 0.50, bottomFrac: 0.00, scale: 1.00, brightness: 1.0, zIndex: 1 }],
  2: [FLAT_SLOT, FLAT_SLOT],
  // 1 back + 2 front
  3: [BACK_SLOT, FRONT_SLOT, FRONT_SLOT],
  // 2 back + 2 front
  4: [BACK_SLOT, BACK_SLOT, FRONT_SLOT, FRONT_SLOT],
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

// Base plant width fraction per count (before slot.scale is applied)
const BASE_FRACS: Record<1|2|3|4, number> = { 1: 0.35, 2: 0.28, 3: 0.26, 4: 0.26 }

export default function PlantImage({
  day,
  stage,
  health,
  strainType,
  potCount     = 1,
  potSize      = 'medium',
  techniques   = DEFAULT_TECHNIQUES,
  containerWidth = 160,
  tentSize,
}: PlantImageProps) {
  useEffect(() => { injectKeyframes() }, [])

  const clampedCount = Math.min(4, Math.max(1, potCount)) as 1 | 2 | 3 | 4
  const slots        = PERSPECTIVE_LAYOUTS[clampedCount]
  const baseFrac     = BASE_FRACS[clampedCount]

  // Tent size multiplier
  const tentMult     = tentSize ? (TENT_SCALE[tentSize] ?? 1.0) : 1.0
  // Health-based overall scale
  const healthScale  = getHealthScale(health)
  // Seedling scale
  const seedlingScale = day <= 3 ? 0.45 : day <= 7 ? 0.65 : 1.0

  // Container dimensions
  const containerH = Math.round(containerWidth * 1.6)

  // Base plant dimensions (before per-slot scale)
  const basePlantW = containerWidth  * baseFrac * tentMult * healthScale * seedlingScale
  const basePlantH = containerH * 0.88 * tentMult * healthScale * seedlingScale

  const potImg = POT_IMGS[potSize]
  // Base pot width
  const basePotW = Math.round(containerWidth * (clampedCount === 1 ? 0.68 : 0.54))

  return (
    <div style={{ position: 'relative', width: containerWidth, height: containerH }}>
      {slots.map((slot, i) => {
        const plantW     = Math.round(basePlantW * slot.scale)
        const plantH     = Math.round(basePlantH * slot.scale)
        const floorY     = Math.round(containerH * slot.bottomFrac)
        const depthScale = slot.bottomFrac > 0 ? 0.88 : 1.0
        const potW       = Math.round(basePotW * depthScale)
        const potH       = Math.round(potW * 0.85)
        // Plant raised so its stem base sits at pot's soil surface (~62% up the pot) + 12px lift
        const plantBottom = floorY + Math.round(potH * 0.62) + 12
        const potCssLeft  = Math.round(containerWidth * slot.xFrac - potW / 2)
        const plantCssLeft = Math.round(containerWidth * slot.xFrac - plantW / 2)
        const depthFilter  = slot.brightness < 1 ? `brightness(${slot.brightness})` : undefined

        return (
          <React.Fragment key={i}>
            {/* Pot — rendered first so plant overlaps it */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={potImg}
              alt="pot"
              style={{
                position:      'absolute',
                bottom:        floorY,
                left:          potCssLeft,
                width:         potW,
                height:        potH,
                objectFit:     'contain',
                pointerEvents: 'none',
                zIndex:        slot.zIndex,
                filter:        depthFilter,
              }}
            />
            {/* Plant — raised above pot so stem grows from soil surface */}
            <div
              style={{
                position: 'absolute',
                bottom:   plantBottom,
                left:     plantCssLeft,
                width:    plantW,
                height:   plantH,
                zIndex:   slot.zIndex + 1,
                filter:   depthFilter,
              }}
            >
              <SinglePlant
                day={day}
                stage={stage}
                health={health}
                strainType={strainType}
                techniques={techniques}
                width={plantW}
                height={plantH}
              />
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Native SVG version — avoids foreignObject (unreliable in production) ─────

export interface PlantSVGLayerProps {
  foX:        number
  containerW: number
  isLight:    boolean
  day:        number
  stage:      string
  health:     number
  strainType: 'indica' | 'sativa' | 'hybrid'
  potCount?:  number
  potSize?:   'small' | 'medium' | 'large'
  techniques?: PlantTechniques
  tentSize?:  string
}

const TENT_FLOOR_SVG = 640

// ── Multi-plant SVG layout ─────────────────────────────────────────────────────
// Absolute center-X per slot — back slots first, then front slots
const MULTI_SVG_CX: Partial<Record<number, number[]>> = {
  2: [340, 660],
  3: [500, 310, 690],          // [back-center, front-left, front-right]
  4: [425, 575, 345, 655],     // [back-left, back-right, front-left, front-right]
}

// Multi plants use the same reference width as a single plant (full size)
// MULTI_PLANT_FRAC / MULTI_POT_FRAC control proportions within that reference
const MULTI_PLANT_FRAC = 0.55 // plant width fraction of refW
const MULTI_POT_FRAC   = 0.68 // pot width fraction of refW

// Returns the SVG Y coordinate of the tallest plant's top edge (lowest Y value = highest up)
export function computePlantTopSVG(
  containerW: number,
  health: number,
  day: number,
  potCount: number,
  tentSize?: string,
): number {
  const clampedCount  = Math.min(4, Math.max(1, potCount)) as 1 | 2 | 3 | 4
  const slots         = PERSPECTIVE_LAYOUTS[clampedCount]
  const tentMult      = tentSize ? (TENT_SCALE[tentSize] ?? 1.0) : 1.0
  const healthScale   = getHealthScale(health)
  const seedlingScale = day <= 3 ? 0.45 : day <= 7 ? 0.65 : 1.0
  const containerH    = Math.round(containerW * 1.6)
  const basePlantH    = containerH * 0.88 * tentMult * healthScale * seedlingScale
  const basePotW      = Math.round(containerW * (clampedCount === 1 ? 0.68 : 0.54))

  let minTopY = TENT_FLOOR_SVG
  for (const slot of slots) {
    const plantH     = Math.round(basePlantH * slot.scale)
    const floorY     = Math.round(containerH * slot.bottomFrac)
    const depthScale = slot.bottomFrac > 0 ? 0.88 : 1.0
    const potW       = Math.round(basePotW * depthScale)
    const potH       = Math.round(potW * 0.85)
    const plantBot   = floorY + Math.round(potH * 0.62) + 12
    const topY       = TENT_FLOOR_SVG - plantBot - plantH
    if (topY < minTopY) minTopY = topY
  }
  return minTopY
}

export function PlantSVGLayer({
  foX, containerW, isLight,
  day, stage, health,
  potCount = 1, potSize = 'medium',
  tentSize,
}: PlantSVGLayerProps) {
  const clampedCount  = Math.min(4, Math.max(1, potCount)) as 1 | 2 | 3 | 4
  const slots         = PERSPECTIVE_LAYOUTS[clampedCount]
  const isMulti       = clampedCount > 1
  const tentMult      = tentSize ? (TENT_SCALE[tentSize] ?? 1.0) : 1.0
  const healthScale   = getHealthScale(health)
  const seedlingScale = day <= 3 ? 0.45 : day <= 7 ? 0.65 : 1.0
  const potImg        = POT_IMGS[potSize]
  const plantFrame    = PLANT_FRAMES[getPlantFrame(day, stage)]

  // Multi plants: use same reference width as single plant (full size)
  const refW = isMulti ? Math.min(264, Math.round(264 * tentMult)) : containerW
  const refH = Math.round(refW * 1.6)

  return (
    <g style={{ filter: isLight ? 'none' : 'brightness(0.12)', transition: 'filter 2s ease', pointerEvents: 'none' }}>
      {slots.map((slot, i) => {
        const depthScale   = slot.bottomFrac > 0 ? 0.88 : 1.0
        const seedlingShift = day <= 7 ? -15 : 0

        // ── Sizing ──
        const plantW = Math.round(
          (isMulti ? refW * MULTI_PLANT_FRAC : containerW * BASE_FRACS[clampedCount])
          * slot.scale * (isMulti ? 1 : tentMult) * healthScale * seedlingScale
        )
        const plantH = Math.round(refH * 0.88 * slot.scale * healthScale * seedlingScale)
        const potBaseW = isMulti ? refW * MULTI_POT_FRAC : containerW * (clampedCount === 1 ? 0.68 : 0.54)
        const potW = Math.round(potBaseW * depthScale * slot.scale)
        const potH = Math.round(potW * 0.85)

        // ── Y position ──
        const floorY      = Math.round(refH * slot.bottomFrac)
        const plantBottom = floorY + Math.round(potH * 0.62) + 20 + seedlingShift
        const potSVGY     = TENT_FLOOR_SVG - floorY - potH
        const plantSVGY   = TENT_FLOOR_SVG - plantBottom - plantH

        // ── X position: absolute SVG center for multi, containerW-relative for single ──
        const centerX  = isMulti
          ? (MULTI_SVG_CX[clampedCount]?.[i] ?? 500)
          : (foX + Math.round(containerW * slot.xFrac))
        const potSVGX   = centerX - Math.round(potW / 2)
        const plantSVGX = centerX - Math.round(plantW / 2)

        const depthFilter = slot.brightness < 1 ? `brightness(${slot.brightness})` : undefined

        return (
          <g key={i} style={{ filter: depthFilter }}>
            <image href={potImg}     x={potSVGX}   y={potSVGY}   width={potW}   height={potH}   preserveAspectRatio="xMidYMax meet" />
            <image href={plantFrame} x={plantSVGX} y={plantSVGY} width={plantW} height={plantH} preserveAspectRatio="xMidYMax meet" />
          </g>
        )
      })}
    </g>
  )
}
