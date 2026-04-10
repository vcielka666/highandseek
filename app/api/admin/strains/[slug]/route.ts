import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import AvatarState from '@/lib/db/models/AvatarState'
import StrainChat from '@/lib/db/models/StrainChat'
import { generateSystemPrompt } from '@/lib/ai/generateSystemPrompt'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { slug } = await params
  await connectDB()

  const strain = await Strain.findOne({ slug }).lean()
  if (!strain) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ strain })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { slug } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await connectDB()

  // Auto-regenerate system prompt if personality fields changed and no custom override
  if (body.personality && !body.personality.customSystemPrompt) {
    const existing = await Strain.findOne({ slug }).select('personality').lean<{ personality: { archetype: string; tone: string[]; catchphrase: string; favoriteAction: string; hatedAction: string; topics: string[]; forbiddenTopics: string[] } }>()
    if (existing) {
      const merged = { ...existing.personality, ...body.personality }
      body.personality.systemPrompt = generateSystemPrompt({
        name:            body.name ?? slug,
        archetype:       merged.archetype,
        tone:            merged.tone,
        catchphrase:     merged.catchphrase,
        favoriteAction:  merged.favoriteAction,
        hatedAction:     merged.hatedAction,
        topics:          merged.topics,
        forbiddenTopics: merged.forbiddenTopics,
      })
    }
  }

  const updated = await Strain.findOneAndUpdate({ slug }, { $set: body }, { new: true })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ strain: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { slug } = await params
  await connectDB()

  const strain = await Strain.findOneAndDelete({ slug })
  if (!strain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clean up related data
  await Promise.all([
    AvatarState.deleteMany({ strainSlug: slug }),
    StrainChat.deleteMany({ strainSlug: slug }),
  ])

  return NextResponse.json({ success: true })
}
