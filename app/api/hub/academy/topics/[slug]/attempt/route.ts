import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { z } from 'zod'
import AcademyQuestion from '@/lib/db/models/AcademyQuestion'
import QuizAttempt from '@/lib/db/models/QuizAttempt'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp/index'
import { spendCredits } from '@/lib/credits/index'
import { checkAcademyBadges } from '@/lib/badges/index'
import type { BadgeId } from '@/lib/badges/index'

const AnswerSchema = z.object({
  questionId:    z.string().min(1),
  selectedIndex: z.number().int().min(-1),
  timeSpent:     z.number().min(0).max(300),
})

const BodySchema = z.object({
  answers: z.array(AnswerSchema).length(15),
})

export async function POST(
  req: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await props.params
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { answers } = parsed.data
  await connectDB()

  // Fetch all questions for scoring
  const questionIds = answers.map(a => a.questionId)
  const questions = await AcademyQuestion.find({ _id: { $in: questionIds }, topicSlug: slug }).lean()
  const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

  // Count previous attempts for this user + topic
  const previousAttempts = await QuizAttempt.countDocuments({ userId: session.user.id, topicSlug: slug })
  const attemptNumber = previousAttempts + 1

  // Deduct credits for retries
  let creditsCost = 0
  if (attemptNumber === 2) {
    creditsCost = 25
    try {
      await spendCredits(session.user.id, 25, `Academy retry #2 — ${slug}`)
    } catch {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
  } else if (attemptNumber >= 3) {
    creditsCost = 50
    try {
      await spendCredits(session.user.id, 50, `Academy retry #${attemptNumber} — ${slug}`)
    } catch {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
  }

  // Score answers
  let score = 0
  let phase1Correct = 0
  let phase2Correct = 0
  let phase3Correct = 0
  let speedBonusCount = 0
  let allPhase3SpeedDemon = true
  let phase3Count = 0

  const scoredAnswers = answers.map(a => {
    const q = questionMap.get(a.questionId)
    if (!q) return { questionId: a.questionId, selectedIndex: a.selectedIndex, isCorrect: false, timeSpent: a.timeSpent, xpEarned: 0 }

    const isCorrect = a.selectedIndex === q.correctIndex
    let xpEarned = 0

    if (isCorrect) {
      score++
      if (q.phase === 1) { phase1Correct++; xpEarned += 10 }
      else if (q.phase === 2) { phase2Correct++; xpEarned += 15 }
      else if (q.phase === 3) { phase3Correct++; xpEarned += 25 }
    }

    if (q.phase === 3) {
      phase3Count++
      if (isCorrect && a.timeSpent < 10) {
        speedBonusCount++
        xpEarned += 10
      }
      if (a.timeSpent >= 10 || !isCorrect) {
        allPhase3SpeedDemon = false
      }
    }

    return {
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      isCorrect,
      timeSpent: a.timeSpent,
      xpEarned,
    }
  })

  if (phase3Count === 0) allPhase3SpeedDemon = false

  const isPerfect = score === 15
  const perfectBonus = isPerfect ? 150 : 0
  const totalXp = (phase1Correct * 10) + (phase2Correct * 15) + (phase3Correct * 25) + (speedBonusCount * 10) + perfectBonus

  // Save attempt (newBadges filled in after badge check below)
  const attempt = await QuizAttempt.create({
    userId:        session.user.id,
    topicSlug:     slug,
    attemptNumber,
    creditsCost,
    answers:       scoredAnswers,
    totalXp,
    score,
    totalQuestions: 15,
    completedAt:   new Date(),
    isPerfect,
    newBadges:     [],
  })

  // Award XP
  const xpPromises: Promise<unknown>[] = []
  if (phase1Correct > 0) xpPromises.push(awardXP(session.user.id, 'QUIZ_CORRECT_PHASE1', phase1Correct * 10, { topicSlug: slug }))
  if (phase2Correct > 0) xpPromises.push(awardXP(session.user.id, 'QUIZ_CORRECT_PHASE2', phase2Correct * 15, { topicSlug: slug }))
  if (phase3Correct > 0) xpPromises.push(awardXP(session.user.id, 'QUIZ_CORRECT_PHASE3', phase3Correct * 25, { topicSlug: slug }))
  if (speedBonusCount > 0) xpPromises.push(awardXP(session.user.id, 'QUIZ_SPEED_BONUS', speedBonusCount * 10, { topicSlug: slug }))
  if (isPerfect) xpPromises.push(awardXP(session.user.id, 'QUIZ_PERFECT_SCORE', 150, { topicSlug: slug }))
  await Promise.all(xpPromises)

  // Update user.academy.completedTopics
  const userDoc = await User.findById(session.user.id).select('academy').lean<{
    academy?: { completedTopics?: Array<{ topicSlug: string; bestScore: number; bestXp: number; attempts: number }> }
  }>()
  const existingIdx = userDoc?.academy?.completedTopics?.findIndex(t => t.topicSlug === slug) ?? -1
  const isFirstComplete = existingIdx === -1

  if (isFirstComplete) {
    await User.findByIdAndUpdate(session.user.id, {
      $push: {
        'academy.completedTopics': {
          topicSlug: slug,
          bestScore: score,
          bestXp: totalXp,
          attempts: 1,
          completedAt: new Date(),
        },
      },
    })
    await awardXP(session.user.id, 'ACADEMY_TOPIC_FIRST_COMPLETE', 50, { topicSlug: slug })
  } else {
    const existing = userDoc!.academy!.completedTopics![existingIdx]
    await User.updateOne(
      { _id: session.user.id },
      {
        $set: {
          'academy.completedTopics.$[elem].bestScore': Math.max(existing.bestScore, score),
          'academy.completedTopics.$[elem].bestXp':   Math.max(existing.bestXp, totalXp),
        },
        $inc: { 'academy.completedTopics.$[elem].attempts': 1 },
      },
      { arrayFilters: [{ 'elem.topicSlug': slug }] },
    )
  }

  // Badge checking
  const updatedUser = await User.findById(session.user.id).select('academy').lean<{
    academy?: { completedTopics?: Array<{ topicSlug: string; bestScore: number }> }
  }>()
  const completedTopicSlugs = updatedUser?.academy?.completedTopics?.map(t => t.topicSlug) ?? []
  const perfectTopicSlugs = updatedUser?.academy?.completedTopics?.filter(t => t.bestScore === 15).map(t => t.topicSlug) ?? []

  const newBadges = await checkAcademyBadges(session.user.id, {
    isPerfect,
    topicSlug: slug,
    allSpeedDemon: allPhase3SpeedDemon,
    completedTopicSlugs,
    perfectTopicSlugs,
  })

  // Persist badges to attempt doc
  if (newBadges.length > 0) {
    await QuizAttempt.findByIdAndUpdate(attempt._id, { $set: { newBadges } })
  }

  // Build result with question details (correctIndex + explanation) for results page
  const resultAnswers = scoredAnswers.map(a => {
    const q = questionMap.get(a.questionId)
    return {
      ...a,
      question:     q?.question ?? '',
      correctIndex: q?.correctIndex ?? 0,
      explanation:  q?.explanation ?? '',
      phase:        q?.phase ?? 1,
      options:      q?.options ?? [],
    }
  })

  return NextResponse.json({
    attemptId:    attempt._id.toString(),
    score,
    totalXp,
    isPerfect,
    newBadges:    newBadges as BadgeId[],
    isFirstComplete,
    answers:      resultAnswers,
  })
}
