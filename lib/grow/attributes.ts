/**
 * RPG attribute calculation for the Grow Simulator.
 * Pure functions — no DB access.
 */

export type GrowStage = 'seedling' | 'veg' | 'flower' | 'late_flower' | 'harvest' | 'complete' | 'failed'
export type AttributeStatus = 'optimal' | 'warning' | 'critical'

export interface AttributeRange {
  value:   number
  optimal: { min: number; max: number }
  status:  AttributeStatus
}

export interface GrowAttributes {
  temperature:  AttributeRange
  humidity:     AttributeRange
  light:        AttributeRange
  ventilation:  AttributeRange
  nutrients:    AttributeRange
  watering:     AttributeRange
}

export interface Setup {
  tentSize:          '60x60' | '80x80' | '100x100' | '120x120' | '150x150'
  lightType:         'led' | 'hps' | 'cmh' | 'cfl'
  lightWatts:        number
  medium:            'living_soil' | 'coco' | 'hydro'
  watering:          'manual' | 'blumat' | 'drip'
  nutrients:         'organic' | 'mineral' | 'none'
  hasExhaustFan:     boolean
  exhaustCFM:        number
  hasCirculationFan: boolean
  hasCarbonFilter:   boolean
  hasPHMeter:        boolean
  hasECMeter:        boolean
  hasHygrometer:     boolean
  potSize:           'small' | 'medium' | 'large'
}

export interface Environment {
  temperature:      number
  humidity:         number
  ph:               number
  ec:               number
  lightHours:       number
  lightHeight?:     number  // cm from canopy, 20–100, default 60
  exhaustFanSpeed?: number  // 0–100 %, default 100
}

// ── Tent area in m² ────────────────────────────────────────────────────────────

const TENT_AREAS: Record<Setup['tentSize'], number> = {
  '60x60':   0.36,
  '80x80':   0.64,
  '100x100': 1.00,
  '120x120': 1.44,
  '150x150': 2.25,
}

const TENT_HEAT_FACTOR: Record<Setup['tentSize'], number> = {
  '60x60':   1.4,
  '80x80':   1.2,
  '100x100': 1.0,
  '120x120': 0.9,
  '150x150': 0.8,
}

const TENT_ACH_FACTOR: Record<Setup['tentSize'], number> = {
  '60x60':   1.5,
  '80x80':   1.2,
  '100x100': 1.0,
  '120x120': 0.85,
  '150x150': 0.7,
}

// ── Optimal ranges per stage ───────────────────────────────────────────────────

interface OptimalRanges {
  temperature:  { min: number; max: number }
  humidity:     { min: number; max: number }
  light:        { min: number; max: number }
  ventilation:  { min: number; max: number }
  nutrients:    { min: number; max: number }
  watering:     { min: number; max: number }
}

export const STAGE_OPTIMAL: Record<GrowStage, OptimalRanges> = {
  seedling: {
    temperature: { min: 22, max: 28 },
    humidity:    { min: 55, max: 75 },
    light:       { min: 50,  max: 400 },
    ventilation: { min: 15, max: 40 },
    nutrients:   { min: 0,  max: 20 },
    watering:    { min: 55, max: 80 },
  },
  veg: {
    temperature: { min: 20, max: 28 },
    humidity:    { min: 40, max: 70 },   // wider — warning triggers at ~34 and ~76
    light:       { min: 200, max: 500 },
    ventilation: { min: 30, max: 70 },
    nutrients:   { min: 40, max: 70 },
    watering:    { min: 45, max: 75 },
  },
  flower: {
    temperature: { min: 18, max: 26 },
    humidity:    { min: 38, max: 55 },   // wider — mould warning at ~67, critical at ~72
    light:       { min: 400, max: 650 },
    ventilation: { min: 60, max: 90 },
    nutrients:   { min: 55, max: 80 },
    watering:    { min: 40, max: 65 },
  },
  late_flower: {
    temperature: { min: 18, max: 24 },
    humidity:    { min: 33, max: 50 },   // wider — warns at ~43 high, critical at ~50
    light:       { min: 400, max: 650 },
    ventilation: { min: 60, max: 90 },
    nutrients:   { min: 15, max: 40 },
    watering:    { min: 40, max: 65 },
  },
  harvest: {
    temperature: { min: 18, max: 24 },
    humidity:    { min: 30, max: 48 },
    light:       { min: 400, max: 650 },
    ventilation: { min: 60, max: 90 },
    nutrients:   { min: 0,  max: 20 },
    watering:    { min: 40, max: 65 },
  },
  complete: {
    temperature: { min: 18, max: 26 },
    humidity:    { min: 35, max: 65 },
    light:       { min: 0,  max: 650 },
    ventilation: { min: 0,  max: 90 },
    nutrients:   { min: 0,  max: 80 },
    watering:    { min: 0,  max: 80 },
  },
  failed: {
    temperature: { min: 0, max: 100 },
    humidity:    { min: 0, max: 100 },
    light:       { min: 0, max: 650 },
    ventilation: { min: 0, max: 90 },
    nutrients:   { min: 0, max: 80 },
    watering:    { min: 0, max: 80 },
  },
}

