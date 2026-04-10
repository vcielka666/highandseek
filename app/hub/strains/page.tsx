import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import { calculateCurrentNeeds, calculateStatus } from '@/lib/avatar/decay'
import StrainDirectoryClient from '@/components/hub/strains/StrainDirectoryClient'

export const dynamic = 'force-dynamic'

export default async function StrainsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/strains')

  await connectDB()

  const strains = await Strain.find({ isActive: true })
    .select('-personality.systemPrompt -personality.customSystemPrompt -personality.forbiddenTopics')
    .sort({ isComingSoon: 1, name: 1 })
    .lean<Array<{
      _id: { toString(): string }
      slug: string
      name: string
      type: 'indica' | 'sativa' | 'hybrid'
      genetics: string
      floweringTime: number
      difficulty: 'easy' | 'medium' | 'hard'
      personality: { archetype: string; catchphrase: string; tone: string[]; favoriteAction: string; hatedAction: string }
      visuals: { avatarLevels: Array<{ level: number; imageUrl: string; animationClass: string }>; idleAnimation: string }
      stats: { totalChats: number; totalMessages: number }
      shopProductSlug: string
      isComingSoon: boolean
    }>>()

  const userStates = await AvatarState.find({ userId: session.user.id })
    .select('strainSlug level xp needs status chatCount')
    .lean<Array<{
      strainSlug: string
      level: number
      xp: number
      needs: { hydration: number; nutrients: number; energy: number; happiness: number; lastUpdated: Date }
      status: string
      chatCount: number
    }>>()

  const stateMap = new Map(userStates.map(s => [s.strainSlug, s]))

  const strainsData = strains.map(strain => {
    const raw = stateMap.get(strain.slug)
    let userState = null
    if (raw) {
      const needs = calculateCurrentNeeds({
        hydration:   raw.needs.hydration,
        nutrients:   raw.needs.nutrients,
        energy:      raw.needs.energy,
        happiness:   raw.needs.happiness,
        lastUpdated: raw.needs.lastUpdated.toISOString(),
      })
      userState = {
        level:     raw.level,
        status:    calculateStatus(needs),
        needs:     {
          hydration:  Math.round(needs.hydration),
          nutrients:  Math.round(needs.nutrients),
          energy:     Math.round(needs.energy),
          happiness:  Math.round(needs.happiness),
        },
        chatCount: raw.chatCount,
      }
    }
    return {
      slug:           strain.slug,
      name:           strain.name,
      type:           strain.type,
      genetics:       strain.genetics,
      floweringTime:  strain.floweringTime,
      difficulty:     strain.difficulty,
      personality:    {
        archetype:      strain.personality.archetype,
        catchphrase:    strain.personality.catchphrase,
        tone:           strain.personality.tone,
        favoriteAction: strain.personality.favoriteAction,
        hatedAction:    strain.personality.hatedAction,
      },
      visuals:        strain.visuals,
      stats:          strain.stats,
      shopProductSlug: strain.shopProductSlug,
      isComingSoon:   strain.isComingSoon,
      userState,
    }
  })

  return <StrainDirectoryClient strains={strainsData} />
}
