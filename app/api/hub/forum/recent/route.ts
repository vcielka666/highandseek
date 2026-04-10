import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import ForumQuestion from '@/lib/db/models/ForumQuestion'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const questions = await ForumQuestion.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id question createdAt')
    .lean()

  return NextResponse.json(questions)
}