// ── calculateStatus ────────────────────────────────────────────────────────────

export function calculateStatus(value: number, optimal: { min: number; max: number }): AttributeStatus {
  const range = optimal.max - optimal.min
  const buffer = range * 0.2 // 20% outside = critical

  if (value >= optimal.min && value <= optimal.max) return 'optimal'

  if (value < optimal.min) {
    const deficit = optimal.min - value
    return deficit > range * 0.2 ? 'critical' : 'warning'
  }

  const excess = value - optimal.max
  return excess > buffer ? 'critical' : 'warning'
}

// ── calculateAttributes ────────────────────────────────────────────────────────

export function calculateAttributes(
  setup: Setup,
  environment: Environment,
  stage: GrowStage,
  currentWatering = 70,
  currentNutrients?: number,
): GrowAttributes {
  const optimal = STAGE_OPTIMAL[stage] ?? STAGE_OPTIMAL.seedling

  // ── Effective exhaust CFM (fan speed 0-100%) ──────────────────────────────
  const fanSpeed     = Math.max(0, Math.min(100, environment.exhaustFanSpeed ?? 100))
  const effectiveCFM = setup.hasExhaustFan ? setup.exhaustCFM * (fanSpeed / 100) : 0

  // ── Temperature ────────────────────────────────────────────────────────────
  const lightHeight = environment.lightHeight ?? 60  // cm from canopy
  // Closer lamp → more radiant heat at canopy. Reference point: 60cm = ×1.0
  // 20cm = ×1.5,  40cm = ×1.2,  60cm = ×1.0,  80cm = ×0.8,  100cm = ×0.65
  const heightHeatFactor = Math.max(0.5, Math.min(1.6, (60 / lightHeight) * 1.0))

  const lightHeat = (() => {
    const { lightType, lightWatts } = setup
    let heat = 0
    if (lightType === 'hps') {
      heat = lightWatts >= 600 ? 6 : lightWatts >= 400 ? 4 : 3
    } else if (lightType === 'cmh') {
      heat = 3
    } else if (lightType === 'led') {
      heat = lightWatts >= 300 ? 2 : 1
    } else if (lightType === 'cfl') {
      heat = 1
    }
    return heat * TENT_HEAT_FACTOR[setup.tentSize] * heightHeatFactor
  })()

  const ventCooling = (() => {
    if (effectiveCFM > 400) return 6
    if (effectiveCFM >= 200) return 4
    if (effectiveCFM > 0)   return 2
    return 0
  })()

  const tempValue = environment.temperature + lightHeat - ventCooling

  // ── Ventilation (ACH) — scales linearly with fan speed ────────────────────
  const baseACH = (() => {
    if (!setup.hasExhaustFan && !setup.hasCirculationFan) return 5
    if (!setup.hasExhaustFan) return 15
    const fullACH = effectiveCFM > 400 ? 90 : effectiveCFM >= 200 ? 60 : effectiveCFM > 0 ? 30 : 10
    return fullACH
  })()
  const ventValue = baseACH * TENT_ACH_FACTOR[setup.tentSize]

  // ── Humidity — base + plant transpiration − fan extraction ───────────────
  // Transpiration adds moisture based on growth stage.
  // Exhaust fan extracts a fixed number of points based on CFM tier.
  const transpiration = (() => {
    if (stage === 'seedling') return 2
    if (stage === 'veg')      return 7
    if (stage === 'flower')   return 12
    if (stage === 'late_flower') return 9
    return 4
  })()
  // Fan extraction — flat points pulled from humidity per CFM tier.
  // A powerful fan actively replaces humid tent air with drier intake air.
  // Rule: 1000+ CFM at 100% should be able to push humidity below 50%
  // even with full flower transpiration (+12) from a 65–70% ambient.
  const humidityExtraction = (() => {
    if (!setup.hasExhaustFan || effectiveCFM === 0) return 0
    if (effectiveCFM <  100) return 5
    if (effectiveCFM <  200) return 10
    if (effectiveCFM <  400) return 16
    if (effectiveCFM <  600) return 22
    if (effectiveCFM < 1000) return 28
    return 35  // 1000+ CFM — strong enough to pull humidity well below ambient
  })()
  const humidityValue = Math.max(0, Math.min(100,
    environment.humidity + transpiration - humidityExtraction,
  ))

  // ── Light intensity (W/m²) ─────────────────────────────────────────────────
  // heightHeatFactor already computed above: 60cm=×1.0, 100cm=×0.6, 20cm=×1.6(cap)
  // Same factor applies to canopy light — raising the lamp reduces intensity.
  const tentArea = TENT_AREAS[setup.tentSize]
  const lightValue = Math.round((setup.lightWatts / tentArea) * heightHeatFactor)

  // ── Nutrients ──────────────────────────────────────────────────────────────
  // If a dynamic currentNutrients is provided (from user actions / day decay), use it.
  // Otherwise derive a static baseline from the setup (used only at grow start).
  const nutrientsValue = currentNutrients !== undefined ? currentNutrients : (() => {
    const { medium, nutrients } = setup
    if (medium === 'living_soil') {
      return nutrients === 'none' ? 60 : nutrients === 'organic' ? 70 : 40
    }
    if (medium === 'coco') {
      return nutrients === 'mineral' ? 65 : nutrients === 'organic' ? 30 : 15
    }
    // hydro
    return nutrients === 'mineral' ? 70 : nutrients === 'organic' ? 20 : 10
  })()

  // ── Watering ───────────────────────────────────────────────────────────────
  const wateringValue = (() => {
    if (setup.watering === 'blumat') return 70
    if (setup.watering === 'drip') return 65
    return currentWatering
  })()

  const mk = (value: number, opt: { min: number; max: number }): AttributeRange => ({
    value: Math.round(value * 10) / 10,
    optimal: opt,
    status: calculateStatus(value, opt),
  })

  return {
    temperature: mk(tempValue,    optimal.temperature),
    humidity:    mk(humidityValue, optimal.humidity),
    light:       mk(lightValue,   optimal.light),
    ventilation: mk(ventValue,    optimal.ventilation),
    nutrients:   mk(nutrientsValue, optimal.nutrients),
    watering:    mk(wateringValue, optimal.watering),
  }
}

