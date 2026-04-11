'use client'

import { useState, useRef, useEffect } from 'react'
import type { LevelData } from '@/lib/xp/utils'

export default function LevelInfoPopup({
  level,
  name,
  levels,
}: {
  level: number
  name: string
  levels: readonly LevelData[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '11px',
          color: open ? '#f0a830' : 'rgba(240,168,48,0.8)',
          background: open ? 'rgba(240,168,48,0.08)' : 'transparent',
          border: open ? '0.5px solid rgba(240,168,48,0.3)' : '0.5px solid transparent',
          borderRadius: '4px',
          padding: '3px 8px 3px 0',
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ⚡ Level {level} · {name}
        <span style={{ fontSize: '9px', color: open ? '#f0a830' : 'rgba(240,168,48,0.4)' }}>ⓘ</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '280px',
          background: '#09100f',
          border: '0.5px solid rgba(240,168,48,0.25)',
          borderRadius: '10px',
          padding: '16px',
          zIndex: 100,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.6)', marginBottom: '12px' }}>
            Level Progression
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {levels.map(lvl => {
              const isCurrent = lvl.level === level
              const isPast = lvl.level < level
              return (
                <div
                  key={lvl.level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: isCurrent ? 'rgba(240,168,48,0.1)' : 'transparent',
                    border: isCurrent ? '0.5px solid rgba(240,168,48,0.3)' : '0.5px solid transparent',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-orbitron)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isCurrent ? '#f0a830' : isPast ? 'rgba(240,168,48,0.35)' : '#4a6066',
                    width: '20px',
                    flexShrink: 0,
                  }}>
                    {lvl.level}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '11px',
                    color: isCurrent ? '#e8f0ef' : isPast ? 'rgba(232,240,239,0.35)' : '#4a6066',
                    flex: 1,
                  }}>
                    {lvl.name}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '9px',
                    color: isCurrent ? 'rgba(240,168,48,0.7)' : isPast ? 'rgba(74,96,102,0.5)' : '#4a6066',
                    flexShrink: 0,
                  }}>
                    {lvl.xpRequired === 0 ? 'Start' : `${lvl.xpRequired.toLocaleString('en-US')} XP`}
                  </span>
                  {isPast && (
                    <span style={{ fontSize: '10px', flexShrink: 0 }}>✓</span>
                  )}
                  {isCurrent && (
                    <span style={{ fontSize: '10px', color: '#f0a830', flexShrink: 0 }}>◉</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
