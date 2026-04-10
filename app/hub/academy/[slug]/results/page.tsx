import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import QuizAttempt from '@/lib/db/models/QuizAttempt'
import AcademyQuestion from '@/lib/db/models/AcademyQuestion'
import mongoose from 'mongoose'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ResultsClient from './ResultsClient'

export default async function ResultsPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ a?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/academy')

  const { slug } = await props.params
  const { a: attemptId } = await props.searchParams

  if (!attemptId) redirect(`/hub/academy/${slug}`)

  await connectDB()

  let oid: mongoose.Types.ObjectId
  try { oid = new mongoose.Types.ObjectId(attemptId) } catch { redirect(`/hub/academy/${slug}`) }

  const attempt = await QuizAttempt.findOne({
    _id: oid,
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).lean<{
    _id: mongoose.Types.ObjectId
    topicSlug: string
    score: number
    totalXp: number
    isPerfect: boolean
    newBadges: string[]
    attemptNumber: number
    answers: Array<{
      questionId: mongoose.Types.ObjectId
      selectedIndex: number
      isCorrect: boolean
      timeSpent: number
      xpEarned: number
    }>
  }>()

  if (!attempt) notFound()

  // Enrich answers with question data
  const questionIds = attempt.answers.map(a => a.questionId)
  const questions = await AcademyQuestion.find({ _id: { $in: questionIds } }).lean<Array<{
    _id: mongoose.Types.ObjectId
    question: string
    options: string[]
    correctIndex: number
    explanation: string
    phase: number
  }>>()
  const qMap = new Map(questions.map(q => [q._id.toString(), q]))

  const enrichedAnswers = attempt.answers.map(a => {
    const q = qMap.get(a.questionId.toString())
    return {
      questionId:    a.questionId.toString(),
      selectedIndex: a.selectedIndex,
      isCorrect:     a.isCorrect,
      timeSpent:     a.timeSpent,
      xpEarned:      a.xpEarned,
      question:      q?.question ?? '',
      options:       q?.options ?? [],
      correctIndex:  q?.correctIndex ?? 0,
      explanation:   q?.explanation ?? '',
      phase:         q?.phase ?? 1,
    }
  })

  const data = {
    score:          attempt.score,
    totalXp:        attempt.totalXp,
    isPerfect:      attempt.isPerfect,
    newBadges:      attempt.newBadges ?? [],
    attemptNumber:  attempt.attemptNumber,
    slug,
    answers:        enrichedAnswers,
  }

  return (
    <div style={{ maxWidth: '720px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      <Breadcrumb
        items={[
          { label: 'Hub', href: '/hub' },
          { label: 'Academy', href: '/hub/academy' },
          { label: 'Results' },
        ]}
        color="#cc00aa"
      />
      <ResultsClient data={data} />
    </div>
  )
}
