'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BADGES } from '@/lib/badges/config'
import { useLanguage } from '@/stores/languageStore'

interface AnswerDetail {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  timeSpent: number
  xpEarned: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  phase: number
}

interface ResultsData {
  score: number
  totalXp: number
  isPerfect: boolean
  newBadges: string[]
  attemptNumber: number
  slug: string
  answers: AnswerDetail[]
}

const PHASE_COLOR: Record<number, string> = { 1: '#00d4c8', 2: '#f0a830', 3: '#cc00aa' }
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || target === 0) return
    started.current = true
    const start = performance.now()
    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return value
}

export default function ResultsClient({ data }: { data: ResultsData }) {
  const xpDisplay = useCountUp(data.totalXp)
  const { score, totalXp, isPerfect, newBadges, slug, answers } = data
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { t } = useLanguage()
  const a = t.academy

  const performanceMsg = isPerfect
    ? { icon: '🏆', text: a.perfMsg, color: '#f0a830' }
    : score >= 12
    ? { icon: '⚡', text: a.excelMsg, color: '#cc00aa' }
    : score >= 8
    ? { icon: '👍', text: a.goodMsg, color: '#00d4c8' }
    : { icon: '📚', text: a.keepMsg, color: '#4a6066' }

  const correctCount = answers.filter(a => a.isCorrect).length
  const nextAttemptCost = data.attemptNumber === 1 ? 25 : 50

  return (
    <div>
      {/* Score */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700, color: isPerfect ? '#f0a830' : '#cc00aa', letterSpacing: '2px', lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: '0.45em', color: '#2a3a3e', fontWeight: 400 }}> / 15</span>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{performanceMsg.icon}</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: performanceMsg.color, letterSpacing: '0.5px' }}>
            {performanceMsg.text}
          </span>
        </div>
      </div>

      {/* XP earned */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px', padding: '20px', background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '8px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066' }}>{a.xpEarned}</span>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#f0a830', letterSpacing: '1px' }}>
          +{xpDisplay}
        </span>
      </div>

      {/* New badges */}
      {newBadges.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '12px' }}>
            {a.newBadgesLabel}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {newBadges.map((id, i) => {
              const badge = BADGES[id as keyof typeof BADGES]
              if (!badge) return null
              return (
                <div key={id} style={{
                  padding: '14px 18px', background: 'rgba(204,0,170,0.08)',
                  border: '0.5px solid rgba(204,0,170,0.3)', borderRadius: '8px',
                  textAlign: 'center', minWidth: '100px',
                  animation: `badgeIn 0.4s ease ${i * 0.12}s both`,
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{badge.icon}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef', marginBottom: '4px' }}>{badge.name}</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: '#4a6066', lineHeight: 1.4 }}>{badge.condition}</div>
                </div>
              )
            })}
          </div>
          <style>{`@keyframes badgeIn { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }`}</style>
        </div>
      )}

      {/* Answer breakdown toggle */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowBreakdown(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0' }}
        >
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066' }}>
            {a.questionBreakdown}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a6066" strokeWidth="1.5"
            style={{ transition: 'transform 0.2s', transform: showBreakdown ? 'rotate(180deg)' : 'none' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showBreakdown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {answers.map((a, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                background: '#0d0d10',
                border: `0.5px solid ${a.isCorrect ? 'rgba(0,212,200,0.15)' : 'rgba(204,0,170,0.1)'}`,
                borderLeft: `2px solid ${a.isCorrect ? '#00d4c8' : '#cc00aa'}`,
                borderRadius: '6px',
              }}>
                {/* Q header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{a.isCorrect ? '✓' : '✗'}</span>
                  <div style={{ flex: 1, fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', lineHeight: 1.5 }}>
                    {a.question}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#f0a830' }}>
                      {a.xpEarned > 0 ? `+${a.xpEarned}` : '0'} XP
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: PHASE_COLOR[a.phase] }}>
                      Ph.{a.phase}
                    </div>
                  </div>
                </div>

                {/* Correct answer */}
                {!a.isCorrect && a.options[a.correctIndex] && (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#00d4c8', marginBottom: '6px', paddingLeft: '24px' }}>
                    ✓ {OPTION_LABELS[a.correctIndex]}: {a.options[a.correctIndex]}
                  </div>
                )}
                {a.isCorrect && a.options[a.correctIndex] && (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#00d4c8', marginBottom: '6px', paddingLeft: '24px' }}>
                    ✓ {OPTION_LABELS[a.correctIndex]}: {a.options[a.correctIndex]}
                  </div>
                )}

                {/* Explanation */}
                {a.explanation && (
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, paddingLeft: '24px' }}>
                    {a.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!isPerfect && (
          <Link
            href={`/hub/academy/${slug}`}
            style={{
              flex: 1, minWidth: '180px', textAlign: 'center',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
              color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)',
              padding: '12px', borderRadius: '4px', textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            className="hover:border-[rgba(204,0,170,0.4)] hover:text-[#cc00aa]"
          >
            {a.retryLabel} — {nextAttemptCost} {a.creditsUnit}
          </Link>
        )}

        <Link
          href="/hub/academy"
          style={{
            flex: 1, minWidth: '180px', textAlign: 'center',
            fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px',
            color: '#050508', background: '#cc00aa',
            padding: '12px', borderRadius: '4px', textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          className="hover:opacity-90"
        >
          {isPerfect ? a.nextTopic : a.backToAcademyBtn}
        </Link>
      </div>

      {/* Score summary */}
      <div style={{ marginTop: '20px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', textAlign: 'center' }}>
        {correctCount} {a.correctLabel} · {15 - correctCount} {a.wrongLabel} · {totalXp} {a.xpEarnedLabel}
      </div>
    </div>
  )
}
