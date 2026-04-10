import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import AvatarState from '@/lib/db/models/AvatarState'
import { spendCredits, CREDIT_COSTS } from '@/lib/credits/index'
import { awardXP } from '@/lib/xp/index'
import { z } from 'zod'

const schema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('reset') }),
  z.object({ source: z.literal('template'), url: z.string().url() }),
  z.object({ source: z.literal('custom'),   url: z.string().url(), moodHint: z.string().max(200).optional() }),
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await connectDB()

  // Reset is free — clear bg and mood hint
  if (parsed.data.source === 'reset') {
    await AvatarState.findOneAndUpdate(
      { userId: session.user.id, strainSlug: slug },
      { $set: { customBackground: '', customMoodHint: '' } },
      { upsert: true },
    )
    return NextResponse.json({ customBackground: '', creditsRemaining: null })
  }

  const { source, url } = parsed.data
  const moodHint = source === 'custom' ? (parsed.data.moodHint ?? '') : ''
  const cost = source === 'custom' ? CREDIT_COSTS.AVATAR_BG_CUSTOM : CREDIT_COSTS.AVATAR_BG_TEMPLATE

  // Check if already unlocked — free switch (but still update moodHint for custom re-applies)
  const existing = await AvatarState.findOne({ userId: session.user.id, strainSlug: slug })
    .select('unlockedBackgrounds').lean<{ unlockedBackgrounds: string[] }>()

  const alreadyUnlocked = existing?.unlockedBackgrounds?.includes(url) ?? false

  if (alreadyUnlocked) {
    const setFields: Record<string, string> = { customBackground: url }
    if (source === 'custom') setFields.customMoodHint = moodHint
    await AvatarState.findOneAndUpdate(
      { userId: session.user.id, strainSlug: slug },
      { $set: setFields },
      { upsert: true },
    )
    return NextResponse.json({ customBackground: url, free: true, xpEarned: 0 })
  }

  // First time — charge credits, unlock, and award XP
  try {
    const remaining = await spendCredits(
      session.user.id,
      cost,
      `avatar_bg_${source}:${slug}`,
    )

    const setFields: Record<string, string> = { customBackground: url }
    if (source === 'custom') setFields.customMoodHint = moodHint

    await AvatarState.findOneAndUpdate(
      { userId: session.user.id, strainSlug: slug },
      {
        $set:      setFields,
        $addToSet: { unlockedBackgrounds: url },
      },
      { upsert: true },
    )

    await awardXP(session.user.id, 'STRAIN_BG_CHANGE')

    return NextResponse.json({ customBackground: url, creditsRemaining: remaining, xpEarned: 3, free: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg === 'Insufficient credits') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
