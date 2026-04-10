// Server-only XP service — do NOT import this in client components
// For pure utilities (getXPProgress, LEVELS etc.) use lib/xp/utils.ts instead
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import { getLevelForXP } from './utils'

export { XP_EVENTS, LEVELS, getLevelForXP, getNextLevel, getXPProgress } from './utils'
export type { LevelData } from './utils'

export async function awardXP(
  userId: string,
  event: string,
  amount?: number,
  metadata?: Record<string, unknown>,
): Promise<{ xp: number; levelUp: boolean; newLevel: import('./utils').LevelData | null }> {
  await connectDB()

  const { XP_EVENTS } = await import('./utils')
  const xpAmount = amount ?? (XP_EVENTS[event as keyof typeof XP_EVENTS] ?? 0)
  if (xpAmount === 0) return { xp: 0, levelUp: false, newLevel: null }

  const user = await User.findById(userId).select('xp level')
  if (!user) throw new Error('User not found')

  const oldLevel = user.level
  const newXP = user.xp + xpAmount
  const newLevelData = getLevelForXP(newXP)
  const levelUp = newLevelData.level > oldLevel

  await User.findByIdAndUpdate(userId, {
    $inc: { xp: xpAmount, totalXpEarned: xpAmount },
    ...(levelUp ? { level: newLevelData.level } : {}),
  })

  await XPEvent.create({ userId, event, amount: xpAmount, metadata: metadata ?? {} })

  return { xp: newXP, levelUp, newLevel: levelUp ? newLevelData : null }
}
