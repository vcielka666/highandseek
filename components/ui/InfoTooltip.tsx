'use client'

import { useState, useEffect, useRef } from 'react'

interface InfoTooltipProps {
  title: string
  body: string
  accentColor?: string
}

export default function InfoTooltip({ title, body, accentColor = '#00d4c8' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '15px', height: '15px', borderRadius: '50%',
          border: `0.5px solid ${accentColor}66`,
          background: `${accentColor}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: accentColor,
          cursor: 'pointer', padding: 0, lineHeight: 1,
        }}
      >
        ?
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '20px', left: 0, zIndex: 50,
          background: '#0a1a1c', border: `0.5px solid ${accentColor}40`,
          borderRadius: '6px', padding: '12px 14px', width: '240px',
          fontFamily: 'var(--font-dm-sans)', fontSize: '11px', lineHeight: 1.6,
          color: 'rgba(232,240,239,0.65)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1.5px',
            textTransform: 'uppercase', color: accentColor, marginBottom: '6px',
          }}>
            {title}
          </div>
          {body}
        </div>
      )}
    </div>
  )
}
