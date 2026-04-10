// Pure utility — no DB imports. Calculate decayed needs from lastUpdated timestamp.
// Import in both client and server components.

export const AVATAR_LEVELS = [
  { level: 1,  name: 'Seedling',   xpRequired: 0    },
  { level: 2,  name: 'Cutting',    xpRequired: 50   },
  { level: 3,  name: 'Vegetating', xpRequired: 150  },
  { level: 4,  name: 'Pre-Flower', xpRequired: 300  },
  { level: 5,  name: 'Flowering',  xpRequired: 500  },
  { level: 6,  name: 'Trichoming', xpRequired: 750  },
  { level: 7,  name: 'Ripening',   xpRequired: 1050 },
  { level: 8,  name: 'Harvest',    xpRequired: 1400 },
  { level: 9,  name: 'Cured',      xpRequired: 1800 },
  { level: 10, name: 'Legendary',  xpRequired: 2500 },
] as const

export type AvatarLevelData = typeof AVATAR_LEVELS[number]

export type AvatarStatus = 'thriving' | 'happy' | 'neutral' | 'sad' | 'wilting'

export interface NeedsData {
  hydration:   number
  nutrients:   number
  energy:      number
  happiness:   number
  lastUpdated: string // ISO string
}

export function getAvatarLevelForXP(xp: number): AvatarLevelData {
  for (let i = AVATAR_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= AVATAR_LEVELS[i].xpRequired) return AVATAR_LEVELS[i]
  }
  return AVATAR_LEVELS[0]
}

export function getNextAvatarLevel(currentLevel: number): AvatarLevelData | null {
  return AVATAR_LEVELS.find(l => l.level === currentLevel + 1) ?? null
}

export function getXpToNextAvatarLevel(xp: number): number {
  const current = getAvatarLevelForXP(xp)
  const next = getNextAvatarLevel(current.level)
  if (!next) return 0
  return next.xpRequired - xp
}

export function calculateCurrentNeeds(stored: NeedsData): NeedsData {
  const now = Date.now()
  const lastUpdated = new Date(stored.lastUpdated).getTime()
  const hoursElapsed = (now - lastUpdated) / 3_600_000

  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  // Determine happiness decay rate — faster if no chat in 48h
  const happinessDecayRate = hoursElapsed >= 48 ? 2 : 0.5

  return {
    hydration:   clamp(stored.hydration  - hoursElapsed * 1.0),
    nutrients:   clamp(stored.nutrients  - hoursElapsed * 0.5),
    energy:      clamp(stored.energy     - hoursElapsed * 0.75),
    happiness:   clamp(stored.happiness  - hoursElapsed * happinessDecayRate),
    lastUpdated: new Date().toISOString(),
  }
}

export function calculateStatus(needs: NeedsData): AvatarStatus {
  const avg = (needs.hydration + needs.nutrients + needs.energy + needs.happiness) / 4
  if (avg >= 80) return 'thriving'
  if (avg >= 60) return 'happy'
  if (avg >= 40) return 'neutral'
  if (avg >= 20) return 'sad'
  return 'wilting'
}

export function calculateXpMultiplier(status: AvatarStatus): number {
  switch (status) {
    case 'thriving': return 1.5
    case 'happy':    return 1.2
    case 'neutral':  return 1.0
    case 'sad':      return 0.7
    case 'wilting':  return 0.3
  }
}

export const CARE_COOLDOWNS_MS: Record<string, number> = {
  water: 8  * 3_600_000,
  feed:  24 * 3_600_000,
  light: 12 * 3_600_000,
  flush: 72 * 3_600_000,
}

export function applyCarToNeeds(
  current: NeedsData,
  action: string,
  isHated: boolean,
  isFavourite: boolean,
): NeedsData {
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  const n = { ...current, lastUpdated: new Date().toISOString() }

  switch (action) {
    case 'water':
      n.hydration = clamp(n.hydration + 40)
      n.energy    = clamp(n.energy    + 5)
      break
    case 'feed':
      n.nutrients = clamp(n.nutrients + 40)
      n.energy    = clamp(n.energy    + 5)
      break
    case 'light':
      n.energy    = clamp(n.energy    + 40)
      n.happiness = clamp(n.happiness + 5)
      break
    case 'flush':
      n.hydration = clamp(n.hydration + 20)
      n.nutrients = clamp(n.nutrients - 30)
      break
  }

  if (isHated)     n.happiness = clamp(n.happiness - 15)
  if (isFavourite) n.happiness = clamp(n.happiness + 10)

  return n
}

export function formatCooldownRemaining(availableAt: Date | string): string {
  const ms = new Date(availableAt).getTime() - Date.now()
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
