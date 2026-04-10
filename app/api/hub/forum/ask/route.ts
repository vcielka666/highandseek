import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { connectDB } from '@/lib/db/connect'
import ForumQuestion from '@/lib/db/models/ForumQuestion'
import XPEvent from '@/lib/db/models/XPEvent'
import { awardXP, XP_EVENTS } from '@/lib/xp/index'

const client = new Anthropic()

const schema = z.object({
  question: z.string().min(3).max(500),
})

interface ParsedSource {
  site: string
  title: string
  url: string
}

function parseSources(text: string): { answer: string; sources: ParsedSource[] } {
  const sourcesIdx = text.lastIndexOf('SOURCES:')
  if (sourcesIdx === -1) return { answer: text.trim(), sources: [] }

  const answerPart = text.slice(0, sourcesIdx).trim()
  const sourcesPart = text.slice(sourcesIdx + 8).trim()

  const sources: ParsedSource[] = []
  const lines = sourcesPart.split('\n').filter(l => l.trim())
  for (const line of lines) {
    // Format: [site]: [title] → [url]
    const match = line.match(/^[-\d.]*\s*([^:]+):\s*(.+?)\s*[→>]\s*(https?:\/\/\S+)/i)
    if (match) {
      sources.push({ site: match[1].trim(), title: match[2].trim(), url: match[3].trim() })
    } else {
      // fallback: any line with a URL
      const urlMatch = line.match(/(https?:\/\/\S+)/)
      if (urlMatch) {
        const site = line.split(':')[0].replace(/^[-\d.\s]+/, '').trim() || 'Source'
        sources.push({ site, title: line.replace(urlMatch[0], '').replace(/[→>:]/g, '').trim() || 'Reference', url: urlMatch[1] })
      }
    }
  }
  return { answer: answerPart, sources }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { question } = parsed.data

  await connectDB()

  // Check if ANTHROPIC_API_KEY is set
  if (!process.env.ANTHROPIC_API_KEY) {
    const mock = await ForumQuestion.create({
      userId: session.user.id,
      question,
      answer: 'AI Forum Bridge requires ANTHROPIC_API_KEY to be configured.',
      sources: [],
    })
    return NextResponse.json({ answer: mock.answer, sources: [], questionId: mock._id.toString() })
  }

  // Check if user already asked today (for XP gate)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const askedToday = await XPEvent.findOne({
    userId: session.user.id,
    event: 'FORUM_QUESTION',
    createdAt: { $gte: todayStart },
  })
  const shouldAwardXP = !askedToday

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      system: `You are a cannabis cultivation expert with deep knowledge of growing techniques, strains, nutrients, and equipment.
Answer the user's question accurately and concisely in 2-4 paragraphs.
Focus on practical, actionable advice.
You MUST end every response with a SOURCES section listing 3-5 relevant sources from cannabis growing communities.
Format exactly as:
SOURCES:
ICMag: [relevant thread title] → https://icmag.com/forum/[relevant-path]
Reddit: [relevant post title] → https://reddit.com/r/microgrowery/[relevant-path]
Rollitup: [relevant thread title] → https://rollitup.org/[relevant-path]
Use realistic-looking but clearly community-forum URLs. Do not fabricate news or scientific paper URLs.`,
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const { answer, sources } = parseSources(raw)

    const savedQuestion = await ForumQuestion.create({
      userId: session.user.id,
      question,
      answer,
      sources,
    })

    let xpAwarded = 0
    if (shouldAwardXP) {
      await awardXP(session.user.id, 'FORUM_QUESTION', XP_EVENTS.FORUM_QUESTION)
      xpAwarded = XP_EVENTS.FORUM_QUESTION
    }

    return NextResponse.json({
      answer,
      sources,
      questionId: savedQuestion._id.toString(),
      xpAwarded,
    })
  } catch (err) {
    console.error('Forum AI error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}
