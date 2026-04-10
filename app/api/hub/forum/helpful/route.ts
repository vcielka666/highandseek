import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import ForumQuestion from '@/lib/db/models/ForumQuestion'

const schema = z.object({
  questionId: z.string().min(1),
  helpful: z.boolean(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await connectDB()
  await ForumQuestion.findOneAndUpdate(
    { _id: parsed.data.questionId, userId: session.user.id },
    { helpful: parsed.data.helpful },
  )

  return NextResponse.json({ ok: true })
}
