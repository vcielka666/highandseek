'use client'

import { useEffect, useState } from 'react'

export interface XPEventData {
  event:     string
  amount:    number
  createdAt: string
}

interface Props {
  xp:       number
  level:    number
  percent:  number
  name:     string
  nextName: string | null
  nextXP:   number | null
  events:   XPEventData[]
  expanded?: boolean
  labels: {
    title:    string
    level:    string
    toNext:   string
    recentXP: string
    noXP:     string
  }
}

const EVENT_LABELS: Record<string, string> = {
  WATER_PLANT:       '🌿 Watered plant',
  FEED_PLANT:        '🧪 Fed plant',
  FORUM_QUESTION:    '🔍 Asked question',
  FIRST_PURCHASE:    '🛒 First purchase',
  GROW_COMPLETED:    '🏆 Grow completed',
  FIRST_STRAIN_CHAT: '🧬 First strain chat',
}

const RADIUS  = 32
const CIRC    = 2 * Math.PI * RADIUS

export default function XPCard({ xp, level, percent, name, nextName, nextXP, events, expanded = false, labels }: Props) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])

  const offset = CIRC - (CIRC * (animated ? percent / 100 : 0))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: expanded ? '28px' : '16px', gap: '10px', alignItems: expanded ? 'flex-start' : 'center', justifyContent: expanded ? 'flex-start' : 'center' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.6)', alignSelf: 'flex-start' }}>
        {labels.title}
      </div>

      {/* Ring + level */}
      <div style={{ position: 'relative', width: expanded ? 80 : 72, height: expanded ? 80 : 72 }}>
        <svg width="100%" height="100%" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="rgba(240,168,48,0.12)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={RADIUS} fill="none"
            stroke="#f0a830" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: expanded ? '20px' : '18px', fontWeight: 700, color: '#f0a830', lineHeight: 1 }}>{level}</span>
        </div>
      </div>

      <div style={{ textAlign: expanded ? 'left' : 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', fontWeight: 600 }}>{name}</div>
        {nextName && nextXP && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', marginTop: '2px' }}>
            {(nextXP - xp).toLocaleString('en-US')} XP {labels.toNext}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ width: '100%', marginTop: '12px' }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginBottom: '10px' }}>
            {labels.recentXP}
          </div>
          {events.length > 0
            ? events.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid rgba(74,96,102,0.1)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>{EVENT_LABELS[e.event] ?? e.event}</span>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#f0a830', fontWeight: 700 }}>+{e.amount}</span>
                </div>
              ))
            : <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>{labels.noXP}</div>
          }
        </div>
      )}
    </div>
  )
}
