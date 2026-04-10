import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import { calculateCurrentNeeds, calculateStatus, getAvatarLevelForXP, getXpToNextAvatarLevel } from '@/lib/avatar/decay'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      personality: { archetype: string; catchphrase: string; tone: string[]; favoriteAction: string; hatedAction: string; topics: string[] }
      visuals: { avatarLevels: Array<{ level: number; imageUrl: string; animationClass: string }>; idleAnimation: string; happyAnimation: string; sadAnimation: string }
      stats: { totalChats: number; totalMessages: number; helpfulVotes: number; unhelpfulVotes: number }
      shopProductSlug: string
      isComingSoon: boolean
    }>()

  if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 })

  const rawState = await AvatarState.findOne({ userId: session.user.id, strainSlug: slug })
    .lean<{
      level: number
      xp: number
      needs: { hydration: number; nutrients: number; energy: number; happiness: number; lastUpdated: Date }
      status: string
      cooldowns: { water: Date | null; feed: Date | null; light: Date | null; flush: Date | null }
      chatCount: number
      lastChatAt: Date | null
    }>()

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
      status:       calculateStatus(needs),
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
      chatCount:  rawState.chatCount,
      lastChatAt: rawState.lastChatAt?.toISOString() ?? null,
    }
  }

  return NextResponse.json({ strain, userState })
}
