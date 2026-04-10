'use client'

import { useState, useRef } from 'react'

interface StoryExpandProps {
  originLabel: string
  story1: string
  story2: string
  story3: string
}

export default function StoryExpand({ originLabel, story1, story2, story3 }: StoryExpandProps) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{
        fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px',
        textTransform: 'uppercase', color: 'rgba(204,0,170,0.35)', marginBottom: '5px',
      }}>
        {originLabel}
      </div>

      {/* Text container — animates max-height */}
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 600}px` : '66px',
          transition: 'max-height 0.55s ease',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.75,
          color: 'rgba(232,240,239,0.45)', margin: '0 0 10px',
        }}>
          {story1}
        </p>
        <p style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.75,
          color: 'rgba(232,240,239,0.45)', margin: '0 0 10px',
        }}>
          {story2}
        </p>
        <p style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '12px', lineHeight: 1.75,
          color: 'rgba(232,240,239,0.7)', margin: 0,
        }}>
          {story3}
        </p>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '4px', marginTop: '8px',
          background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.3)',
          color: '#cc00aa', cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px' }}>
          {open ? 'read less' : 'read more'}
        </span>
        <span style={{
          fontSize: '12px', lineHeight: 1,
          display: 'inline-block',
          transition: 'transform 0.3s ease',
          transform: open ? 'rotate(180deg)' : 'none',
        }}>
          ▾
        </span>
      </button>
    </div>
  )
}
