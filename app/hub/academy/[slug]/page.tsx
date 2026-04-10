import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import AcademyTopic from '@/lib/db/models/AcademyTopic'
import QuizAttempt from '@/lib/db/models/QuizAttempt'
import User from '@/lib/db/models/User'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default async function AcademyTopicPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/academy')

  const { slug } = await props.params
  const { lang: rawLang } = await props.searchParams

  const { locale, t } = await getServerT()

  // lang param = quiz question language. Default to hub UI locale if not specified.
  const lang = rawLang === 'cs' ? 'cs' : rawLang === 'en' ? 'en' : locale
  const a = t.academy

  // Difficulty labels follow the hub UI locale (not quiz lang)
  const difficultyLabels = locale === 'cs'
    ? { beginner: 'Začátečník', intermediate: 'Středně pokročilý', advanced: 'Pokročilý' }
    : { beginner: 'Beginner',   intermediate: 'Intermediate',      advanced: 'Advanced'   }

  const DIFFICULTY: Record<string, { label: string; color: string }> = {
    beginner:     { label: difficultyLabels.beginner,     color: '#00d4c8' },
    intermediate: { label: difficultyLabels.intermediate, color: '#f0a830' },
    advanced:     { label: difficultyLabels.advanced,     color: '#cc00aa' },
  }

  const PHASE_INFO = [
    { phase: 1, label: a.phase1Label, questions: 5, options: 4, xpEach: 10, timed: false, color: '#00d4c8' },
    { phase: 2, label: a.phase2Label, questions: 5, options: 5, xpEach: 15, timed: false, color: '#f0a830' },
    { phase: 3, label: a.phase3Label, questions: 5, options: 6, xpEach: 25, timed: true,  color: '#cc00aa' },
  ]

  await connectDB()

  const topic = await AcademyTopic.findOne({ slug, isActive: true }).lean()
  if (!topic) notFound()

  // Title/description follow hub UI locale (from cookie), not quiz lang param
  const displayTitle = locale === 'cs' ? topic.title : (topic.titleEn || topic.title)
  const displayDescription = locale === 'cs' ? topic.description : (topic.descriptionEn || topic.description)

  const attempts = await QuizAttempt.countDocuments({ userId: session.user.id, topicSlug: slug })
  const bestAttempt = attempts > 0
    ? await QuizAttempt.findOne({ userId: session.user.id, topicSlug: slug })
        .sort({ score: -1 })
        .select('score totalXp isPerfect')
        .lean()
    : null

  const creditsCost = attempts === 0 ? 0 : attempts === 1 ? 25 : 50

  // Check if user has enough credits for a retry
  let userCredits = 0
  if (creditsCost > 0) {
    const userDoc = await User.findById(session.user.id).select('credits').lean<{ credits?: number }>()
    userCredits = userDoc?.credits ?? 0
  }
  const canStart = creditsCost === 0 || userCredits >= creditsCost

  const d = DIFFICULTY[topic.difficulty] ?? DIFFICULTY.beginner

  // Max XP breakdown
  const maxXP = (5 * 10) + (5 * 15) + (5 * 25) + (5 * 10) + 150 // 450 (speed bonus for all phase3 + perfect)

  return (
    <div style={{ maxWidth: '680px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      <Breadcrumb
        items={[
          { label: 'Hub', href: '/hub' },
          { label: a.title, href: '/hub/academy' },
          { label: displayTitle },
        ]}
        color="#cc00aa"
      />

      {/* Hero */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '16px' }}>{topic.icon}</div>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '8px' }}>
          {displayTitle}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: d.color, border: `0.5px solid ${d.color}44`, padding: '3px 8px', borderRadius: '3px' }}>
            {d.label}
          </span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>15 {a.questionsUnit} · 3 {locale === 'cs' ? 'fáze' : 'phases'}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', lineHeight: 1.7 }}>
          {displayDescription}
        </p>
      </div>

      {/* Previous best */}
      {bestAttempt && (
        <div style={{ background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '6px', padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{a.yourBest}</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: bestAttempt.isPerfect ? '#f0a830' : '#cc00aa' }}>
              {bestAttempt.score}/15
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{a.bestXP}</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: '#f0a830' }}>
              {bestAttempt.totalXp}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{a.attemptsLabel}</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: '#4a6066' }}>
              {attempts}
            </div>
          </div>
          {bestAttempt.isPerfect && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', marginLeft: 'auto' }}>
              {a.perfectScore}
            </div>
          )}
        </div>
      )}

      {/* Phase cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {PHASE_INFO.map(ph => (
          <div key={ph.phase} style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '14px 18px',
            background: '#0d0d10',
            border: `0.5px solid ${ph.color}22`,
            borderRadius: '6px',
            borderLeft: `2px solid ${ph.color}`,
          }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700, color: ph.color, minWidth: '22px' }}>
              {ph.phase}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef', marginBottom: '4px' }}>
                {ph.label}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '0.5px' }}>
                {ph.questions} {a.questionsUnit} · {ph.options} {a.optionsUnit}{ph.timed ? ` · ${a.timedLabel}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#f0a830' }}>
                +{ph.xpEach} XP
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>{a.perCorrect}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Max XP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '14px 18px', background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '6px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{a.maxXPQuiz}</span>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, color: '#f0a830' }}>{maxXP} XP</span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: 'auto' }}>
          + {attempts === 0 ? a.firstComplete : ''}
        </span>
      </div>

      {/* Credits warning */}
      {attempts > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '6px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: '#f0a830', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>⚠</span>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', lineHeight: 1.6 }}>
            {a.attemptWarning} #{attempts + 1} — {a.costsLabel} <strong>{creditsCost} {a.creditsUnit}</strong>.<br />
            {a.creditsWarning}
          </div>
        </div>
      )}

      {/* Language selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
          {a.quizLang}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['cs', 'en'] as const).map(l => (
            <Link
              key={l}
              href={`/hub/academy/${slug}?lang=${l}`}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
                padding: '8px 20px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.15s',
                color: lang === l ? '#050508' : '#4a6066',
                background: lang === l ? '#cc00aa' : 'transparent',
                border: `0.5px solid ${lang === l ? '#cc00aa' : 'rgba(74,96,102,0.3)'}`,
              }}
            >
              {l === 'cs' ? '🇨🇿 Czech' : '🇬🇧 English'}
            </Link>
          ))}
        </div>
      </div>

      {/* Start button */}
      {canStart ? (
        <Link
          href={`/hub/academy/${slug}/quiz?lang=${lang}`}
          style={{
            display: 'block', textAlign: 'center',
            fontFamily: 'var(--font-cacha)', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase',
            color: '#050508', background: '#cc00aa',
            padding: '16px 32px', borderRadius: '6px', textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          className="hover:opacity-90"
        >
          {attempts === 0 ? a.startQuiz : `${a.retry} — ${creditsCost} ${a.creditsUnit}`}
        </Link>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'block', textAlign: 'center',
            fontFamily: 'var(--font-cacha)', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase',
            color: '#2a3a3e', background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            padding: '16px 32px', borderRadius: '6px',
          }}>
            {a.retry} — {creditsCost} {a.creditsUnit}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', marginTop: '10px' }}>
            {locale === 'cs'
              ? `Nedostatek kreditů — máš ${userCredits}, potřebuješ ${creditsCost}`
              : `Insufficient credits — you have ${userCredits}, need ${creditsCost}`}
          </div>
          <Link
            href="/hub/credits"
            style={{
              display: 'inline-block', marginTop: '12px',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
              color: '#8844cc', border: '0.5px solid rgba(136,68,204,0.4)',
              borderRadius: '4px', padding: '8px 20px', textDecoration: 'none', transition: 'all 0.15s',
            }}
            className="hover:bg-[rgba(136,68,204,0.08)]"
          >
            {locale === 'cs' ? 'Koupit kredity →' : 'Buy credits →'}
          </Link>
        </div>
      )}

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Link href="/hub/academy" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none', letterSpacing: '0.5px' }}
          className="hover:text-[#cc00aa]">
          {a.backToAcademy}
        </Link>
      </div>
    </div>
  )
}
