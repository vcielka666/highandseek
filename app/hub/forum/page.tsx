'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Suspense } from 'react'

const TRENDING = [
  'Best LED for 2×2 tent?',
  'Spider mites organic fix?',
  'Living soil vs coco — which for beginners?',
  'VPD explained simply',
  'When to harvest — trichome guide',
  'Autoflower feeding schedule',
]

interface Source {
  site: string
  title: string
  url: string
}

interface RecentQuestion {
  _id: string
  question: string
  answer: string
  createdAt: string
}

function ForumContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const prefill = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(prefill)
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)

  useEffect(() => {
    if (prefill) setQuery(prefill)
  }, [prefill])

  useEffect(() => {
    async function loadRecent() {
      if (!session) return
      try {
        const r = await fetch('/api/hub/forum/recent')
        if (r.ok) setRecentQuestions(await r.json())
      } catch { /* silent */ }
    }
    loadRecent()
  }, [session])

  async function handleAsk(q: string) {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setAnswer('')
    setSources([])
    setHelpful(null)
    setCurrentQuestionId(null)
    try {
      const r = await fetch('/api/hub/forum/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed')
      setAnswer(data.answer)
      setSources(data.sources ?? [])
      setCurrentQuestionId(data.questionId)
      if (data.xpAwarded) toast.success(`+${data.xpAwarded} XP earned!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleHelpful(value: boolean) {
    if (!currentQuestionId || helpful !== null) return
    setHelpful(value)
    try {
      await fetch('/api/hub/forum/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQuestionId, helpful: value }),
      })
    } catch { /* silent */ }
  }

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: '800px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(136,68,204,0.6)', marginBottom: '6px' }}>
        Hub · Forum Bridge
      </div>
      <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '28px', letterSpacing: '1px', color: '#e8f0ef', marginBottom: '6px' }}>
        Forum Bridge
      </h1>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', marginBottom: '24px', lineHeight: 1.6 }}>
        AI-synthesized answers from ICMag, Rollitup, Reddit & more.
      </p>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleAsk(query) }}
        style={{ marginBottom: '20px' }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about growing cannabis..."
            style={{
              width: '100%',
              background: 'rgba(136,68,204,0.06)',
              border: '1px solid rgba(136,68,204,0.3)',
              borderRadius: '6px',
              color: '#e8f0ef',
              padding: '14px 52px 14px 18px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#8844cc' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(136,68,204,0.3)' }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: loading ? 'wait' : 'pointer',
              color: '#8844cc', display: 'flex', padding: '4px',
            }}
          >
            {loading ? (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="16" cy="16" r="13" stroke="rgba(136,68,204,0.2)" strokeWidth="2" />
                <path d="M16 3 A13 13 0 0 1 29 16" stroke="#8844cc" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </form>

      {/* Trending questions */}
      {!answer && !loading && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
            Trending this week
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TRENDING.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                style={{
                  fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#8844cc',
                  background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.25)',
                  borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                className="hover:bg-[rgba(136,68,204,0.15)] hover:border-[rgba(136,68,204,0.5)]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Answer display */}
      {(loading || answer) && (
        <div style={{ background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.2)', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[80, 95, 70, 85, 60].map((w, i) => (
                <div key={i} style={{ height: '12px', background: 'rgba(136,68,204,0.08)', borderRadius: '4px', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef', lineHeight: 1.8, marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                {answer}
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div style={{ borderTop: '0.5px solid rgba(136,68,204,0.15)', paddingTop: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
                    Sources
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sources.map((src, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(136,68,204,0.05)', borderRadius: '4px', border: '0.5px solid rgba(136,68,204,0.12)' }}>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc', letterSpacing: '0.5px', flexShrink: 0 }}>
                          {src.site}
                        </span>
                        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {src.title}
                        </span>
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc', textDecoration: 'none', flexShrink: 0 }}
                            className="hover:text-[#aa66ff]">
                            Read →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpful? */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>Was this helpful?</span>
                <button onClick={() => handleHelpful(true)}
                  style={{ background: helpful === true ? 'rgba(0,212,200,0.15)' : 'transparent', border: `0.5px solid ${helpful === true ? '#00d4c8' : 'rgba(255,255,255,0.1)'}`, borderRadius: '4px', padding: '5px 12px', cursor: helpful !== null ? 'default' : 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: helpful === true ? '#00d4c8' : '#4a6066', transition: 'all 0.15s' }}>
                  👍
                </button>
                <button onClick={() => handleHelpful(false)}
                  style={{ background: helpful === false ? 'rgba(204,0,170,0.15)' : 'transparent', border: `0.5px solid ${helpful === false ? '#cc00aa' : 'rgba(255,255,255,0.1)'}`, borderRadius: '4px', padding: '5px 12px', cursor: helpful !== null ? 'default' : 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: helpful === false ? '#cc00aa' : '#4a6066', transition: 'all 0.15s' }}>
                  👎
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* My recent questions */}
      {recentQuestions.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '10px' }}>
            My recent questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentQuestions.slice(0, 5).map((q) => (
              <button
                key={q._id}
                onClick={() => handleAsk(q.question)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(136,68,204,0.04)', border: '0.5px solid rgba(136,68,204,0.1)', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                className="hover:border-[rgba(136,68,204,0.3)] hover:bg-[rgba(136,68,204,0.08)]"
              >
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '12px' }}>
                  {q.question}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', flexShrink: 0 }}>
                  {new Date(q.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ForumPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '28px 24px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
        Loading...
      </div>
    }>
      <ForumContent />
    </Suspense>
  )
}
