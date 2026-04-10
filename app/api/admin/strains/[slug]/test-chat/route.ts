import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'

const client = new Anthropic()

const schema = z.object({
  message:  z.string().min(1).max(1000),
  history:  z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
  prompt: z.string().optional(), // override with form's current (unsaved) prompt
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { slug } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await connectDB()

  const strain = await Strain.findOne({ slug })
    .select('personality.systemPrompt personality.customSystemPrompt name')
    .lean<{ name: string; personality: { systemPrompt: string; customSystemPrompt: string } }>()
  if (!strain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const systemPrompt = parsed.data.prompt
    ?? strain.personality.customSystemPrompt
    ?? strain.personality.systemPrompt
    ?? ''

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ response: '[ANTHROPIC_API_KEY not configured]' })
  }

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     systemPrompt + '\n\n[THIS IS A TEST MESSAGE — NO XP AWARDED, NOT SAVED TO DB]',
      messages:   [
        ...(parsed.data.history ?? []),
        { role: 'user', content: parsed.data.message },
      ],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ response: text })
  } catch (err) {
    console.error('[admin/strains/test-chat]', err)
    return NextResponse.json({ error: 'AI error' }, { status: 503 })
  }
}
