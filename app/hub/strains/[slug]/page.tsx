import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import StrainChat from '@/lib/db/models/StrainChat'
import User from '@/lib/db/models/User'
import {
  calculateCurrentNeeds,
  calculateStatus,
  getAvatarLevelForXP,
  getXpToNextAvatarLevel,
} from '@/lib/avatar/decay'
import StrainProfileClient from '@/components/hub/strains/StrainProfileClient'

export const dynamic = 'force-dynamic'

export default async function StrainProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/strains')

  const { slug } = await params
  await connectDB()

  const strain = await Strain.findOne({ slug, isActive: true })
    .select('-personality.systemPrompt -personality.customSystemPrompt')
    .lean<{
      _id: { toString(): string }
      slug: string
      name: string
      type: 'indica' | 'sativa' | 'hybrid'
      genetics: string
      floweringTime: number
      difficulty: 'easy' | 'medium' | 'hard'
      personality: {
        archetype: string
        catchphrase: string
        tone: string[]
        favoriteAction: string
        hatedAction: string
        topics: string[]
      }
      visuals: {
        avatarLevels: Array<{ level: number; imageUrl: string; animationClass: string }>
        backgrounds: Array<{ url: string; moodHint: string }>
        idleAnimation: string
        happyAnimation: string
        sadAnimation: string
      }
      stats: { totalChats: number; totalMessages: number; helpfulVotes: number; unhelpfulVotes: number }
      shopProductSlug: string
      isComingSoon: boolean
    }>()

  if (!strain) notFound()

  const [rawState, userDoc] = await Promise.all([
    AvatarState.findOne({ userId: session.user.id, strainSlug: slug })
      .lean<{
        level: number
        xp: number
        needs: { hydration: number; nutrients: number; energy: number; happiness: number; lastUpdated: Date }
        status: string
        cooldowns: { water: Date | null; feed: Date | null; light: Date | null; flush: Date | null }
        chatCount: number
        lastChatAt: Date | null
        customBackground: string
        unlockedBackgrounds: string[]
      }>(),
    User.findById(session.user.id).select('credits').lean<{ credits: number }>(),
  ])

  let userState = null
  if (rawState) {
    const needs = calculateCurrentNeeds({
      hydration:   rawState.needs.hydration,
      nutrients:   rawState.needs.nutrients,
      energy:      rawState.needs.energy,
      happiness:   rawState.needs.happiness,
      lastUpdated: rawState.needs.lastUpdated.toISOString(),
    })
    userState = {
      level:        rawState.level,
      xp:           rawState.xp,
      xpToNextLevel: getXpToNextAvatarLevel(rawState.xp),
      levelName:    getAvatarLevelForXP(rawState.xp).name,
      status:       calculateStatus(needs) as 'thriving' | 'happy' | 'neutral' | 'sad' | 'wilting',
      needs: {
        hydration:   Math.round(needs.hydration),
        nutrients:   Math.round(needs.nutrients),
        energy:      Math.round(needs.energy),
        happiness:   Math.round(needs.happiness),
        lastUpdated: needs.lastUpdated,
      },
      cooldowns: {
        water: rawState.cooldowns.water?.toISOString() ?? null,
        feed:  rawState.cooldowns.feed?.toISOString()  ?? null,
        light: rawState.cooldowns.light?.toISOString() ?? null,
        flush: rawState.cooldowns.flush?.toISOString() ?? null,
      },
      chatCount:           rawState.chatCount,
      customBackground:    rawState.customBackground    ?? '',
      unlockedBackgrounds: rawState.unlockedBackgrounds ?? [],
    }
  }

  // Last 20 messages
  const recentChats = await StrainChat.find({ userId: session.user.id, strainSlug: slug })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean<Array<{ messages: Array<{ role: string; content: string; timestamp: Date }> }>>()

  const chatHistory = recentChats
    .reverse()
    .flatMap(c => c.messages)
    .slice(-20)
    .map(m => ({
      role:      m.role as 'user' | 'assistant',
      content:   m.content,
      timestamp: m.timestamp.toISOString(),
    }))

  const strainData = {
    slug:           strain.slug,
    name:           strain.name,
    type:           strain.type,
    genetics:       strain.genetics,
    floweringTime:  strain.floweringTime,
    difficulty:     strain.difficulty,
    personality: {
      archetype:      strain.personality.archetype,
      catchphrase:    strain.personality.catchphrase,
      tone:           strain.personality.tone,
      favoriteAction: strain.personality.favoriteAction,
      hatedAction:    strain.personality.hatedAction,
      topics:         strain.personality.topics,
    },
    visuals:         strain.visuals,
    stats:           strain.stats,
    shopProductSlug: strain.shopProductSlug,
    isComingSoon:    strain.isComingSoon,
  }

  return (
    <StrainProfileClient
      strain={strainData}
      initialUserState={userState}
      initialChatHistory={chatHistory}
      userCredits={userDoc?.credits ?? 0}
    />
  )
}
