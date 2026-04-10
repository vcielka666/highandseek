import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import AcademyTopic from '@/lib/db/models/AcademyTopic'
import QuizAttempt from '@/lib/db/models/QuizAttempt'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  await connectDB()

  const topics = await AcademyTopic.find({ isActive: true }).sort({ order: 1 }).lean()

  if (!session) {
    return NextResponse.json({ topics })
  }

  // Attach user's best score per topic
  const attempts = await QuizAttempt.aggregate([
    { $match: { userId: session.user.id } },
    { $group: {
      _id: '$topicSlug',
      bestScore: { $max: '$score' },
      bestXp: { $max: '$totalXp' },
      attempts: { $sum: 1 },
      isPerfectEver: { $max: '$isPerfect' },
    }},
  ])

  const attemptMap = new Map(attempts.map(a => [a._id, a]))

  const topicsWithProgress = topics.map(t => ({
    ...t,
    _id: t._id.toString(),
    userProgress: attemptMap.get(t.slug) ?? null,
  }))

  return NextResponse.json({ topics: topicsWithProgress })
}
