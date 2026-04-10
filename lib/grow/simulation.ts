/**
 * Grow simulation logic — day advancement, stage transitions.
 * Pure functions — no DB access.
 */

import {
  calculateAttributes,
  calculateStatus,
  generateGuide,
  estimateYield,
  STAGE_OPTIMAL,
  type GrowStage,
  type Setup,
  type Environment,
  type GrowAttributes,
} from './attributes'

export type { GrowStage }

export interface Warning {
  attribute: string
  message:   string
  guide:     string
  severity:  'warning' | 'critical'
  triggeredAt: Date
  resolvedAt:  Date | null
}

export interface DayResult {
  currentDay:      number
  stage:           GrowStage
  attributes:      GrowAttributes
  health:          number
  maxHealth:       number
  yieldProjection: number
  warnings:        Warning[]
  died:            boolean
}

// ── Stage transition ───────────────────────────────────────────────────────────

export function getStage(day: number, floweringTime: number, flipDay?: number | null, isClone?: boolean): GrowStage {
  // Clones are already rooted — seedling phase is only 4 days instead of 7
  const seedlingEnd = isClone ? 4 : 7
  if (day <= seedlingEnd) return 'seedling'
  const vegEnd = flipDay ?? 35
  if (day <= vegEnd) return 'veg'
  const flowerDay = day - vegEnd
  if (flowerDay <= floweringTime - 10) return 'flower'
  if (flowerDay <= floweringTime) return 'late_flower'
  return 'harvest'
}

// ── Light hours per stage ──────────────────────────────────────────────────────

export function getDefaultLightHours(stage: GrowStage): number {
  if (stage === 'flower' || stage === 'late_flower' || stage === 'harvest') return 12
  return 18
}

// ── Advance one day ────────────────────────────────────────────────────────────

export function advanceDay(params: {
  currentDay:       number
  floweringTime:    number
  flipDay?:         number | null
  isClone?:         boolean
  setup:            Setup
  environment:      Environment
  health:           number
  maxHealth:        number
  currentWatering:  number
  currentNutrients: number
  strainType:       'indica' | 'sativa' | 'hybrid'
  existingWarnings: Warning[]
}): DayResult {
  const { currentDay, floweringTime, flipDay, isClone, setup, environment, health, maxHealth, currentWatering, currentNutrients, strainType, existingWarnings } = params

  const newDay = currentDay + 1
  const stage = getStage(newDay, floweringTime, flipDay, isClone)

  // Auto-adjust light hours for flowering
  const autoEnv: Environment = {
    ...environment,
    lightHours: getDefaultLightHours(stage),
  }

  // Daily decay — moisture evaporates, nutrients are consumed
  const wateringDecay = setup.watering === 'manual' ? 8 : setup.watering === 'drip' ? 3 : 0
  const nutrientsDecay = setup.medium === 'living_soil' ? 2 : setup.medium === 'coco' ? 6 : 4
  const decayedWatering  = Math.max(0, currentWatering  - wateringDecay)
  const decayedNutrients = Math.max(0, currentNutrients - nutrientsDecay)

  const attributes = calculateAttributes(setup, autoEnv, stage, decayedWatering, decayedNutrients)
  const yieldProjection = estimateYield(setup, strainType)

  // ── Build new warnings ─────────────────────────────────────────────────────
  const newWarnings: Warning[] = []

  for (const [key, attr] of Object.entries(attributes) as [keyof GrowAttributes, typeof attributes[keyof GrowAttributes]][]) {
    if (attr.status === 'optimal') continue

    const existing = existingWarnings.find(w => w.attribute === key && !w.resolvedAt)
    const guide = generateGuide(key, attr.status, attr.value, setup, stage)

    if (existing) {
      // Keep existing warning (age tracked separately)
      newWarnings.push(existing)
    } else {
      newWarnings.push({
        attribute:   key,
        message:     guide.split('\n')[0] ?? `${key} out of range`,
        guide,
        severity:    attr.status,
        triggeredAt: new Date(),
        resolvedAt:  null,
      })
    }
  }

  // Resolve warnings where attribute is now optimal
  for (const w of existingWarnings) {
    if (w.resolvedAt) continue
    const attr = attributes[w.attribute as keyof GrowAttributes]
    if (attr && attr.status === 'optimal') {
      newWarnings.push({ ...w, resolvedAt: new Date() })
    }
  }

  // ── Health impact from warnings ────────────────────────────────────────────
  const activeWarnings = newWarnings.filter(w => !w.resolvedAt)
  const criticalCount = activeWarnings.filter(w => w.severity === 'critical').length
  const warningCount  = activeWarnings.filter(w => w.severity === 'warning').length

  // Day 1 grace period: warnings are shown so the user knows what to fix,
  // but no HP damage and no permanent ceiling reduction are applied yet.
  // Consequences only start from day 2 onward.
  const isFirstDay = newDay === 1

  let healthDelta = 0
  let newMaxHealth = maxHealth

  if (!isFirstDay) {
    // Permanent scarring: each critical per day lowers the health ceiling by 2
    newMaxHealth = Math.max(10, maxHealth - criticalCount * 2)

    if (criticalCount === 0 && warningCount === 0) {
      // All optimal — plant recovers +2 HP/day, never above the scarred ceiling
      healthDelta = +2
    } else {
      // Per day: critical -5hp, warning -2hp
      healthDelta -= criticalCount * 5
      healthDelta -= warningCount * 2
    }
  }

  const newHealth = Math.max(0, Math.min(newMaxHealth, health + healthDelta))
  const died = newHealth === 0

  return {
    currentDay:      newDay,
    stage:           died ? 'failed' : stage,
    attributes,
    health:          newHealth,
    maxHealth:       newMaxHealth,
    yieldProjection: Math.round(yieldProjection * (newHealth / 100)),
    warnings:        newWarnings,
    died,
  }
}

