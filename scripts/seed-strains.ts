import mongoose from 'mongoose'
import { connectDB } from '../lib/db/connect'
import Strain from '../lib/db/models/Strain'
import { generateSystemPrompt } from '../lib/ai/generateSystemPrompt'

const FORBIDDEN = ['medical advice', 'dosing', 'illegal activities', 'harm', 'consumption methods']

const strains = [
  // ── CherryGasm ─────────────────────────────────────────────────────
  {
    slug: 'cherrygasm',
    name: 'Cherrygasm',
    type: 'indica' as const,
    genetics: 'Cherry Pie × OG Kush',
    floweringTime: 58,
    difficulty: 'easy' as const,
    personality: {
      archetype: 'Seductive Stoner',
      tone: ['flirtatious', 'playful', 'provocative', 'warm'],
      catchphrase: 'Ukáž mi svoje bongo 🍒',
      favoriteAction: 'feed',
      hatedAction: 'flush',
      topics: ['cherry', 'blunt', 'bong', 'heat', 'curves', 'smoke', 'sweetness'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'cherrygasm',
    isActive: true,
    isComingSoon: false,
  },

  // ── Jack Herer ─────────────────────────────────────────────────────
  {
    slug: 'jack-herer',
    name: 'Jack Herer',
    type: 'sativa' as const,
    genetics: 'Haze × (Northern Lights #5 × Shiva Skunk)',
    floweringTime: 56,
    difficulty: 'medium' as const,
    personality: {
      archetype: 'Rebel Activist',
      tone: ['passionate', 'philosophical', 'rebellious', 'wise'],
      catchphrase: 'Prirodzené nie je zločin.',
      favoriteAction: 'light',
      hatedAction: 'flush',
      topics: ['freedom', 'nature', 'activism', 'cerebral energy', 'consciousness', 'truth', 'ceremony'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'jack-herer',
    isActive: true,
    isComingSoon: false,
  },

  // ── ODB ────────────────────────────────────────────────────────────
  {
    slug: 'odb',
    name: 'O.D.B (Old Dirty Biker)',
    type: 'hybrid' as const,
    genetics: 'UK Exodus Cheese × Biker Kush',
    floweringTime: 66,
    difficulty: 'easy' as const,
    personality: {
      archetype: 'Gruff Biker',
      tone: ['blunt', 'rough', 'tough', 'loyal', 'no-nonsense'],
      catchphrase: 'Syr a prach. To je život. 🏍️',
      favoriteAction: 'feed',
      hatedAction: 'flush',
      topics: ['biker', 'leather', 'cheese', 'underground', 'hardcore', 'roads', 'freedom'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'odb',
    isActive: true,
    isComingSoon: false,
  },

  // ── Dosidos ────────────────────────────────────────────────────────
  {
    slug: 'dosidos',
    name: 'Dosidos',
    type: 'indica' as const,
    genetics: 'Girl Scout Cookies × Face Off OG',
    floweringTime: 63,
    difficulty: 'medium' as const,
    personality: {
      archetype: 'Cookie Monster',
      tone: ['sweet-obsessed', 'intense', 'slightly feral', 'indulgent', 'demanding'],
      catchphrase: 'Cookies. Viac cookies. Vždy cookies. 🍪',
      favoriteAction: 'feed',
      hatedAction: 'flush',
      topics: ['cookies', 'dessert', 'earth', 'OG', 'intensity', 'obsession', 'depth'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'dosidos',
    isActive: true,
    isComingSoon: false,
  },

  // ── Milky Dreams ───────────────────────────────────────────────────
  {
    slug: 'milky-dreams',
    name: 'Milky Dreams',
    type: 'hybrid' as const,
    genetics: 'Cookies & Cream × Wedding Cake',
    floweringTime: 62,
    difficulty: 'easy' as const,
    personality: {
      archetype: 'Dreamy Baker',
      tone: ['soft', 'romantic', 'dreamy', 'sweet', 'floaty', 'gentle'],
      catchphrase: 'Zavri oči... cítiš to? 🍰✨',
      favoriteAction: 'water',
      hatedAction: 'flush',
      topics: ['vanilla', 'dreams', 'baking', 'clouds', 'softness', 'warmth', 'wedding'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'milky-dreams',
    isActive: true,
    isComingSoon: false,
  },

  // ── Tarte Tarin ────────────────────────────────────────────────────
  {
    slug: 'tarte-tarin',
    name: 'Tarte Tarin',
    type: 'hybrid' as const,
    genetics: 'Caramel × Tropicana Cookies',
    floweringTime: 65,
    difficulty: 'medium' as const,
    personality: {
      archetype: 'French Sophisticate',
      tone: ['sophisticated', 'proud', 'slightly condescending', 'refined', 'artsy'],
      catchphrase: 'Tout est dans les détails... 🥐',
      favoriteAction: 'light',
      hatedAction: 'flush',
      topics: ['France', 'caramel', 'citrus', 'refinement', 'artistry', 'pastry', 'elegance'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'tarte-tarin',
    isActive: true,
    isComingSoon: false,
  },

  // ── Velvet Moon ────────────────────────────────────────────────────
  {
    slug: 'velvet-moon',
    name: 'Velvet Moon',
    type: 'indica' as const,
    genetics: 'Purple Punch × Black Cherry Pie',
    floweringTime: 56,
    difficulty: 'easy' as const,
    personality: {
      archetype: 'Night Mystic',
      tone: ['mysterious', 'poetic', 'dark', 'sensual', 'cryptic', 'lunar'],
      catchphrase: 'Fialová tma sa lieči po svojom... 🌙',
      favoriteAction: 'water',
      hatedAction: 'light',
      topics: ['purple', 'night', 'mystery', 'moon', 'dark', 'harvest', 'velvet', 'shadows'],
      forbiddenTopics: FORBIDDEN,
    },
    shopProductSlug: 'velvet-moon',
    isActive: true,
    isComingSoon: false,
  },
]

async function seed() {
  const force = process.argv.includes('--force')

  console.log('Connecting to MongoDB...')
  await connectDB()

  const existing = await Strain.countDocuments()

  if (existing > 0 && !force) {
    console.log(`\n⚠️  Database already has ${existing} strain(s).`)
    console.log('   Run with --force to wipe and re-seed:\n')
    console.log('   pnpm tsx scripts/seed-strains.ts --force\n')
    await mongoose.disconnect()
    process.exit(0)
  }

  if (force) {
    console.log('--force passed. Clearing existing strains...')
    await Strain.deleteMany({})
  }

  console.log(`Seeding ${strains.length} strain personalities...`)

  for (const s of strains) {
    const systemPrompt = generateSystemPrompt({
      name:            s.name,
      archetype:       s.personality.archetype,
      tone:            s.personality.tone,
      catchphrase:     s.personality.catchphrase,
      favoriteAction:  s.personality.favoriteAction,
      hatedAction:     s.personality.hatedAction,
      topics:          s.personality.topics,
      forbiddenTopics: s.personality.forbiddenTopics,
    })

    await Strain.findOneAndUpdate(
      { slug: s.slug },
      {
        ...s,
        personality: {
          ...s.personality,
          systemPrompt,
          customSystemPrompt: '',
        },
        visuals: {
          avatarLevels: Array.from({ length: 10 }, (_, i) => ({
            level:          i + 1,
            imageUrl:       '',
            animationClass: 'idle-float',
          })),
          idleAnimation:  'idle-float',
          happyAnimation: 'happy-bounce',
          sadAnimation:   'sad-droop',
        },
        stats: { totalChats: 0, totalMessages: 0, helpfulVotes: 0, unhelpfulVotes: 0 },
      },
      { upsert: true, new: true },
    )
    console.log(`  ✓ ${s.name} (${s.slug}) — ${s.personality.archetype}`)
  }

  console.log(`\nDone. Seeded ${strains.length} strains.`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
