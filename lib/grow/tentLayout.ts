// ── SVG tent coordinate system ────────────────────────────────────────────────
// Single source of truth for all tent element positions.
// viewBox="0 0 1000 750" — never use px values here.

export const SVG_W = 1000
export const SVG_H = 750
export const TENT_FLOOR_Y = 640  // SVG Y of the tent floor surface

// All element positions in SVG coordinate space
export const TENT_LAYOUT = {
  light:    { x: 330, y: 15,  w: 340, h: 200 },
  exhaust:  { x: 870, y: 25,  w: 100, h: 125 },
  sonoflex: { x: 775, y: 90,  w: 65,  h: 210 },
  filter:   { x: 840, y: 340, w: 120, h: 210 },
  circ:     { x: 125, y: 270, w: 90,  h: 90  },
  hygro:    { x: 770, y: 210, w: 90,  h: 90  },
  medium:   { x: 30,  y: 560, w: 160, h: 170 },
  ph:       { x: 790, y: 590, w: 85,  h: 150 },
  tray:     { x: 100, y: 685, w: 800, h: 55  },
} as const

// Equipment image URLs
export const EQUIP_IMGS = {
  tentBg:      'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046694/tent-bg_tqvklk.png',
  tentBgDark:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775213761/tent-bg-dark_tdybst.png',
  exhaust:     'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046842/fan-exhaust_d6cc5c.png',
  circulation: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046841/fan-circulation_q6zbyi.png',
  filter:      'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046888/carbon-filter_zk4axj.png',
  mediumSoil:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046962/medium-soil_zbyoum.png',
} as const

// ── Lamp ─────────────────────────────────────────────────────────────────────

// 80 cm from canopy (lamp high) → y=35  (original ceiling position, unchanged)
// 5  cm from canopy (lamp low)  → y=350 lamp bottom ~600, near plant canopy
export function lampTopSVG(heightCm: number): number {
  const clamped = Math.min(80, Math.max(5, heightCm))
  return Math.round(35 + ((80 - clamped) / 75) * 315)
}

// Lamp image dimensions in SVG units (+25% from original 120/160 × 200)
export function getLampSVGWidth(lightType: string): number {
  return lightType === 'cfl' ? 150 : 200
}

export function getLampSVGHeight(): number {
  return 250
}

// Light image URL — HPS and CFL have separate on/off images
export function getLightImageUrl(lightType: string, isOn: boolean): string {
  if (lightType === 'hps') return isOn ? '/equip/lights/tent/hps on.png' : '/equip/lights/tent/hps.png'
  if (lightType === 'cfl') return isOn ? '/equip/lights/tent/cfl on.png' : '/equip/lights/tent/cfl.png'
  if (lightType === 'led') return 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046794/light-led_o3w4p6.png'
  return '/equip/lights/cmh.png'
}

// ── Plant foreignObject sizing ────────────────────────────────────────────────
// containerWidth is capped so containerH = w * 1.6 never exceeds TENT_FLOOR_Y (640)
// MAX_PLANT_W = floor(640 / 1.6) = 400

const PLANT_COUNT_MULT: Record<number, number> = { 1: 1.0, 2: 0.65, 3: 0.5, 4: 0.4 }
const TENT_SIZE_MULT: Record<string, number> = {
  '60x60': 0.7, '80x80': 0.85, '100x100': 1.0, '120x120': 1.1, '150x150': 1.25,
}
const MAX_PLANT_W = 264

export function getPlantContainerWidth(potCount: number, tentSize: string): number {
  const cMult = PLANT_COUNT_MULT[potCount] ?? 1.0
  const tMult = TENT_SIZE_MULT[tentSize] ?? 1.0
  return Math.min(MAX_PLANT_W, Math.round(264 * cMult * tMult))
}

// foreignObject spans Y=0 → TENT_FLOOR_Y, plant renders bottom-anchored inside
export const PLANT_FO_Y = 0
export const PLANT_FO_H = TENT_FLOOR_Y  // = 640

// foreignObject X: centered at SVG_W / 2 = 500
export function getPlantFOX(containerWidth: number): number {
  return Math.round(SVG_W / 2 - containerWidth / 2)
}

// ── Colour helpers ────────────────────────────────────────────────────────────

export function getTempColor(temp: number): string {
  if (temp < 18 || temp > 30) return '#cc00aa'
  if ((temp >= 18 && temp < 20) || (temp > 28 && temp <= 30)) return '#f0a830'
  return '#00d4c8'
}

export function getHumidityColor(humidity: number, stage = 'veg'): string {
  const isFlower = stage === 'flower' || stage === 'late_flower' || stage === 'harvest'
  const [low, high] = isFlower ? [40, 55] : [55, 75]
  if (humidity < low - 15 || humidity > high + 15) return '#cc00aa'
  if (humidity < low || humidity > high) return '#f0a830'
  return '#00d4c8'
}
