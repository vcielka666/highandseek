import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import {
  calculateCurrentNeeds,
  calculateStatus,
  applyCarToNeeds,
  getAvatarLevelForXP,
  getNextAvatarLevel,
  getXpToNextAvatarLevel,
  CARE_COOLDOWNS_MS,
} from '@/lib/avatar/decay'
import { awardXP, XP_EVENTS } from '@/lib/xp/index'

const schema = z.object({
  action: z.enum(['water', 'feed', 'light', 'flush']),
})

const CARE_XP_EVENTS: Record<string, keyof typeof XP_EVENTS> = {
  water: 'STRAIN_CARE_WATER',
  feed:  'STRAIN_CARE_FEED',
  light: 'STRAIN_CARE_LIGHT',
  flush: 'STRAIN_CARE_FLUSH',
}

const AVATAR_XP_PER_CARE: Record<string, number> = {
  water: 5,
  feed:  10,
  light: 5,
  flush: 5,
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { action } = parsed.data

  await connectDB()

  const strain = await Strain.findOne({ slug, isActive: true })
    .select('personality.favoriteAction personality.hatedAction personality.catchphrase name')
    .lean<{ name: string; personality: { favoriteAction: string; hatedAction: string; catchphrase: string } }>()
  if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 })

  // Get or create avatar state
  let avatarState = await AvatarState.findOne({ userId: session.user.id, strainSlug: slug })
  if (!avatarState) {
    avatarState = await AvatarState.create({
      userId:     session.user.id,
      strainSlug: slug,
    })
  }

  // Check cooldown
  const cooldownMs = CARE_COOLDOWNS_MS[action]
  const lastUsed = avatarState.cooldowns[action as keyof typeof avatarState.cooldowns] as Date | null
  if (lastUsed && Date.now() - lastUsed.getTime() < cooldownMs) {
    const availableAt = new Date(lastUsed.getTime() + cooldownMs)
    return NextResponse.json({ onCooldown: true, availableAt: availableAt.toISOString() })
  }

  // Calculate current needs (decay since last save)
  const currentNeeds = calculateCurrentNeeds({
    hydration:   avatarState.needs.hydration,
    nutrients:   avatarState.needs.nutrients,
    energy:      avatarState.needs.energy,
    happiness:   avatarState.needs.happiness,
    lastUpdated: avatarState.needs.lastUpdated.toISOString(),
  })

  const isHated    = action === strain.personality.hatedAction
  const isFavourite = action === strain.personality.favoriteAction

  const updatedNeeds = applyCarToNeeds(currentNeeds, action, isHated, isFavourite)
  const newStatus   = calculateStatus(updatedNeeds)

  // Avatar XP
  const avatarXpGain = AVATAR_XP_PER_CARE[action]
  const newAvatarXP  = avatarState.xp + avatarXpGain
  const oldLevel     = avatarState.level
  const newLevelData = getAvatarLevelForXP(newAvatarXP)
  const avatarLevelUp = newLevelData.level > oldLevel

  // Save state
  avatarState.needs.hydration   = updatedNeeds.hydration
  avatarState.needs.nutrients   = updatedNeeds.nutrients
  avatarState.needs.energy      = updatedNeeds.energy
  avatarState.needs.happiness   = updatedNeeds.happiness
  avatarState.needs.lastUpdated = new Date(updatedNeeds.lastUpdated)
  avatarState.status            = newStatus
  avatarState.xp                = newAvatarXP
  avatarState.level             = newLevelData.level
  avatarState.xpToNextLevel     = getXpToNextAvatarLevel(newAvatarXP)
  avatarState.lastCareAt        = new Date()
  ;(avatarState.cooldowns as Record<string, Date | null>)[action] = new Date()
  avatarState.careHistory.push({ action, timestamp: new Date(), xpEarned: avatarXpGain })
  await avatarState.save()

  // Award user XP
  const xpEventKey = CARE_XP_EVENTS[action]
  const userXpResult = await awardXP(session.user.id, xpEventKey, XP_EVENTS[xpEventKey])

  // Avatar level up: award bonus user XP
  if (avatarLevelUp) {
    await awardXP(session.user.id, 'STRAIN_AVATAR_LEVEL_UP', XP_EVENTS.STRAIN_AVATAR_LEVEL_UP)
  }

  return NextResponse.json({
    success:     true,
    action,
    isHated,
    isFavourite,
    needs: {
      hydration:  Math.round(updatedNeeds.hydration),
      nutrients:  Math.round(updatedNeeds.nutrients),
      energy:     Math.round(updatedNeeds.energy),
      happiness:  Math.round(updatedNeeds.happiness),
      lastUpdated: updatedNeeds.lastUpdated,
    },
    status:        newStatus,
    avatarXp:      newAvatarXP,
    avatarLevel:   newLevelData.level,
    avatarLevelUp,
    avatarLevelName: newLevelData.name,
    nextLevelXp:   getNextAvatarLevel(newLevelData.level)?.xpRequired ?? null,
    userXpEarned:  userXpResult.xp,
    cooldownUntil: new Date(Date.now() + cooldownMs).toISOString(),
  })
}
