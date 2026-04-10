import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
export { BADGES } from './config'
export type { BadgeId } from './config'
import type { BadgeId } from './config'

export async function awardBadge(userId: string, badgeId: BadgeId): Promise<boolean> {
  await connectDB()
  const user = await User.findById(userId).select('badges')
  if (!user) return false
  const already = user.badges.some((b: { badgeId?: string | null }) => b.badgeId === badgeId)
  if (already) return false
  await User.findByIdAndUpdate(userId, {
    $push: { badges: { badgeId, earnedAt: new Date() } },
  })
  return true
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeId[]> {
  await connectDB()
  const user = await User.findById(userId).select('badges growsCompleted followers xp')
  if (!user) return []

  const earned = new Set(user.badges.map((b: { badgeId?: string | null }) => b.badgeId ?? ''))
  const newBadges: BadgeId[] = []

  async function check(id: BadgeId, condition: boolean) {
    if (!earned.has(id) && condition) {
      const awarded = await awardBadge(userId, id)
      if (awarded) newBadges.push(id)
    }
  }

  await check('green_thumb', user.growsCompleted >= 3)
  await check('master_cultivator', user.growsCompleted >= 10)
  await check('social_butterfly', user.followers.length >= 50)

  return newBadges
}

export async function checkAcademyBadges(
  userId: string,
  context: {
    isPerfect: boolean
    topicSlug: string
    allSpeedDemon: boolean
    completedTopicSlugs: string[]
    perfectTopicSlugs: string[]
  },
): Promise<BadgeId[]> {
  await connectDB()
  const user = await User.findById(userId).select('badges')
  if (!user) return []

  const earned = new Set(user.badges.map((b: { badgeId?: string | null }) => b.badgeId ?? ''))
  const newBadges: BadgeId[] = []

  async function check(id: BadgeId, condition: boolean) {
    if (!earned.has(id) && condition) {
      const awarded = await awardBadge(userId, id)
      if (awarded) newBadges.push(id)
    }
  }

  const ALL_TOPIC_SLUGS = [
    'zaklady-pestovania',
    'voda-zivy-medium',
    'svetlo-prostredie',
    'techniky-pestovania',
    'genetika-breeding',
  ]

  await check('first_quiz', true) // always true — user just completed a quiz
  await check('perfect_score', context.isPerfect)
  await check('speed_demon', context.allSpeedDemon)
  await check('scholar', ALL_TOPIC_SLUGS.every(s => context.completedTopicSlugs.includes(s)))
  await check('academy_graduate', ALL_TOPIC_SLUGS.every(s => context.perfectTopicSlugs.includes(s)))
  await check('geneticist_badge', context.isPerfect && context.topicSlug === 'genetika-breeding')
  await check('light_wizard', context.isPerfect && context.topicSlug === 'svetlo-prostredie')

  return newBadges
}
