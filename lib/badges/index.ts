import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export const BADGES = {
  // Grower
  first_seed: {
    name: 'First Seed', icon: '🌱',
    condition: 'Start your first virtual grow',
    category: 'grower',
  },
  green_thumb: {
    name: 'Green Thumb', icon: '🌿',
    condition: 'Complete 3 virtual grows',
    category: 'grower',
  },
  master_cultivator: {
    name: 'Master Cultivator', icon: '🏆',
    condition: 'Complete 10 virtual grows',
    category: 'grower',
  },
  consistent_waterer: {
    name: 'Consistent Waterer', icon: '💧',
    condition: '30 days without missed watering',
    category: 'grower',
  },
  pheno_hunter: {
    name: 'Pheno Hunter', icon: '🔬',
    condition: 'Grow 5 different strains',
    category: 'grower',
  },
  no_till_master: {
    name: 'No-Till Master', icon: '🤙',
    condition: 'Complete a living soil no-till grow',
    category: 'grower',
  },
  trichome_chaser: {
    name: 'Trichome Chaser', icon: '⚗️',
    condition: 'Achieve 95%+ quality score on harvest',
    category: 'grower',
  },
  // Community
  og_member: {
    name: 'OG Member', icon: '👑',
    condition: 'Among the first 100 registered users',
    category: 'community',
  },
  social_butterfly: {
    name: 'Social Butterfly', icon: '👥',
    condition: 'Reach 50 followers',
    category: 'community',
  },
  helpful: {
    name: 'Helpful', icon: '📚',
    condition: 'Receive 10 helpful votes on forum answers',
    category: 'community',
  },
  // Shop
  first_purchase: {
    name: 'First Purchase', icon: '🛒',
    condition: 'Complete your first order',
    category: 'shop',
  },
  collector: {
    name: 'Collector', icon: '💎',
    condition: 'Purchase 5 different strains',
    category: 'shop',
  },
  // Seekers
  first_hunt: {
    name: 'First Hunt', icon: '🗺️',
    condition: 'Complete your first Seekers hunt',
    category: 'seekers',
  },
  treasure_hunter: {
    name: 'Treasure Hunter', icon: '🏅',
    condition: 'Find 10 treasures',
    category: 'seekers',
  },
} as const

export type BadgeId = keyof typeof BADGES

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
