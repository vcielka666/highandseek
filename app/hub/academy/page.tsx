import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import AcademyTopic from '@/lib/db/models/AcademyTopic'
import QuizAttempt from '@/lib/db/models/QuizAttempt'
import mongoose from 'mongoose'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'


export default async function AcademyPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/academy')

  const { locale, t } = await getServerT()
  const a = t.academy

  const DIFFICULTY: Record<string, { label: string; color: string; bg: string; border: string }> = locale === 'cs'
    ? {
        beginner:     { label: 'Začátečník',       color: '#00d4c8', bg: 'rgba(0,212,200,0.08)',  border: 'rgba(0,212,200,0.2)'  },
        intermediate: { label: 'Středně pokročilý', color: '#f0a830', bg: 'rgba(240,168,48,0.08)', border: 'rgba(240,168,48,0.2)' },
        advanced:     { label: 'Pokročilý',         color: '#cc00aa', bg: 'rgba(204,0,170,0.08)',  border: 'rgba(204,0,170,0.2)'  },
      }
    : {
        beginner:     { label: 'Beginner',     color: '#00d4c8', bg: 'rgba(0,212,200,0.08)',  border: 'rgba(0,212,200,0.2)'  },
        intermediate: { label: 'Intermediate', color: '#f0a830', bg: 'rgba(240,168,48,0.08)', border: 'rgba(240,168,48,0.2)' },
        advanced:     { label: 'Advanced',     color: '#cc00aa', bg: 'rgba(204,0,170,0.08)',  border: 'rgba(204,0,170,0.2)'  },
      }

  await connectDB()

  const topics = await AcademyTopic.find({ isActive: true }).sort({ order: 1 }).lean()

  // User progress per topic
  const progress = await QuizAttempt.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
    {
      $group: {
        _id:         '$topicSlug',
        bestScore:   { $max: '$score' },
        bestXp:      { $max: '$totalXp' },
        attempts:    { $sum: 1 },
        isPerfect:   { $max: '$isPerfect' },
      },
    },
  ])
  const progressMap = new Map(progress.map(p => [p._id as string, p]))

  return (
    <div style={{ maxWidth: '900px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: 'Academy' }]} color="#cc00aa" />

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 700, color: '#e8f0ef', letterSpacing: '2px', marginBottom: '8px' }}>
          {a.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', lineHeight: 1.7, maxWidth: '500px' }}>
          {a.subtitle}
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { label: a.topicsLabel, value: topics.length },
          { label: a.completedLabel, value: progressMap.size },
          { label: a.maxXP, value: `${topics.length * 450} XP` },
        ].map(s => (
          <div key={s.label} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>
            <span style={{ color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginRight: '8px' }}>{s.label}</span>
            <span style={{ color: '#f0a830', fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Topic grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {topics.map(topic => {
          const p = progressMap.get(topic.slug)
          const completed = !!p
          const d = DIFFICULTY[topic.difficulty] ?? DIFFICULTY.beginner
          const nextAttemptCost = p ? (p.attempts === 1 ? 25 : 50) : 0

          return (
            <div key={topic.slug} style={{
              background: '#0d0d10',
              border: `0.5px solid ${completed ? 'rgba(204,0,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'border-color 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Top accent line */}
              {completed && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #cc00aa, #8844cc)' }} />
              )}

              {/* Icon + difficulty */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '40px', lineHeight: 1 }}>{topic.icon}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: d.color, background: d.bg, border: `0.5px solid ${d.border}`, padding: '3px 8px', borderRadius: '3px' }}>
                  {d.label}
                </span>
              </div>

              {/* Title + description */}
              <div>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef', marginBottom: '6px', lineHeight: 1.3 }}>
                  {locale === 'cs' ? topic.title : (topic.titleEn || topic.title)}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {locale === 'cs' ? topic.description : (topic.descriptionEn || topic.description)}
                </div>
              </div>

              {/* XP */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>Up to</span>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#f0a830' }}>
                  {topic.xpAvailable} XP
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e' }}>· 15 {a.questionsUnit}</span>
              </div>

              {/* Progress if completed */}
              {completed && p && (
                <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'rgba(204,0,170,0.05)', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '4px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: p.isPerfect ? '#f0a830' : '#cc00aa' }}>
                      {p.bestScore}/15
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '0.5px' }}>Best</div>
                  </div>
                  <div style={{ width: '0.5px', background: 'rgba(204,0,170,0.15)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#f0a830' }}>
                      {p.bestXp}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '0.5px' }}>XP</div>
                  </div>
                  <div style={{ width: '0.5px', background: 'rgba(204,0,170,0.15)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#4a6066' }}>
                      {p.attempts}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', letterSpacing: '0.5px' }}>Tries</div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: 'auto' }}>
                {completed ? (
                  <Link
                    href={`/hub/academy/${topic.slug}`}
                    style={{
                      display: 'block', textAlign: 'center',
                      fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                      color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)',
                      padding: '10px', borderRadius: '4px', textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                    className="hover:border-[rgba(204,0,170,0.4)] hover:text-[#cc00aa]"
                  >
                    {a.retry} — {nextAttemptCost} {a.creditsUnit}
                  </Link>
                ) : (
                  <Link
                    href={`/hub/academy/${topic.slug}`}
                    style={{
                      display: 'block', textAlign: 'center',
                      fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px',
                      color: '#050508', background: '#cc00aa',
                      padding: '10px', borderRadius: '4px', textDecoration: 'none',
                      transition: 'opacity 0.15s',
                    }}
                    className="hover:opacity-90"
                  >
                    {a.startQuiz}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {topics.length === 0 && (
        <div style={{ background: '#0d0d10', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>📚</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066', marginBottom: '8px' }}>
            {a.noTopics}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e' }}>
            Run: pnpm tsx scripts/seed-academy.ts
          </div>
        </div>
      )}
    </div>
  )
}
