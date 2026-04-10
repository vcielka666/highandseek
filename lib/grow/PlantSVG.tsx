'use client'

/**
 * Parametric cannabis plant animation system.
 * CannabisPlant — single plant in 0 0 100 200 SVG space (named export)
 * PlantSVG      — 1-4 plant wrapper (default export)
 */

import React, { useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlantTechniques {
  lstApplied:       boolean
  lstDay?:          number
  toppingApplied:   boolean
  defoliationCount: number
  lollipopApplied:  boolean
  lollipopDay?:     number
}

export interface PlantSVGProps {
  day:             number
  stage:           'seedling' | 'veg' | 'flower' | 'late_flower' | 'harvest' | 'failed'
  health:          number
  strainType:      'indica' | 'sativa' | 'hybrid'
  potCount?:       number
  techniques?:     PlantTechniques
  containerWidth?: number
  animated?:       boolean
}

type PlantStage  = PlantSVGProps['stage']
type StrainType  = PlantSVGProps['strainType']

const DEFAULT_TECHNIQUES: PlantTechniques = {
  lstApplied: false, toppingApplied: false,
  defoliationCount: 0, lollipopApplied: false,
}

// ── Seeded PRNG ────────────────────────────────────────────────────────────────

function mkRand(seed: number): () => number {
  let s = (seed + 1) * 1_234_567
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 4_294_967_296
  }
}

// ── Colors ─────────────────────────────────────────────────────────────────────

