import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import AcademyTopic from '@/lib/db/models/AcademyTopic'
import QuizAttempt from '@/lib/db/models/QuizAttempt'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await props.params
  await connectDB()

  const topic = await AcademyTopic.findOne({ slug, isActive: true }).lean()
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attempts = await QuizAttempt.find({ userId: session.user.id, topicSlug: slug })
    .sort({ createdAt: -1 })
    .select('score totalXp isPerfect attemptNumber completedAt creditsCost')
    .lean()

  return NextResponse.json({
    topic: { ...topic, _id: topic._id.toString() },
    attempts: attempts.map(a => ({ ...a, _id: a._id.toString(), userId: undefined })),
  })
}
