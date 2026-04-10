// Pure XP utilities — no DB imports, safe to use in client components

export const XP_EVENTS = {
  WATER_PLANT:              5,
  FEED_PLANT:               10,
  LST_APPLIED:              25,
  DEFOLIATION:              15,
  CORRECT_EVENT_RESPONSE:   50,
  GROW_COMPLETED:           200,
  FIRST_STRAIN_CHAT:        20,
  LONG_CHAT_SESSION:        30,
  FORUM_QUESTION:           10,
  FORUM_HELPFUL_ANSWER:     50,
  FIRST_PURCHASE:           50,
  PRODUCT_REVIEW:           25,
  SEEKERS_TREASURE_FOUND:   100,
  SEEKERS_HUNT_EVENT:       150,
  PROFILE_COMPLETED:        30,
  FIRST_FOLLOWER:           20,
  ACADEMY_ARTICLE_READ:     15,
  ACADEMY_QUIZ_PASSED:          40,
  QUIZ_CORRECT_PHASE1:          10,
  QUIZ_CORRECT_PHASE2:          15,
  QUIZ_CORRECT_PHASE3:          25,
  QUIZ_SPEED_BONUS:             10,
  QUIZ_PERFECT_SCORE:           150,
  ACADEMY_TOPIC_FIRST_COMPLETE: 50,
  // Strain Avatar
  STRAIN_FIRST_CHAT:         20,
  STRAIN_CHAT_MESSAGE:       15,
  STRAIN_CARE_WATER:          5,
  STRAIN_CARE_FEED:          10,
  STRAIN_CARE_LIGHT:          5,
  STRAIN_CARE_FLUSH:          5,
  STRAIN_AVATAR_LEVEL_UP:    50,
  STRAIN_CHAT_SESSION_LONG:  30,
  STRAIN_BG_CHANGE:           3,
} as const

export const LEVELS = [
  { level: 1,  name: 'Seedling',     xpRequired: 0      },
  { level: 2,  name: 'Sprout',       xpRequired: 500    },
  { level: 3,  name: 'Vegetating',   xpRequired: 1500   },
  { level: 4,  name: 'Pre-flower',   xpRequired: 3500   },
  { level: 5,  name: 'Flowering',    xpRequired: 7500   },
  { level: 6,  name: 'Trichome',     xpRequired: 15000  },
  { level: 7,  name: 'Harvest Ready',xpRequired: 30000  },
  { level: 8,  name: 'Cured',        xpRequired: 55000  },
  { level: 9,  name: 'Connoisseur',  xpRequired: 90000  },
  { level: 10, name: 'Master Grower',xpRequired: 150000 },
] as const

export type LevelData = typeof LEVELS[number]

export function getLevelForXP(xp: number): LevelData {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): LevelData | null {
  return LEVELS.find(l => l.level === currentLevel + 1) ?? null
}

export function getXPProgress(xp: number): {
  current: LevelData
  next: LevelData | null
  progressXP: number
  neededXP: number
  percent: number
} {
  const current = getLevelForXP(xp)
  const next = getNextLevel(current.level)
  if (!next) {
    return { current, next: null, progressXP: xp - current.xpRequired, neededXP: 0, percent: 100 }
  }
  const progressXP = xp - current.xpRequired
  const neededXP = next.xpRequired - current.xpRequired
  const percent = Math.min(100, Math.round((progressXP / neededXP) * 100))
  return { current, next, progressXP, neededXP, percent }
}