function leafCol(health: number): string {
  if (health >= 90) return '#2d8a2d'
  if (health >= 70) return '#3a7a20'
  if (health >= 50) return '#6a8a1a'
  if (health >= 30) return '#8a7a1a'
  if (health >= 10) return '#8a5a1a'
  return '#6a4a1a'
}
function stemCol(health: number): string {
  if (health >= 50) return '#4a7c2f'
  if (health >= 30) return '#6a7c2f'
  return '#7a6a2a'
}
function budCol(stage: PlantStage): string {
  if (stage === 'harvest')      return '#3a7a18'
  if (stage === 'late_flower')  return '#4a8820'
  return '#7aab3a'
}
function pistilCol(stage: PlantStage): string {
  if (stage === 'harvest')      return '#885500'
  if (stage === 'late_flower')  return '#cc8800'
  return '#f2f2f2'
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

const $ = (n: number) => n.toFixed(1)

/** Single pointed finger of a cannabis leaf from (cx,cy) in direction angleDeg. */
function fingerPath(cx: number, cy: number, angleDeg: number, len: number, w: number): string {
  const r = (angleDeg * Math.PI) / 180
  const p = r + Math.PI / 2
  const tx = cx + Math.cos(r) * len, ty = cy + Math.sin(r) * len
  const l1x = cx + Math.cos(r) * len * 0.28 + Math.cos(p) * w
  const l1y = cy + Math.sin(r) * len * 0.28 + Math.sin(p) * w
  const l2x = cx + Math.cos(r) * len * 0.72 + Math.cos(p) * w * 0.42
  const l2y = cy + Math.sin(r) * len * 0.72 + Math.sin(p) * w * 0.42
  const r1x = cx + Math.cos(r) * len * 0.28 - Math.cos(p) * w
  const r1y = cy + Math.sin(r) * len * 0.28 - Math.sin(p) * w
  const r2x = cx + Math.cos(r) * len * 0.72 - Math.cos(p) * w * 0.42
  const r2y = cy + Math.sin(r) * len * 0.72 - Math.sin(p) * w * 0.42
  return `M${$(cx)} ${$(cy)} C${$(l1x)} ${$(l1y)} ${$(l2x)} ${$(l2y)} ${$(tx)} ${$(ty)} C${$(r2x)} ${$(r2y)} ${$(r1x)} ${$(r1y)} ${$(cx)} ${$(cy)}Z`
}

// 7-finger layout: [angleOffset, lengthFactor, widthFactor]
const FINGERS: Array<[number, number, number]> = [
  [  0,  1.00, 0.130],
  [-22,  0.82, 0.118],
  [ 22,  0.82, 0.118],
  [-44,  0.67, 0.103],
  [ 44,  0.67, 0.103],
  [-64,  0.52, 0.088],
  [ 64,  0.52, 0.088],
]

// ── CannabisLeaf sub-component ─────────────────────────────────────────────────

interface LeafProps {
  cx: number; cy: number
  dir: number       // pointing direction in SVG degrees (-90 = up)
  size: number      // center finger length px
  color: string
  wMult?: number    // width multiplier (indica=1.3, sativa=0.8)
  opacity?: number
  senGradId?: string   // gradient for senescent (yellow-tip) leaves
  style?: React.CSSProperties
}

function CannabisLeaf({ cx, cy, dir, size, color, wMult = 1, opacity = 1, senGradId, style }: LeafProps) {
  const fill = senGradId ? `url(#${senGradId})` : color
  return (
    <g opacity={opacity} style={style}>
      {FINGERS.map(([dAngle, lf, wf], i) => (
        <path
          key={i}
          d={fingerPath(cx, cy, dir + dAngle, size * lf, size * wf * wMult)}
          fill={fill}
          stroke={color}
          strokeWidth={0.22}
          strokeOpacity={0.5}
        />
      ))}
    </g>
  )
}

// ── Bud sub-component ──────────────────────────────────────────────────────────

interface BudProps {
  cx: number; cy: number
  stage: PlantStage
  animated: boolean
  seed: number
}

function CannabisBud({ cx, cy, stage, animated, seed }: BudProps) {
  const rng  = mkRand(seed)
  const size = stage === 'harvest' ? 10 : stage === 'late_flower' ? 7.5 : 4.5
  const bc   = budCol(stage)
  const pc   = pistilCol(stage)
  const pistilN  = stage === 'harvest' ? 9 : stage === 'late_flower' ? 7 : 4
  const trichN   = stage === 'harvest' ? 13 : stage === 'late_flower' ? 7 : 0
  const isLate   = stage === 'late_flower' || stage === 'harvest'

  // Calyx stack — 3 overlapping ellipses build the dense bud shape
  const calyxes = [
    { dy: 0,             rx: size * 0.58, ry: size * 0.80 },
    { dy: -(size * 0.5), rx: size * 0.50, ry: size * 0.65 },
    { dy: -(size * 0.9), rx: size * 0.40, ry: size * 0.52 },
  ]

  return (
    <g>
      {calyxes.map((c, i) => (
        <ellipse key={`cx${i}`} cx={cx} cy={cy + c.dy}
          rx={c.rx} ry={c.ry} fill={bc} opacity={0.92 - i * 0.06} />
      ))}

      {/* Pistils — hair-like lines radiating from bud, curving inward in late stages */}
      {Array.from({ length: pistilN }, (_, i) => {
        const a   = (i / pistilN) * Math.PI * 2 - Math.PI / 2
        const sr  = size * 0.44
        const er  = size * (isLate ? 0.82 : 1.18)
        const sx  = cx + Math.cos(a) * sr
        const sy  = cy + Math.sin(a) * sr * 0.48
        const ex  = isLate ? cx + Math.cos(a) * er * 0.28 : cx + Math.cos(a) * er
        const ey  = cy - size * 0.88 + Math.sin(a) * er * (isLate ? 0.22 : 0.38)
        const mx  = isLate ? cx + Math.cos(a) * er * 0.6  : (sx + ex) / 2
        const my  = (sy + ey) * 0.5 - size * 0.18
        return (
          <path key={`ps${i}`}
            d={`M${$(sx)} ${$(sy)} Q${$(mx)} ${$(my)} ${$(ex)} ${$(ey)}`}
            stroke={pc} strokeWidth={0.45} fill="none" opacity={0.88}
          />
        )
      })}

      {/* Trichomes — tiny shimmering dots on buds (late_flower + harvest) */}
      {Array.from({ length: trichN }, (_, i) => {
        const a     = (i / trichN) * Math.PI * 2
        const dist  = size * (0.35 + rng() * 0.52)
        const tx    = cx + Math.cos(a) * dist
        const ty    = cy - size * 0.38 + Math.sin(a) * dist * 0.44
        const dur   = (1.6 + rng() * 1.4).toFixed(1)
        const delay = (rng() * 2.0).toFixed(1)
        return (
          <circle key={`tr${i}`} cx={tx} cy={ty} r={0.7 + rng() * 0.5}
            fill="rgba(255,255,255,0.78)"
            style={animated
              ? { animation: `trichome-shimmer ${dur}s ease-in-out ${delay}s infinite` }
              : { opacity: 0.55 }}
          />
        )
      })}

      {/* Harvest glow ring */}
      {stage === 'harvest' && (
        <ellipse cx={cx} cy={cy - size * 0.45} rx={size * 1.3} ry={size * 1.55}
          fill="none" stroke="#f0a830" strokeWidth={0.7} opacity={0.32}
          style={animated ? { animation: 'harvest-glow 2.2s ease-in-out infinite' } : {}}
        />
      )}
    </g>
  )
}

// ── Plant geometry ─────────────────────────────────────────────────────────────

interface LeafSite {
  cx: number; cy: number
  dir: number; size: number
  uid: number
  isSenescent: boolean
  branchIsLollipop: boolean
}
interface BranchLine {
  x1: number; y1: number; x2: number; y2: number
  isLollipop: boolean; idx: number
}
interface BudSite { cx: number; cy: number }
interface PlantGeo {
  stemPath:    string
  stemWidth:   number
  stemTopX:    number
  stemTopY:    number
  nodes:       Array<{ x: number; y: number }>
  branches:    BranchLine[]
  leafSites:   LeafSite[]
  budSites:    BudSite[]
  splitY?:     number
  leftTop?:    { x: number; y: number }
  rightTop?:   { x: number; y: number }
}

function buildGeo(
  stage:      PlantStage,
  day:        number,
  strain:     StrainType,
  tech:       PlantTechniques,
  seed:       number,
): PlantGeo {
  const rng      = mkRand(seed)
  const isIndica = strain === 'indica'
  const isSativa = strain === 'sativa'
  const BASE_X   = 50
  const BASE_Y   = 192

  // ── Stem top Y (lower = taller plant) ───────────────────────────────────────
  const stemTopY = (() => {
    if (stage === 'failed')      return 180
    if (stage === 'seedling')    return Math.max(174, 186 - day * 2)
    if (stage === 'veg') {
      const t = Math.min(1, (day - 8) / 27)
      const base = 165 - t * 70
      return Math.round(base * (isSativa ? 0.90 : isIndica ? 1.08 : 1.0))
    }
    if (stage === 'flower')      return isSativa ? 87  : isIndica ? 100 : 93
    if (stage === 'late_flower') return isSativa ? 79  : isIndica ? 93  : 86
    if (stage === 'harvest')     return isSativa ? 75  : isIndica ? 89  : 82
    return 160
  })()

  const stemHeight = BASE_Y - stemTopY

  // ── LST: bend stem to one side ─────────────────────────────────────────────
  const lstX = tech.lstApplied ? BASE_X + 16 : BASE_X
  const stemPath = tech.lstApplied
    ? `M${BASE_X} ${BASE_Y} C${BASE_X} ${BASE_Y - stemHeight * 0.32},${BASE_X + 14} ${BASE_Y - stemHeight * 0.58},${lstX} ${stemTopY}`
    : `M${BASE_X} ${BASE_Y} L${BASE_X} ${stemTopY}`

  const stemWidth = stage === 'seedling' ? 1.5 : stage === 'veg' ? 2.6 : 3.5

  // ── Nodes ────────────────────────────────────────────────────────────────────
  const nodeCount = (() => {
    if (stage === 'seedling')    return 0
    if (stage === 'veg')         return Math.min(7, 2 + Math.floor((day - 8) / 4))
    return isSativa ? 6 : isIndica ? 8 : 7
  })()

  const nodes: PlantGeo['nodes'] = Array.from({ length: nodeCount }, (_, i) => {
    const t  = nodeCount <= 1 ? 0.5 : 0.14 + (i / Math.max(nodeCount - 1, 1)) * 0.72
    const ny = BASE_Y - stemHeight * t
    // Approximate X along the LST curve (quadratic follow)
    const nx = tech.lstApplied ? BASE_X + (lstX - BASE_X) * (t * t) : BASE_X
    return { x: nx, y: ny }
  })

  // ── Branches ─────────────────────────────────────────────────────────────────
  const branchMaxLen = (() => {
    if (stage === 'seedling') return 0
    if (stage === 'veg') {
      const t = Math.min(1, (day - 8) / 27)
      return (5 + t * 19) * (isSativa ? 0.82 : isIndica ? 1.28 : 1.0)
    }
    return 22 * (isSativa ? 0.85 : isIndica ? 1.28 : 1.0) * (tech.lstApplied ? 1.3 : 1.0)
  })()

  // Angle of branches from vertical (larger = more horizontal = indica)
  const branchAngleFromVert = isSativa ? 50 : isIndica ? 38 : 44

  const lollipopCutoff = Math.floor(nodeCount * 0.4)
  const branches: BranchLine[] = []
  let branchIdx = 0

  nodes.forEach((node, ni) => {
    const isLolli = ni < lollipopCutoff
    const jitter  = (rng() - 0.5) * 6

    // Left branch: up-left  (-(90 + angle))
    const la = -(90 + branchAngleFromVert) + jitter
    branches.push({
      x1: node.x, y1: node.y,
      x2: node.x + Math.cos((la * Math.PI) / 180) * branchMaxLen,
      y2: node.y + Math.sin((la * Math.PI) / 180) * branchMaxLen,
      isLollipop: isLolli, idx: branchIdx++,
    })
    // Right branch: up-right (-(90 - angle))
    const ra = -(90 - branchAngleFromVert) + jitter
    branches.push({
      x1: node.x, y1: node.y,
      x2: node.x + Math.cos((ra * Math.PI) / 180) * branchMaxLen,
      y2: node.y + Math.sin((ra * Math.PI) / 180) * branchMaxLen,
      isLollipop: isLolli, idx: branchIdx++,
    })
  })

  // ── Leaf sites ────────────────────────────────────────────────────────────────
  const leafSizeBase = (() => {
    const base = isSativa ? 13.5 : isIndica ? 11.5 : 12.5
    if (stage === 'seedling')  return base * 0.35
    if (stage === 'veg') {
      const t = Math.min(1, (day - 8) / 27)
      return base * (0.42 + t * 0.58)
    }
    return base
  })()

  const seneThresholdY = stemTopY + stemHeight * 0.28  // top 28% senescent in late stage
  const isSeneStage    = stage === 'late_flower' || stage === 'harvest'

  const leafSites: LeafSite[] = []
  let uid = 0

  // Leaves at each node (opposite pair)
  nodes.forEach((node) => {
    const senescent = isSeneStage && node.y < seneThresholdY
    leafSites.push({
      cx: node.x, cy: node.y,
      dir: -132 + (rng() - 0.5) * 12,
      size: leafSizeBase * (0.82 + rng() * 0.28),
      uid: uid++, isSenescent: senescent, branchIsLollipop: false,
    })
    leafSites.push({
      cx: node.x, cy: node.y,
      dir: -48 + (rng() - 0.5) * 12,
      size: leafSizeBase * (0.82 + rng() * 0.28),
      uid: uid++, isSenescent: senescent, branchIsLollipop: false,
    })
  })

  // Leaves at branch tips
  if (branchMaxLen > 3) {
    branches.forEach((branch) => {
      const senescent = isSeneStage && branch.y2 < seneThresholdY
      const branchDirDeg = Math.atan2(branch.y2 - branch.y1, branch.x2 - branch.x1) * 180 / Math.PI
      leafSites.push({
        cx: branch.x2, cy: branch.y2,
        dir: branchDirDeg - 90 + (rng() - 0.5) * 22,
        size: leafSizeBase * (0.72 + rng() * 0.28),
        uid: uid++, isSenescent: senescent, branchIsLollipop: branch.isLollipop,
      })
    })
  }

  // Main top leaf
  if (stage !== 'seedling') {
    leafSites.push({
      cx: lstX, cy: stemTopY,
      dir: -90 + (rng() - 0.5) * 8,
      size: leafSizeBase,
      uid: uid++, isSenescent: false, branchIsLollipop: false,
    })
  }

  // ── Bud sites ─────────────────────────────────────────────────────────────────
  const budSites: BudSite[] = []
  const isBudStage = stage === 'flower' || stage === 'late_flower' || stage === 'harvest'

  if (isBudStage) {
    // Main cola (or two colas if topped — handled below)
    budSites.push({ cx: lstX, cy: stemTopY - 5 })
    // Upper branch tips get buds
    const upperBranches = branches.slice(Math.floor(branches.length * 0.55))
    upperBranches.forEach(b => budSites.push({ cx: b.x2, cy: b.y2 - 2 }))
  }

  // ── Topping: split stem near top ──────────────────────────────────────────────
  let splitY: number | undefined
  let leftTop: PlantGeo['leftTop']
  let rightTop: PlantGeo['rightTop']

  if (tech.toppingApplied && stage !== 'seedling') {
    splitY = stemTopY + stemHeight * 0.36
    const spread = isSativa ? 7 : isIndica ? 11 : 9
    leftTop  = { x: lstX - spread, y: stemTopY + 2 }
    rightTop = { x: lstX + spread, y: stemTopY + 2 }
    if (isBudStage) {
      // Replace main cola with two topped colas
      const mainIdx = budSites.findIndex(b => b.cx === lstX && b.cy === stemTopY - 5)
      if (mainIdx !== -1) budSites.splice(mainIdx, 1)
      budSites.push({ cx: leftTop.x,  cy: leftTop.y  - 5 })
      budSites.push({ cx: rightTop.x, cy: rightTop.y - 5 })
    }
  }

  return { stemPath, stemWidth, stemTopX: lstX, stemTopY, nodes, branches, leafSites, budSites, splitY, leftTop, rightTop }
}

// ── CSS animations ─────────────────────────────────────────────────────────────

const PLANT_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes breathing {
    0%,100% { transform: scaleX(1)    scaleY(1); }
    50%      { transform: scaleX(1.02) scaleY(1.015); }
  }
  @keyframes wilting {
    0%,100% { transform: rotate(0deg); }
    25%      { transform: rotate(-2.5deg); }
    75%      { transform: rotate(2.5deg); }
  }
  @keyframes trichome-shimmer {
    0%,100% { opacity: 0.28; }
    50%      { opacity: 0.92; }
  }
  @keyframes harvest-glow {
    0%,100% { opacity: 0.25; stroke-width: 0.7; }
    50%      { opacity: 0.55; stroke-width: 1.4; }
  }
  @keyframes bud-swell {
    from { transform: scale(0.25); opacity: 0.3; }
    to   { transform: scale(1);    opacity: 1; }
  }
}
`

// ── CannabisPlant (single plant, 0 0 100 200 space) ───────────────────────────

export interface CannabisPlantProps {
  day:        number
  stage:      PlantStage
  health:     number
  strainType: StrainType
  techniques: PlantTechniques
  animated:   boolean
  /** Seed for per-plant natural variation when using potCount > 1 */
  seed?:      number
}

export function CannabisPlant({
  day, stage, health, strainType, techniques, animated, seed = 0,
}: CannabisPlantProps) {
  const geo = useMemo(
    () => buildGeo(stage, day, strainType, techniques, seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage, day, strainType,
     techniques.lstApplied, techniques.toppingApplied,
     techniques.defoliationCount, techniques.lollipopApplied, seed],
  )

  const lc    = leafCol(health)
  const sc    = stemCol(health)
  const wMult = strainType === 'indica' ? 1.32 : strainType === 'sativa' ? 0.80 : 1.0
  const pidx  = `p${seed}`

  // Which leaves are removed (top-first): sort by Y ascending (lower Y = higher on plant)
  const removedUids = useMemo(() => {
    const perSession = 3
    const count = Math.min(techniques.defoliationCount * perSession, geo.leafSites.length)
    if (count === 0) return new Set<number>()
    const sorted = [...geo.leafSites].sort((a, b) => a.cy - b.cy)
    return new Set(sorted.slice(0, count).map(l => l.uid))
  }, [geo.leafSites, techniques.defoliationCount])

  const isBreathing = health >= 60 && stage !== 'failed' && animated
  const isWilting   = health < 40  && stage !== 'failed' && animated
  const isFailed    = stage === 'failed'

  const plantAnim: React.CSSProperties = isBreathing
    ? { animation: 'breathing 4s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: '50% 100%' }
    : isWilting
    ? { animation: 'wilting 6s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: '50% 100%',
        filter: `saturate(${health}%)` }
    : {}

  const seneGradId = `${pidx}-sene`
  const isBudStage = stage === 'flower' || stage === 'late_flower' || stage === 'harvest'

  return (
    <svg viewBox="0 0 100 200" width="100" height="200" overflow="visible"
      aria-label={`${strainType} cannabis plant, ${stage}, health ${health}%`}>
      <style>{PLANT_STYLES}</style>

      <defs>
        {/* Senescent leaf: green base → yellow tips */}
        <linearGradient id={seneGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor={lc} />
          <stop offset="55%"  stopColor={lc} />
          <stop offset="100%" stopColor="#c2a018" />
        </linearGradient>
      </defs>

      <g opacity={isFailed ? 0.38 : 1}>
        {/* Whole-plant breathing or wilting */}
        <g style={plantAnim}>

          {/* ── Stem ──────────────────────────────────────────────────────── */}
          <path d={geo.stemPath} stroke={sc} strokeWidth={geo.stemWidth}
            fill="none" strokeLinecap="round" />

          {/* ── Topped twin colas ─────────────────────────────────────────── */}
          {geo.splitY !== undefined && geo.leftTop && geo.rightTop && (
            <>
              <line x1={geo.stemTopX} y1={geo.splitY}
                x2={geo.leftTop.x}  y2={geo.leftTop.y}
                stroke={sc} strokeWidth={geo.stemWidth * 0.78} strokeLinecap="round" />
              <line x1={geo.stemTopX} y1={geo.splitY}
                x2={geo.rightTop.x} y2={geo.rightTop.y}
                stroke={sc} strokeWidth={geo.stemWidth * 0.78} strokeLinecap="round" />
            </>
          )}

          {/* ── Branches ──────────────────────────────────────────────────── */}
          {geo.branches.map((br) => {
            const fallen = techniques.lollipopApplied && br.isLollipop
            return (
              <line key={`br${br.idx}`}
                x1={br.x1} y1={br.y1} x2={br.x2} y2={br.y2}
                stroke={sc} strokeWidth={1.3} strokeLinecap="round"
                style={fallen ? {
                  opacity: 0,
                  transform: 'translateY(10px)',
                  transformBox: 'fill-box',
                  transformOrigin: `${br.x1}px ${br.y1}px`,
                  transition: `opacity 1.5s ease-out ${(br.idx % 4) * 0.18}s, transform 1.5s ease-out ${(br.idx % 4) * 0.18}s`,
                } : {}}
              />
            )
          })}

          {/* ── Node marks ────────────────────────────────────────────────── */}
          {geo.nodes.map((nd, i) => (
            <circle key={`nd${i}`} cx={nd.x} cy={nd.y} r={0.9}
              fill={sc} opacity={0.55} />
          ))}

          {/* ── Fan leaves ────────────────────────────────────────────────── */}
          {geo.leafSites.map((site) => {
            const isRemoved  = removedUids.has(site.uid)
            const isLolliLeaf = techniques.lollipopApplied && site.branchIsLollipop
            const hide = isRemoved || isLolliLeaf
            return (
              <CannabisLeaf
                key={`lf${site.uid}`}
                cx={site.cx} cy={site.cy}
                dir={site.dir}
                size={site.size}
                color={lc}
                wMult={wMult}
                opacity={hide ? 0 : health < 20 ? 0.38 : 1}
                senGradId={site.isSenescent ? seneGradId : undefined}
                style={hide ? {
                  transition: `opacity 1s ease-out ${(site.uid % 5) * 0.14}s, transform 1s ease-out`,
                  transform: 'translateY(15px)',
                  transformBox: 'fill-box',
                } : undefined}
              />
            )
          })}

          {/* ── Cotyledons (seedling stage) ───────────────────────────────── */}
          {stage === 'seedling' && (
            <>
              <ellipse cx={geo.stemTopX - 7} cy={geo.stemTopY - 3}
                rx={4.2} ry={2.6} fill={lc} opacity={0.82}
                transform={`rotate(-28,${geo.stemTopX - 7},${geo.stemTopY - 3})`} />
              <ellipse cx={geo.stemTopX + 7} cy={geo.stemTopY - 3}
                rx={4.2} ry={2.6} fill={lc} opacity={0.82}
                transform={`rotate(28,${geo.stemTopX + 7},${geo.stemTopY - 3})`} />
              <line x1={geo.stemTopX} y1={geo.stemTopY}
                x2={geo.stemTopX - 6} y2={geo.stemTopY - 1}
                stroke={sc} strokeWidth={0.9} />
              <line x1={geo.stemTopX} y1={geo.stemTopY}
                x2={geo.stemTopX + 6} y2={geo.stemTopY - 1}
                stroke={sc} strokeWidth={0.9} />
            </>
          )}

          {/* ── Buds ──────────────────────────────────────────────────────── */}
          {isBudStage && geo.budSites.map((bud, i) => (
            <g key={`bd${i}`}
              style={animated ? {
                animation: 'bud-swell 3s ease-out forwards',
                transformBox: 'fill-box',
                transformOrigin: '50% 100%',
                animationDelay: `${i * 0.12}s`,
              } : {}}>
              <CannabisBud
                cx={bud.cx} cy={bud.cy}
                stage={stage}
                animated={animated}
                seed={seed * 31 + i * 7}
              />
            </g>
          ))}

          {/* ── Health warning glyph ──────────────────────────────────────── */}
          {health < 30 && (
            <text x={50} y={11} textAnchor="middle" fontSize={8.5}
              fill="#f0a830" opacity={0.9} fontFamily="monospace">⚠</text>
          )}

        </g>
      </g>
    </svg>
  )
}

// ── PlantSVG — 1-4 plant wrapper (default export) ─────────────────────────────

export default function PlantSVG({
  day,
  stage,
  health,
  strainType,
  potCount = 1,
  techniques = DEFAULT_TECHNIQUES,
  containerWidth,
  animated = true,
}: PlantSVGProps) {
  const count  = Math.max(1, Math.min(4, potCount))
  const outerW = containerWidth ?? 200
  const outerH = outerW  // square outer viewBox

  // Each CannabisPlant has natural 100:200 (1:2) aspect ratio.
  // We place them inside a 200x200 outer SVG.

  interface PlantPlacement {
    x: number; y: number; w: number; h: number; seed: number
  }

  const placements: PlantPlacement[] = useMemo(() => {
    const heightVar = (i: number) => 1 + ((i * 0.07) % 0.1) - 0.05  // ±5% height variation

    if (count === 1) {
      return [{ x: 50, y: 0, w: 100, h: 200, seed: 0 }]
    }
    if (count === 2) {
      // Two side-by-side scaled to 0.75 (75x150), centered in 200x200
      return [
        { x: 12,  y: 25, w: 75, h: Math.round(150 * heightVar(0)), seed: 0 },
        { x: 113, y: 25, w: 75, h: Math.round(150 * heightVar(1)), seed: 1 },
      ]
    }
    if (count === 3) {
      // Three in a row at scale 0.60 (60x120), with equal gaps
      const gap = (200 - 3 * 60) / 4
      return [
        { x: Math.round(gap),           y: 40, w: 60, h: Math.round(120 * heightVar(0)), seed: 0 },
        { x: Math.round(gap * 2 + 60),  y: 40, w: 60, h: Math.round(120 * heightVar(1)), seed: 1 },
        { x: Math.round(gap * 3 + 120), y: 40, w: 60, h: Math.round(120 * heightVar(2)), seed: 2 },
      ]
    }
    // 4 plants — 2×2 grid at scale 0.5 (50x100)
    return [
      { x: 15,  y: 0,   w: 75, h: Math.round(100 * heightVar(0)), seed: 0 },
      { x: 110, y: 0,   w: 75, h: Math.round(100 * heightVar(1)), seed: 1 },
      { x: 15,  y: 100, w: 75, h: Math.round(100 * heightVar(2)), seed: 2 },
      { x: 110, y: 100, w: 75, h: Math.round(100 * heightVar(3)), seed: 3 },
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <svg
      viewBox="0 0 200 200"
      width={outerW}
      height={outerH}
      aria-label={`${count} ${strainType} plant${count > 1 ? 's' : ''}`}
      overflow="visible"
    >
      {placements.map((pl) => {
        // Apply per-plant seed offset to techniques (angle variation in geometry)
        const plantSeed = pl.seed
        return (
          <svg key={pl.seed} x={pl.x} y={pl.y}
            width={pl.w} height={pl.h}
            viewBox="0 0 100 200"
            overflow="visible">
            <CannabisPlant
              day={day}
              stage={stage}
              health={health}
              strainType={strainType}
              techniques={techniques}
              animated={animated}
              seed={plantSeed}
            />
          </svg>
        )
      })}
    </svg>
  )
}