// ── calculateHealthImpact ─────────────────────────────────────────────────────

export function calculateHealthImpact(
  attributes: GrowAttributes,
  hoursInCritical: number,
  hoursInWarning: number,
): number {
  let healthLoss = 0

  // Critical: 0-24h free, 24-48h -10%, 48-72h -25%, 72-96h -50%, >96h fatal
  if (hoursInCritical > 96) return -100
  if (hoursInCritical > 72) healthLoss += 50
  else if (hoursInCritical > 48) healthLoss += 25
  else if (hoursInCritical > 24) healthLoss += 10

  // Warning: 0-48h free, 48-96h -5/day, >96h -10/day
  const warningDays = hoursInWarning / 24
  if (warningDays > 4) healthLoss += (warningDays - 4) * 10
  else if (warningDays > 2) healthLoss += (warningDays - 2) * 5

  // Count criticals for severity scaling
  const criticals = Object.values(attributes).filter(a => a.status === 'critical').length
  return healthLoss * Math.max(1, criticals * 0.5)
}

// ── generateGuide ──────────────────────────────────────────────────────────────

export function generateGuide(
  attribute: keyof GrowAttributes,
  status: AttributeStatus,
  value: number,
  setup: Setup,
  stage: GrowStage,
): string {
  if (status === 'optimal') return ''

  const isCritical = status === 'critical'
  const prefix = isCritical ? '🚨 CRITICAL' : '⚠️ WARNING'

  switch (attribute) {
    case 'temperature':
      if (value > STAGE_OPTIMAL[stage].temperature.max) {
        return `${prefix}: Temperature ${value}°C — too high for ${stage}.\n` +
          `With your ${setup.lightWatts}W ${setup.lightType.toUpperCase()} in a ${setup.tentSize} tent this is expected.\n` +
          `Solutions:\n` +
          `→ Add/upgrade exhaust fan\n` +
          `→ Reduce light intensity to 70%\n` +
          `→ Ensure fan is running at full speed`
      }
      return `${prefix}: Temperature ${value}°C — too cold.\n` +
        `Solutions:\n` +
        `→ Raise thermostat or add heat mat\n` +
        `→ Reduce fan speed temporarily`

    case 'humidity':
      if (value > STAGE_OPTIMAL[stage].humidity.max) {
        const moldRisk = (stage === 'flower' || stage === 'late_flower') ? '\n⚠️ HIGH MOULD RISK during flowering!' : ''
        return `${prefix}: Humidity ${value}% — too high.${moldRisk}\n` +
          `Solutions:\n` +
          `→ Improve ventilation\n` +
          `→ Add dehumidifier\n` +
          `→ Open tent for 30 minutes`
      }
      return `${prefix}: Humidity ${value}% — too dry.\n` +
        `Solutions:\n` +
        `→ Add humidifier or wet towel near intake\n` +
        `→ Reduce ventilation slightly`

    case 'light':
      if (value < STAGE_OPTIMAL[stage].light.min) {
        return `${prefix}: Light intensity ${value} W/m² — too low for ${stage}.\n` +
          `Your ${setup.lightWatts}W in a ${setup.tentSize} tent (${TENT_AREAS[setup.tentSize]}m²).\n` +
          `Solutions:\n` +
          `→ Upgrade to higher wattage light\n` +
          `→ Move light closer to canopy\n` +
          `→ Switch to a smaller tent`
      }
      return `${prefix}: Light ${value} W/m² — too intense, risk of light burn.\n` +
        `Solutions:\n` +
        `→ Raise light higher\n` +
        `→ Dim to 70-80%`

    case 'ventilation': {
      const opt = STAGE_OPTIMAL[stage].ventilation
      if (value < opt.min) {
        return `${prefix}: Ventilation ${Math.round(value)} ACH — too low (optimal ${opt.min}–${opt.max} ACH).\n` +
          (!setup.hasExhaustFan
            ? `No exhaust fan detected!\n→ Add an inline duct fan immediately.`
            : `Solutions:\n→ Increase fan speed\n→ Inspect duct for blockages`)
      }
      return `${prefix}: Ventilation ${Math.round(value)} ACH — too strong (optimal max ${opt.max} ACH).\n` +
        `Solutions:\n→ Reduce fan speed\n→ Partially close the exhaust duct`
    }

    case 'nutrients':
      if (value < STAGE_OPTIMAL[stage].nutrients.min) {
        if (setup.medium === 'coco' && setup.nutrients === 'none') {
          return `🚨 CRITICAL: Nutrients dangerously low — coco is inert!\n` +
            `Coco coir has NO nutrients. Plants will die without mineral feed.\n` +
            `→ Add 2-part or 3-part mineral nutrients immediately\n` +
            `→ Target EC: 1.2-1.6 during veg`
        }
        return `${prefix}: Nutrients ${Math.round(value)}% — deficiency risk.\n` +
          `Solutions:\n→ Increase feeding frequency\n→ Check pH is in range (allows nutrient uptake)`
      }
      return `${prefix}: Nutrients ${Math.round(value)}% — excess risk (nutrient burn).\n` +
        `Solutions:\n→ Flush with plain pH water\n→ Reduce feeding strength`

    case 'watering':
      if (value < STAGE_OPTIMAL[stage].watering.min) {
        return `${prefix}: Soil moisture ${Math.round(value)}% — underwatered.\n` +
          `Solutions:\n→ Water until 20% runoff\n→ Check pot weight — light = needs water`
      }
      return `${prefix}: Soil moisture ${Math.round(value)}% — overwatered.\n` +
        `Solutions:\n→ Allow to dry out before next watering\n→ Improve drainage`

    default:
      return `${prefix}: ${attribute} out of optimal range.`
  }
}