// ── Apply action effects ───────────────────────────────────────────────────────

export interface ActionEffect {
  wateringDelta?:  number
  nutrientsDelta?: number
  ventDelta?:      number
  yieldBonus?:     number
  xp:              number
  effectDesc:      string
}

export function getActionEffect(
  actionType: string,
  stage: GrowStage,
): ActionEffect {
  switch (actionType) {
    case 'water':
      return { wateringDelta: 30, xp: 5, effectDesc: 'Watered — moisture +30%' }
    case 'feed':
      return { wateringDelta: 10, nutrientsDelta: 25, xp: 10, effectDesc: 'Fed — nutrients +25%' }
    case 'ph_check':
      return { xp: 5, effectDesc: 'pH checked — no attribute change' }
    case 'lst':
      if (stage !== 'veg' && stage !== 'seedling') {
        return { xp: 0, effectDesc: 'LST only available during veg' }
      }
      return { yieldBonus: 0.10, xp: 25, effectDesc: 'LST applied — yield projection +10%' }
    case 'defoliate':
      if (stage === 'seedling') {
        return { xp: 0, effectDesc: 'Defoliation not available for seedlings' }
      }
      return { ventDelta: 10, yieldBonus: 0.05, xp: 15, effectDesc: 'Defoliated — ventilation +10, yield +5%' }
    case 'top':
      if (stage !== 'veg') {
        return { xp: 0, effectDesc: 'Topping only available during veg' }
      }
      return { yieldBonus: 0.12, xp: 20, effectDesc: 'Topped — yield projection +12%' }
    case 'flush':
      return { wateringDelta: 20, nutrientsDelta: -50, xp: 5, effectDesc: 'Flushed — nutrients -50%, moisture +20%' }
    case 'topdress':
      return { nutrientsDelta: 30, xp: 15, effectDesc: 'Topdressed — nutrients +30% (slow release)' }
    case 'light_raise':
      return { xp: 0, effectDesc: 'Light raised — less heat at canopy' }
    case 'light_lower':
      return { xp: 0, effectDesc: 'Light lowered — more intensity, more heat' }
    case 'light_height':
      return { xp: 0, effectDesc: 'Light height adjusted' }
    case 'fan_speed':
      return { xp: 0, effectDesc: 'Fan speed adjusted' }
    case 'lollipop':
      if (stage === 'seedling' || stage === 'veg') {
        return { xp: 0, effectDesc: 'Lollipopping only available from flower stage onward' }
      }
      return { ventDelta: 8, xp: 20, effectDesc: 'Lollipopped — bottom branches removed, ventilation improved' }
    case 'flip_12_12':
      return { xp: 10, effectDesc: 'Flipped to 12/12 — flowering triggered' }
    default:
      return { xp: 0, effectDesc: `Unknown action: ${actionType}` }
  }
}

// ── XP events for grow ─────────────────────────────────────────────────────────

export const GROW_XP_EVENTS = {
  GROW_STARTED:    20,
  WATER_PLANT:      5,
  FEED_PLANT:      10,
  LST_APPLIED:     25,
  DEFOLIATION:     15,
  TOP_PLANT:       20,
  FLUSH_PLANT:      5,
  TOPDRESS:        15,
  PH_CHECK:         5,
  JOURNAL_ENTRY:   15,
  JOURNAL_PHOTO:   20,
  JOURNAL_DETAILED:10,
  LOLLIPOP:       20,
  CLONE_TAKEN:    30,
  GROW_COMPLETED: 200,
} as const
