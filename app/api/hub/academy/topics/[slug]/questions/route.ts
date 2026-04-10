import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import AcademyQuestion from '@/lib/db/models/AcademyQuestion'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await props.params
  const lang = new URL(_req.url).searchParams.get('lang') === 'en' ? 'en' : 'cs'
  await connectDB()

  // Sample 5 questions from each phase in the requested language
  const match = (phase: number) => ({ topicSlug: slug, phase, language: lang, isActive: true })
  const [phase1, phase2, phase3] = await Promise.all([
    AcademyQuestion.aggregate([{ $match: match(1) }, { $sample: { size: 5 } }]),
    AcademyQuestion.aggregate([{ $match: match(2) }, { $sample: { size: 5 } }]),
    AcademyQuestion.aggregate([{ $match: match(3) }, { $sample: { size: 5 } }]),
  ])

  // If requested language has insufficient questions, fall back to 'cs'
  if (lang === 'en' && (phase1.length < 5 || phase2.length < 5 || phase3.length < 5)) {
    const matchCs = (phase: number) => ({ topicSlug: slug, phase, language: 'cs', isActive: true })
    const [p1, p2, p3] = await Promise.all([
      AcademyQuestion.aggregate([{ $match: matchCs(1) }, { $sample: { size: 5 } }]),
      AcademyQuestion.aggregate([{ $match: matchCs(2) }, { $sample: { size: 5 } }]),
      AcademyQuestion.aggregate([{ $match: matchCs(3) }, { $sample: { size: 5 } }]),
    ])
    const fallback = [...p1, ...p2, ...p3].map(q => ({
      _id: q._id.toString(), phase: q.phase, question: q.question,
      options: q.options, isTimed: q.isTimed, timeLimit: q.timeLimit, difficulty: q.difficulty,
    }))
    if (fallback.length < 15) {
      return NextResponse.json({ error: 'Questions not seeded yet. Run: pnpm tsx scripts/seed-academy.ts', questions: [] }, { status: 404 })
    }
    return NextResponse.json({ questions: fallback, lang: 'cs' })
  }

  const questions = [...phase1, ...phase2, ...phase3].map(q => ({
    _id: q._id.toString(),
    phase: q.phase,
    question: q.question,
    options: q.options,
    isTimed: q.isTimed,
    timeLimit: q.timeLimit,
    difficulty: q.difficulty,
    // correctIndex and explanation NOT sent to client — only sent in results
  }))

  if (questions.length < 15) {
    return NextResponse.json({ error: 'Questions not seeded yet. Run: pnpm tsx scripts/seed-academy.ts', questions: [] }, { status: 404 })
  }

  return NextResponse.json({ questions })
}