// ── estimateYield ──────────────────────────────────────────────────────────────

// ── calculateVPD ──────────────────────────────────────────────────────────────
// Vapor Pressure Deficit — the grower's holy-grail metric (kPa)
// Derived from temperature + humidity. Optimal: 0.8–1.2 veg, 1.0–1.6 flower.

export function calculateVPD(temperature: number, humidity: number): number {
  const svp = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))
  return Math.round(svp * (1 - humidity / 100) * 100) / 100
}

export function vpdStatus(vpd: number, stage: GrowStage): AttributeStatus {
  const ranges: Record<GrowStage, { min: number; max: number }> = {
    seedling:    { min: 0.4, max: 0.8 },
    veg:         { min: 0.8, max: 1.2 },
    flower:      { min: 1.0, max: 1.6 },
    late_flower: { min: 1.2, max: 1.8 },
    harvest:     { min: 1.0, max: 1.6 },
    complete:    { min: 0.8, max: 1.6 },
    failed:      { min: 0.0, max: 2.0 },
  }
  return calculateStatus(vpd, ranges[stage] ?? ranges.veg)
}

// ── Smart conflict-aware warnings ─────────────────────────────────────────────

export interface SmartSolution {
  text:    string
  action?: string   // upgrade type OR grow action type
  cost?:   number   // credits (0 = free)
}

