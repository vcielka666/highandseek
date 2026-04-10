'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/stores/languageStore'

interface Question {
  _id: string
  phase: 1 | 2 | 3
  question: string
  options: string[]
  isTimed: boolean
  timeLimit: number
  difficulty: string
}

interface AnswerRecord {
  questionId: string
  selectedIndex: number
  timeSpent: number
}

type Status = 'loading' | 'quiz' | 'submitting' | 'error'

const PHASE_XP: Record<number, number> = { 1: 10, 2: 15, 3: 25 }
// Phase labels resolved from translations at runtime
const PHASE_COLOR: Record<number, string> = { 1: '#00d4c8', 2: '#f0a830', 3: '#cc00aa' }
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

const TIMER_RADIUS = 26
const TIMER_CIRC = 2 * Math.PI * TIMER_RADIUS

function timerColor(t: number) {
  if (t > 10) return '#00d4c8'
  if (t > 5) return '#f0a830'
  return '#cc00aa'
}

function QuizInner() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params?.slug ?? ''
  const lang = searchParams.get('lang') === 'cs' ? 'cs' : 'en'
  const { t } = useLanguage()
  const q = t.quiz
  const PHASE_LABEL: Record<number, string> = { 1: q.phase1, 2: q.phase2, 3: q.phase3 }

  const [status, setStatus] = useState<Status>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [liveXP, setLiveXP] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [errorMsg, setErrorMsg] = useState('')

  // Ref mirror of answers to avoid stale closures in async submit
  const answersRef = useRef<AnswerRecord[]>([])
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load questions
  useEffect(() => {
    fetch(`/api/hub/academy/topics/${slug}/questions?lang=${lang}`)
      .then(r => r.json())
      .then(d => {
        if (d.questions?.length === 15) {
          setQuestions(d.questions)
          setStatus('quiz')
          startTimeRef.current = Date.now()
        } else {
          setErrorMsg('Failed to load questions. Please try again.')
          setStatus('error')
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load questions. Please try again.')
        setStatus('error')
      })
  }, [slug])

  const currentQ = questions[currentIdx]
  const isPhase3 = currentQ?.phase === 3 && currentQ?.isTimed

  // Timer for phase 3
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null }
  }, [])

  const handleAnswer = useCallback((idx: number) => {
    if (hasAnswered || status !== 'quiz') return
    clearTimer()
    clearAutoAdvance()

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    setSelected(idx)
    setHasAnswered(true)

    // Record answer — update both state (for render) and ref (for submit)
    const record: AnswerRecord = { questionId: currentQ._id, selectedIndex: idx, timeSpent }
    answersRef.current = [...answersRef.current, record]
    setAnswers(answersRef.current)

    // Update live XP (optimistic — server scores, but we show phase XP for correct)
    // We don't know if correct (correctIndex not sent to client) — XP shown in results
  }, [hasAnswered, status, currentQ, clearTimer, clearAutoAdvance])

  // Start timer when question changes (phase 3 only)
  useEffect(() => {
    if (status !== 'quiz' || !currentQ) return
    startTimeRef.current = Date.now()

    if (isPhase3) {
      setTimeLeft(currentQ.timeLimit ?? 20)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer()
            handleAnswer(-1) // forced timeout — wrong
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearTimer()
  }, [currentIdx, status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance after answering
  useEffect(() => {
    if (!hasAnswered) return
    autoAdvanceRef.current = setTimeout(() => advance(), 3000)
    return () => clearAutoAdvance()
  }, [hasAnswered]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(async () => {
    clearAutoAdvance()
    if (currentIdx < 14) {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setHasAnswered(false)
      setTimeLeft(20)
    } else {
      // Submit — read from ref to avoid stale closure
      setStatus('submitting')
      const allAnswers = [...answersRef.current]
      if (allAnswers.length !== 15) {
        setErrorMsg(`Unexpected answer count (${allAnswers.length}). Please try again.`)
        setStatus('error')
        return
      }
      try {
        const res = await fetch(`/api/hub/academy/topics/${slug}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: allAnswers }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Submission failed')
        router.push(`/hub/academy/${slug}/results?a=${data.attemptId}`)
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Submission failed. Please try again.')
        setStatus('error')
      }
    }
  }, [currentIdx, slug, router, clearAutoAdvance])

  // ── RENDER ──

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="16" cy="16" r="13" stroke="rgba(204,0,170,0.15)" strokeWidth="2" />
          <path d="M16 3 A13 13 0 0 1 29 16" stroke="#cc00aa" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{q.loading}</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <span style={{ fontSize: '32px' }}>⚠️</span>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#f0a830', textAlign: 'center' }}>{errorMsg}</div>
        <button
          onClick={() => router.push(`/hub/academy/${slug}`)}
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', color: '#cc00aa', background: 'none', border: '0.5px solid rgba(204,0,170,0.4)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
        >
          {q.backToTopic}
        </button>
      </div>
    )
  }

  if (status === 'submitting') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="16" cy="16" r="13" stroke="rgba(204,0,170,0.15)" strokeWidth="2" />
          <path d="M16 3 A13 13 0 0 1 29 16" stroke="#cc00aa" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{q.submitting}</span>
      </div>
    )
  }

  if (!currentQ) return null

  const phase = currentQ.phase
  const phaseColor = PHASE_COLOR[phase]
  const timerDash = TIMER_CIRC * (timeLeft / (currentQ.timeLimit ?? 20))
  const tColor = timerColor(timeLeft)

  // Grid columns based on option count
  const optCount = currentQ.options.length
  const gridCols = optCount <= 4 ? 2 : optCount === 5 ? 2 : 2

  return (
    <div style={{ maxWidth: '700px', padding: '0', display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="px-4 pt-4 pb-8 md:px-7 md:pt-6">

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', letterSpacing: '0.5px' }}>
            {q.questionLabel}
          </span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#e8f0ef' }}>
            {currentIdx + 1}
            <span style={{ color: '#2a3a3e', fontWeight: 400 }}> / 15</span>
          </span>
        </div>

        {/* Phase label */}
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: phaseColor, border: `0.5px solid ${phaseColor}44`, padding: '3px 10px', borderRadius: '3px' }}>
          {PHASE_LABEL[phase]}
        </span>

        {/* Timer + XP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#f0a830' }}>
            🏆 {liveXP} XP
          </span>
          {isPhase3 && (
            <div style={{ position: 'relative', width: '36px', height: '36px' }}>
              <svg width="36" height="36" viewBox="0 0 60 60" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="30" cy="30" r={TIMER_RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="30" cy="30" r={TIMER_RADIUS}
                  stroke={tColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={TIMER_CIRC}
                  strokeDashoffset={TIMER_CIRC - timerDash}
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: tColor,
              }}>
                {timeLeft}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((currentIdx) / 15) * 100}%`, background: `linear-gradient(90deg, #cc00aa, ${phaseColor})`, transition: 'width 0.4s ease', borderRadius: '1px' }} />
      </div>

      {/* Question card */}
      <div style={{
        background: '#0d0d10',
        border: `0.5px solid ${phaseColor}22`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        borderLeft: `3px solid ${phaseColor}`,
      }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 'clamp(15px, 2.5vw, 19px)', color: '#e8f0ef', lineHeight: 1.6, fontWeight: 500 }}>
          {currentQ.question}
        </div>
      </div>

      {/* Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: '10px',
        marginBottom: '20px',
      }}>
        {currentQ.options.map((opt, i) => {
          const isSelected = selected === i
          const isLast = optCount === 5 && i === 4 // last option spans full width for 5-option questions

          let bg = '#0d0d10'
          let border = 'rgba(255,255,255,0.06)'
          let labelColor = '#4a6066'
          let textColor = '#e8f0ef'

          if (hasAnswered) {
            // We don't know the correct answer (it's server-side only)
            // Show selected state only
            if (isSelected) {
              bg = 'rgba(204,0,170,0.08)'
              border = 'rgba(204,0,170,0.4)'
              labelColor = '#cc00aa'
              textColor = '#e8f0ef'
            } else {
              bg = '#0a0a0d'
              border = 'rgba(255,255,255,0.03)'
              textColor = '#4a6066'
              labelColor = '#2a3a3e'
            }
          }

          return (
            <button
              key={i}
              onClick={() => !hasAnswered && handleAnswer(i)}
              disabled={hasAnswered}
              style={{
                gridColumn: isLast ? '1 / -1' : undefined,
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', background: bg,
                border: `0.5px solid ${border}`,
                borderRadius: '6px', cursor: hasAnswered ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                opacity: hasAnswered && !isSelected ? 0.5 : 1,
              }}
              className={!hasAnswered ? 'hover:border-[rgba(204,0,170,0.3)] hover:bg-[rgba(204,0,170,0.04)]' : ''}
            >
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', fontWeight: 700, color: labelColor, minWidth: '18px', flexShrink: 0, marginTop: '2px', transition: 'color 0.15s' }}>
                {OPTION_LABELS[i]}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: textColor, lineHeight: 1.5, transition: 'color 0.15s' }}>
                {opt}
              </span>
            </button>
          )
        })}
      </div>

      {/* After-answer panel */}
      {hasAnswered && (
        <div style={{
          background: '#0d0d10',
          border: '0.5px solid rgba(0,212,200,0.15)',
          borderRadius: '6px',
          padding: '16px 20px',
          borderLeft: '3px solid #00d4c8',
          marginBottom: '16px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8', marginBottom: '8px' }}>
            {q.explanation}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(232,240,239,0.7)', lineHeight: 1.6 }}>
            {q.resultsAfter}
          </div>
        </div>
      )}

      {/* Next button */}
      {hasAnswered && (
        <button
          onClick={advance}
          style={{
            fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1.5px',
            color: '#050508', background: '#cc00aa',
            border: 'none', borderRadius: '6px', padding: '14px 28px',
            cursor: 'pointer', transition: 'opacity 0.15s',
            alignSelf: 'flex-end',
          }}
          className="hover:opacity-90"
        >
          {currentIdx < 14 ? q.nextQuestion : q.viewResults}
        </button>
      )}

      {/* Question counter dots */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '24px' }}>
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: i < answers.length ? PHASE_COLOR[questions[i]?.phase ?? 1]
              : i === currentIdx ? 'rgba(255,255,255,0.3)'
              : 'rgba(255,255,255,0.06)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#4a6066" }}>Loading...</span>
      </div>
    }>
      <QuizInner />
    </Suspense>
  )
}
