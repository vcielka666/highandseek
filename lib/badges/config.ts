export const BADGES = {
  // Grower
  first_seed: {
    name: 'First Seed', icon: '🌱',
    condition: 'Start your first grow simulation',
    category: 'grower',
  },
  green_thumb: {
    name: 'Green Thumb', icon: '🌿',
    condition: 'Complete 3 grow simulations',
    category: 'grower',
  },
  master_cultivator: {
    name: 'Master Cultivator', icon: '🏆',
    condition: 'Complete 10 grow simulations',
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
  // Academy
  first_quiz: {
    name: 'First Quiz', icon: '🌱',
    condition: 'Complete any quiz',
    category: 'academy',
  },
  perfect_score: {
    name: 'Perfect Score', icon: '🎯',
    condition: 'Score 15/15 on any quiz',
    category: 'academy',
  },
  speed_demon: {
    name: 'Speed Demon', icon: '⚡',
    condition: 'Answer all phase 3 questions in under 10 seconds',
    category: 'academy',
  },
  scholar: {
    name: 'Scholar', icon: '📚',
    condition: 'Complete all 5 academy topics',
    category: 'academy',
  },
  academy_graduate: {
    name: 'Academy Graduate', icon: '🎓',
    condition: 'Score 100% on all 5 topics',
    category: 'academy',
  },
  geneticist_badge: {
    name: 'Geneticist', icon: '🧬',
    condition: 'Perfect score on Genetics & Breeding topic',
    category: 'academy',
  },
  light_wizard: {
    name: 'Light Wizard', icon: '💡',
    condition: 'Perfect score on Light & Environment topic',
    category: 'academy',
  },
} as const

export type BadgeId = keyof typeof BADGES
