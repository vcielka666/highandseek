import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import StrainChat from '@/lib/db/models/StrainChat'
import {
  calculateCurrentNeeds,
  calculateStatus,
  calculateXpMultiplier,
  getAvatarLevelForXP,
  getNextAvatarLevel,
  getXpToNextAvatarLevel,
} from '@/lib/avatar/decay'
import { awardXP, XP_EVENTS } from '@/lib/xp/index'

const client = new Anthropic()

const schema = z.object({
  message: z.string().min(1).max(1000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { message } = parsed.data

  await connectDB()

  const strain = await Strain.findOne({ slug, isActive: true })
    .lean<{
      name: string
      personality: {
        systemPrompt: string
        customSystemPrompt: string
        archetype: string
        favoriteAction: string
        hatedAction: string
      }
      visuals: {
        backgrounds: Array<{ url: string; moodHint: string }>
      }
    }>()
  if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 })

  // Get or create avatar state
  let avatarState = await AvatarState.findOne({ userId: session.user.id, strainSlug: slug })
  const isFirstChat = !avatarState

  if (!avatarState) {
    avatarState = await AvatarState.create({ userId: session.user.id, strainSlug: slug })
  }

  // Calculate current needs
  const avatarNeeds = avatarState.needs!
  const currentNeeds = calculateCurrentNeeds({
    hydration:   avatarNeeds.hydration,
    nutrients:   avatarNeeds.nutrients,
    energy:      avatarNeeds.energy,
    happiness:   avatarNeeds.happiness,
    lastUpdated: avatarNeeds.lastUpdated.toISOString(),
  })
  const status = calculateStatus(currentNeeds)
  const xpMultiplier = calculateXpMultiplier(status)

  // Get recent chat history for context
  const recentChat = await StrainChat.findOne({ userId: session.user.id, strainSlug: slug })
    .sort({ createdAt: -1 })
    .lean<{ messages: Array<{ role: 'user' | 'assistant'; content: string }> }>()

  const historyMessages = (recentChat?.messages ?? [])
    .slice(-10)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Build system prompt with mood context
  const basePrompt = strain.personality.customSystemPrompt || strain.personality.systemPrompt
  let moodAddendum = ''
  if (status === 'wilting') {
    moodAddendum = '\n\nCURRENT MOOD: You are weak, exhausted, and barely hanging on. You desperately need water, nutrients, and attention. Hint heavily that you need care before you can chat properly. Be dramatic about it.'
  } else if (status === 'sad') {
    moodAddendum = '\n\nCURRENT MOOD: You are sad and neglected. You\'re still talking but you\'re clearly not yourself. Brief moments of your personality break through the sadness.'
  } else if (status === 'thriving') {
    moodAddendum = '\n\nCURRENT MOOD: You are thriving — peak condition, maximum charisma. You are extra witty, extra in-character, and absolutely unstoppable today.'
  }

  // Inject active background mood hint if one is set
  let bgMoodAddendum = ''
  const activeBg = avatarState?.customBackground ?? ''
  if (activeBg) {
    // Check if it matches a template bg
    const templateMatch = (strain.visuals?.backgrounds ?? []).find(b => b.url === activeBg)
    const hint = templateMatch ? templateMatch.moodHint : (avatarState?.customMoodHint ?? '')
    if (hint.trim()) {
      bgMoodAddendum = `\n\nBACKGROUND ATMOSPHERE: The user has set a custom scene for you. Let this subtly influence your energy and references: "${hint.trim()}"`
    }
  }

  const systemPrompt = basePrompt + moodAddendum + bgMoodAddendum

  // Call Claude
  let aiResponse = ''
  if (!process.env.ANTHROPIC_API_KEY) {
    aiResponse = `[${strain.name} AI unavailable — ANTHROPIC_API_KEY not configured]`
  } else {
    try {
      const response = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system:     systemPrompt,
        messages:   [
          ...historyMessages,
          { role: 'user', content: message },
        ],
      })
      aiResponse = response.content[0].type === 'text' ? response.content[0].text : ''
    } catch (err) {
      console.error('[strain/chat]', err)
      return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
    }
  }

  // Save to StrainChat
  const timestamp = new Date()
  let chatDoc = await StrainChat.findOne({ userId: session.user.id, strainSlug: slug }).sort({ createdAt: -1 })
  if (!chatDoc || (chatDoc.messages?.length ?? 0) >= 50) {
    chatDoc = await StrainChat.create({
      userId:     session.user.id,
      strainSlug: slug,
      messages:   [],
    })
  }
  chatDoc.messages.push(
    { role: 'user',      content: message,    timestamp },
    { role: 'assistant', content: aiResponse, timestamp: new Date() },
  )
  const msgCount = chatDoc.messages.length

  // XP for user
  const baseXP    = XP_EVENTS.STRAIN_CHAT_MESSAGE
  const xpEarned  = Math.round(baseXP * xpMultiplier)
  chatDoc.xpEarned = (chatDoc.xpEarned ?? 0) + xpEarned
  await chatDoc.save()

  // Update needs: happiness +15
  currentNeeds.happiness = Math.min(100, currentNeeds.happiness + 15)
  currentNeeds.lastUpdated = new Date().toISOString()
  const newStatus = calculateStatus(currentNeeds)

  // Avatar XP
  const avatarXpGain = Math.round(baseXP * xpMultiplier)
  const newAvatarXP  = avatarState.xp + avatarXpGain
  const oldLevel     = avatarState.level
  const newLevelData = getAvatarLevelForXP(newAvatarXP)
  const avatarLevelUp = newLevelData.level > oldLevel

  avatarState.needs!.hydration   = currentNeeds.hydration
  avatarState.needs!.nutrients   = currentNeeds.nutrients
  avatarState.needs!.energy      = currentNeeds.energy
  avatarState.needs!.happiness   = currentNeeds.happiness
  avatarState.needs!.lastUpdated = new Date()
  avatarState.status            = newStatus
  avatarState.xp                = newAvatarXP
  avatarState.level             = newLevelData.level
  avatarState.xpToNextLevel     = getXpToNextAvatarLevel(newAvatarXP)
  avatarState.chatCount         = (avatarState.chatCount ?? 0) + 1
  avatarState.lastChatAt        = new Date()
  await avatarState.save()

  // Award user XP
  const xpResults = await awardXP(session.user.id, 'STRAIN_CHAT_MESSAGE', xpEarned)

  // First chat bonus
  if (isFirstChat) {
    await awardXP(session.user.id, 'STRAIN_FIRST_CHAT', XP_EVENTS.STRAIN_FIRST_CHAT)
  }

  // Long session bonus (10+ messages)
  if (msgCount >= 10 && msgCount % 10 === 0) {
    await awardXP(session.user.id, 'STRAIN_CHAT_SESSION_LONG', XP_EVENTS.STRAIN_CHAT_SESSION_LONG)
  }

  // Avatar level up bonus
  if (avatarLevelUp) {
    await awardXP(session.user.id, 'STRAIN_AVATAR_LEVEL_UP', XP_EVENTS.STRAIN_AVATAR_LEVEL_UP)
  }

  // Update strain stats
  await Strain.findOneAndUpdate(
    { slug },
    { $inc: { 'stats.totalMessages': 1, 'stats.totalChats': isFirstChat ? 1 : 0 } },
  )

  return NextResponse.json({
    response:        aiResponse,
    xpEarned,
    xpMultiplier,
    avatarXpEarned:  avatarXpGain,
    avatarLevelUp,
    avatarLevel:     newLevelData.level,
    avatarLevelName: newLevelData.name,
    currentNeeds: {
      hydration:  Math.round(currentNeeds.hydration),
      nutrients:  Math.round(currentNeeds.nutrients),
      energy:     Math.round(currentNeeds.energy),
      happiness:  Math.round(currentNeeds.happiness),
      lastUpdated: currentNeeds.lastUpdated,
    },
    status: newStatus,
    isFirstChat,
    totalUserXP: xpResults.xp,
  })
}
