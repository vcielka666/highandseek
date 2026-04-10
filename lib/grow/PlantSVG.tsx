'use client'

/**
 * Procedural SVG plant — changes shape based on stage, strain type, health.
 * Sativa: tall/narrow, Indica: short/dense, Hybrid: mixed.
 */

import type { GrowStage } from './simulation'

interface PlantSVGProps {
  stage:      GrowStage
  strainType: 'indica' | 'sativa' | 'hybrid'
  health:     number  // 0-100
  day:        number
  lstApplied?: boolean
  defoApplied?: boolean
  size?:      number  // px
}

type Leaf = { x: number; y: number; angle: number; length: number }

function getPlantParams(stage: GrowStage, strainType: 'indica' | 'sativa' | 'hybrid', day: number) {
  const isIndica  = strainType === 'indica'
  const isSativa  = strainType === 'sativa'

  // height scale 0-1 based on stage
  const heightScale = (() => {
    if (stage === 'seedling')   return 0.12
    if (stage === 'veg')        return 0.15 + Math.min(0.35, (day - 8) / 27 * 0.35)
    if (stage === 'flower')     return isSativa ? 0.75 : isIndica ? 0.65 : 0.70
    if (stage === 'late_flower') return isSativa ? 0.80 : isIndica ? 0.68 : 0.74
    if (stage === 'harvest')    return isSativa ? 0.82 : isIndica ? 0.70 : 0.76
    return 0.10
  })()

  const stemHeight = 200 * heightScale    // px in 200-tall viewBox
  const leafCount  = (() => {
    if (stage === 'seedling')   return 1
    if (stage === 'veg')        return Math.min(6, 2 + Math.floor((day - 8) / 5))
    return isIndica ? 8 : isSativa ? 6 : 7
  })()

  const leafLength = isIndica ? 28 : isSativa ? 38 : 33
  const leafSpread = isIndica ? 55 : isSativa ? 35 : 45   // angle spread °

  return { stemHeight, leafCount, leafLength, leafSpread }
}

function buildLeaves(stemHeight: number, leafCount: number, leafLength: number, leafSpread: number, lstApplied: boolean, defoApplied: boolean): Leaf[] {
  const leaves: Leaf[] = []
  const bottom = 200          // stem base y
  const top    = bottom - stemHeight

  for (let i = 0; i < leafCount; i++) {
    const t      = leafCount <= 1 ? 0.5 : i / (leafCount - 1)
    const y      = bottom - stemHeight * (0.2 + t * 0.75)
    const side   = i % 2 === 0 ? -1 : 1
    const angle  = side * (leafSpread + (lstApplied ? 20 : 0))  // LST spreads
    const length = defoApplied && t > 0.4 ? leafLength * 0.4 : leafLength

    leaves.push({ x: 100, y, angle, length })
  }

  return leaves
}

function leafPath(l: Leaf): string {
  const rad  = (l.angle * Math.PI) / 180
  const tipX = l.x + Math.cos(rad) * l.length
  const tipY = l.y + Math.sin(rad) * l.length
  const midX = l.x + Math.cos(rad) * l.length * 0.5 - Math.sin(rad) * (l.length * 0.3)
  const midY = l.y + Math.sin(rad) * l.length * 0.5 + Math.cos(rad) * (l.length * 0.3)
  return `M ${l.x} ${l.y} Q ${midX} ${midY} ${tipX} ${tipY}`
}

function budPath(cx: number, cy: number, size: number): string {
  // Irregular bud shape using small circles
  return `M ${cx} ${cy - size}
    a ${size * 0.6} ${size * 0.6} 0 1 0 ${size * 1.2} 0
    a ${size * 0.6} ${size * 0.6} 0 1 0 ${-size * 1.2} 0Z`
}

export default function PlantSVG({
  stage,
  strainType,
  health,
  day,
  lstApplied = false,
  defoApplied = false,
  size = 200,
}: PlantSVGProps) {
  const { stemHeight, leafCount, leafLength, leafSpread } = getPlantParams(stage, strainType, day)
  const leaves = buildLeaves(stemHeight, leafCount, leafLength, leafSpread, lstApplied, defoApplied)

  const healthRatio = health / 100
  const stemBottom  = 200
  const stemTop     = stemBottom - stemHeight

  // Color based on health
  const leafHue    = Math.round(120 * healthRatio)  // green → yellow → brown
  const leafColor  = `hsl(${leafHue}, ${Math.round(60 * healthRatio + 10)}%, ${Math.round(30 + 20 * healthRatio)}%)`
  const stemColor  = `hsl(${leafHue}, 40%, 25%)`
  const budColor   = stage === 'flower' || stage === 'late_flower' || stage === 'harvest'
    ? `hsl(45, 80%, ${Math.round(50 + 20 * healthRatio)}%)`
    : leafColor

  // Droop if unhealthy
  const droop = health < 40 ? (40 - health) / 40 * 15 : 0

  const showBuds = stage === 'flower' || stage === 'late_flower' || stage === 'harvest'
  const budCount = showBuds ? (stage === 'late_flower' || stage === 'harvest' ? 3 : 2) : 0

  const scale = size / 200

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ overflow: 'visible' }}
      aria-label={`${strainType} plant, ${stage}, health ${health}%`}
    >
      {/* Stem */}
      <line
        x1={100}
        y1={stemBottom}
        x2={100 + droop}
        y2={stemTop}
        stroke={stemColor}
        strokeWidth={lstApplied ? 3 : 2}
        strokeLinecap="round"
      />

      {/* Leaves */}
      {leaves.map((leaf, i) => (
        <path
          key={i}
          d={leafPath({ ...leaf, y: leaf.y + droop * ((leaf.y - stemBottom) / stemHeight) * -0.5 })}
          stroke={leafColor}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          opacity={health < 20 ? 0.4 : 0.9}
        />
      ))}

      {/* Buds at the top */}
      {showBuds && Array.from({ length: budCount }).map((_, i) => {
        const bx = 100 + droop + (i - Math.floor(budCount / 2)) * 14
        const by = stemTop - 4 - i * 2
        const bSize = stage === 'harvest' ? 12 : 8
        return (
          <ellipse
            key={`bud-${i}`}
            cx={bx}
            cy={by}
            rx={bSize * 0.7}
            ry={bSize}
            fill={budColor}
            opacity={0.85}
          />
        )
      })}

      {/* Seedling cotyledons */}
      {stage === 'seedling' && (
        <>
          <path
            d={`M 100 ${stemTop} Q 88 ${stemTop - 12} 82 ${stemTop - 6}`}
            stroke={leafColor} strokeWidth={2} fill="none" strokeLinecap="round"
          />
          <path
            d={`M 100 ${stemTop} Q 112 ${stemTop - 12} 118 ${stemTop - 6}`}
            stroke={leafColor} strokeWidth={2} fill="none" strokeLinecap="round"
          />
        </>
      )}

      {/* Health warning indicator */}
      {health < 30 && (
        <text x={100} y={16} textAnchor="middle" fontSize={10} fill="#f0a830" opacity={0.8}>
          ⚠
        </text>
      )}
    </svg>
  )
}