export interface SmartWarning {
  id:             string   // stable key for deduplication
  attributes:     string[]
  severity:       'warning' | 'critical'
  message:        string
  solutions:      SmartSolution[]
  conflictNote?:  string
}

export function generateSmartGuide(
  attributes: GrowAttributes,
  setup:      Setup,
  stage:      GrowStage,
): SmartWarning[] {
  const warnings: SmartWarning[] = []
  const sev = (s: AttributeStatus): 'warning' | 'critical' => s === 'critical' ? 'critical' : 'warning'
  const t = attributes.temperature
  const h = attributes.humidity
  const n = attributes.nutrients
  const v = attributes.ventilation
  const w = attributes.watering

  const highTemp  = t.status !== 'optimal' && t.value > t.optimal.max
  const highHum   = h.status !== 'optimal' && h.value > h.optimal.max
  const lowHum    = h.status !== 'optimal' && h.value < h.optimal.min
  const highNut   = n.status !== 'optimal' && n.value > n.optimal.max
  const lowNut    = n.status !== 'optimal' && n.value < n.optimal.min
  const lowVent   = v.status !== 'optimal' && v.value < v.optimal.min
  const highVent  = v.status !== 'optimal' && v.value > v.optimal.max
  const lowWater  = w.status !== 'optimal' && w.value < w.optimal.min
  const overWater = w.status !== 'optimal' && w.value > w.optimal.max

  // ── Conflict: high temp + high humidity → exhaust fan solves both ──────────
  if (highTemp && highHum) {
    warnings.push({
      id: 'conflict_temp_hum',
      attributes: ['temperature', 'humidity'],
      severity: t.status === 'critical' || h.status === 'critical' ? 'critical' : 'warning',
      message: `Temperature ${Math.round(t.value)}°C + humidity ${Math.round(h.value)}% are both too high. A single exhaust fan fixes both problems simultaneously — it removes hot humid air and draws in cooler dry air.`,
      solutions: [
        { text: 'Add exhaust fan 200 CFM — fixes both', action: 'upgrade_fan_small', cost: 25 },
        { text: 'Upgrade to 400 CFM fan', action: 'upgrade_fan_medium', cost: 40 },
      ],
      conflictNote: 'Single solution resolves both issues',
    })
  }
  // ── Conflict: high temp + low humidity → fix temp first ────────────────────
  else if (highTemp && lowHum) {
    warnings.push({
      id: 'conflict_temp_lowhum',
      attributes: ['temperature', 'humidity'],
      severity: t.status === 'critical' ? 'critical' : 'warning',
      message: `Temperature ${Math.round(t.value)}°C is too high. Do NOT add a humidifier yet — humidifiers make heat worse. Fix temperature first, then adjust humidity if still needed.`,
      solutions: [
        { text: 'Add/upgrade exhaust fan — reduces heat first', action: 'upgrade_fan_small', cost: 25 },
        { text: 'Raise light higher — less radiant heat', action: 'light_raise', cost: 0 },
      ],
      conflictNote: 'Adding humidity while hot = stress + mould risk',
    })
  }
  // ── Standalone high temp ────────────────────────────────────────────────────
  else if (highTemp) {
    warnings.push({
      id: 'high_temp',
      attributes: ['temperature'],
      severity: sev(t.status),
      message: `Temperature ${Math.round(t.value)}°C is too high for ${stage} (optimal ${t.optimal.min}–${t.optimal.max}°C). ${setup.lightType === 'hps' ? 'HPS lights are the primary heat source — consider switching to LED.' : 'Increase ventilation or raise the light.'}`,
      solutions: [
        !setup.hasExhaustFan
          ? { text: 'Add exhaust fan — most effective cooling', action: 'upgrade_fan_small', cost: 25 }
          : { text: 'Upgrade to stronger fan', action: 'upgrade_fan_medium', cost: 40 },
        { text: 'Raise light — less radiant heat at canopy', action: 'light_raise', cost: 0 },
        ...(setup.lightType === 'hps' ? [{ text: 'Switch to LED — runs 40% cooler', action: 'upgrade_light_led', cost: 80 }] : []),
      ],
    })
  }

  // ── Standalone high humidity ────────────────────────────────────────────────
  if (highHum && !highTemp) {
    const isMouldRisk = stage === 'flower' || stage === 'late_flower'
    warnings.push({
      id: 'high_humidity',
      attributes: ['humidity'],
      severity: isMouldRisk && h.status === 'warning' ? 'critical' : sev(h.status),
      message: `Humidity ${Math.round(h.value)}% is too high.${isMouldRisk ? ' 🚨 HIGH MOULD RISK during flowering — Botrytis can destroy buds in 24–48h.' : ''} Increase exhaust fan speed or add a dehumidifier.`,
      solutions: [
        !setup.hasExhaustFan
          ? { text: 'Add exhaust fan', action: 'upgrade_fan_small', cost: 25 }
          : { text: 'Increase fan speed — drag fan image up', action: 'fan_speed', cost: 0 },
        { text: 'Add dehumidifier', action: 'dehumidifier', cost: 1 },
        { text: 'Defoliate — removes moisture-trapping leaves', action: 'defoliate', cost: 0 },
      ],
    })
  }

  // ── Low humidity ─────────────────────────────────────────────────────────────
  if (lowHum && !highTemp) {
    warnings.push({
      id: 'low_humidity',
      attributes: ['humidity'],
      severity: sev(h.status),
      message: `Humidity ${Math.round(h.value)}% is too low for ${stage} (optimal ${h.optimal.min}–${h.optimal.max}%). Plants absorb water through leaves — very dry air slows growth.`,
      solutions: [
        { text: 'Add humidifier', action: 'humidifier', cost: 50 },
        { text: 'Reduce fan speed temporarily', action: 'fan_speed', cost: 0 },
      ],
    })
  }

  // ── Low ventilation ────────────────────────────────────────────────────────
  if (lowVent) {
    warnings.push({
      id: 'low_vent',
      attributes: ['ventilation'],
      severity: sev(v.status),
      message: `Ventilation ${Math.round(v.value)} ACH is insufficient (optimal ${v.optimal.min}–${v.optimal.max} ACH). Poor airflow = hot spots, high humidity, weak stems, and mould risk.`,
      solutions: [
        !setup.hasExhaustFan
          ? { text: 'Add exhaust fan — critical for any tent', action: 'upgrade_fan_small', cost: 25 }
          : { text: 'Increase fan speed', action: 'fan_speed', cost: 0 },
        { text: 'Add circulation fan — improves airflow', action: 'circulation_fan', cost: 20 },
      ],
    })
  }

  // ── High ventilation ───────────────────────────────────────────────────────
  if (highVent) {
    warnings.push({
      id: 'high_vent',
      attributes: ['ventilation'],
      severity: sev(v.status),
      message: `Ventilation ${Math.round(v.value)} ACH is too strong (optimal ${v.optimal.min}–${v.optimal.max} ACH). Excessive airflow dries out the medium too fast, stresses the plant, and can lower humidity dangerously.`,
      solutions: [
        { text: 'Reduce fan speed — drag fan control down', action: 'fan_speed', cost: 0 },
        { text: 'Partially close exhaust duct — throttles airflow', cost: 0 },
      ],
    })
  }

  // ── Nutrients: excess + living soil ────────────────────────────────────────
  if (highNut && setup.medium === 'living_soil') {
    warnings.push({
      id: 'nut_excess_soil',
      attributes: ['nutrients'],
      severity: sev(n.status),
      message: `Nutrients ${Math.round(n.value)}% — excess in living soil. Living soil has its own nutrient ecosystem. Extra feeding causes salt buildup and burns roots.`,
      solutions: [
        { text: 'Flush with plain water 2–3×', action: 'flush', cost: 0 },
      ],
      conflictNote: 'Do not add more nutrients for at least 2 weeks',
    })
  }
  // ── Nutrients: deficiency + living soil ─────────────────────────────────────
  else if (lowNut && setup.medium === 'living_soil') {
    warnings.push({
      id: 'nut_def_soil',
      attributes: ['nutrients'],
      severity: sev(n.status),
      message: `Nutrients ${Math.round(n.value)}% low in living soil. Check pH first (lockout is the most common cause). If pH is correct, top-dress with compost.`,
      solutions: [
        { text: 'pH check — eliminate lockout first', action: 'ph_check', cost: 0 },
        { text: 'Top-dress with compost', action: 'topdress', cost: 0 },
      ],
      conflictNote: 'Check pH before adding more amendments',
    })
  }
  // ── Nutrients: general ────────────────────────────────────────────────────
  else if (highNut) {
    warnings.push({
      id: 'nut_excess',
      attributes: ['nutrients'],
      severity: sev(n.status),
      message: `Nutrients ${Math.round(n.value)}% — excess risk (nutrient burn). Brown leaf tips are the first sign. Flush to reset and resume at lower EC.`,
      solutions: [{ text: 'Flush — resets nutrient level', action: 'flush', cost: 0 }],
    })
  } else if (lowNut) {
    warnings.push({
      id: 'nut_deficiency',
      attributes: ['nutrients'],
      severity: sev(n.status),
      message: `Nutrients ${Math.round(n.value)}% — deficiency. ${setup.medium === 'coco' ? 'Coco is inert — feed every watering!' : 'Feed your plant or check pH for lockout.'}`,
      solutions: [
        { text: 'Feed plant', action: 'feed', cost: 0 },
        { text: 'pH check — wrong pH blocks nutrient uptake', action: 'ph_check', cost: 0 },
      ],
    })
  }

  // ── Watering ─────────────────────────────────────────────────────────────────
  if (lowWater && setup.watering === 'manual') {
    warnings.push({
      id: 'underwatered',
      attributes: ['watering'],
      severity: sev(w.status),
      message: `Moisture ${Math.round(w.value)}% — plant is thirsty. Water until 10–20% runoff from the bottom of the pot.`,
      solutions: [{ text: 'Water plant', action: 'water', cost: 0 }],
    })
  } else if (overWater && setup.watering === 'manual') {
    warnings.push({
      id: 'overwatered',
      attributes: ['watering'],
      severity: sev(w.status),
      message: `Moisture ${Math.round(w.value)}% — overwatered. Allow the medium to dry out. Lift the pot — light = needs water, heavy = wait.`,
      solutions: [],
    })
  }

  return warnings
}

// ── estimateYield ──────────────────────────────────────────────────────────────

export function estimateYield(setup: Setup, strainType: 'indica' | 'sativa' | 'hybrid'): number {
  const area = TENT_AREAS[setup.tentSize]
  const baseGramsPerM2 = strainType === 'sativa' ? 420 : strainType === 'indica' ? 380 : 400
  const lightModifier = Math.min(1.3, setup.lightWatts / (area * 400))
  const potModifier = setup.potSize === 'large' ? 1.1 : setup.potSize === 'small' ? 0.85 : 1.0
  return Math.round(area * baseGramsPerM2 * lightModifier * potModifier)
}
