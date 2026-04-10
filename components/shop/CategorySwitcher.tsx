'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const CATEGORIES = [
  { value: 'flower', label: 'Flowers',  icon: '/icons/flowersIcon.png'  },
  { value: 'seed',   label: 'Genetics', icon: '/icons/geneticsIcon.png' },
  { value: 'merch',  label: 'Merch',    icon: '/icons/merchIcon.png'    },
]

export default function CategorySwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const currentCat = CATEGORIES.find((c) => c.value === current) ?? CATEGORIES[0]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-cacha)',
          fontSize: '15px',
          letterSpacing: '1px',
          color: open ? '#00d4c8' : '#e8f0ef',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 0',
          transition: 'color 0.15s',
        }}
      >
        {currentCat.label}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: '#0a1a0d',
          border: '0.5px solid rgba(0,212,200,0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: '160px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,212,200,0.08)',
        }}>
          {CATEGORIES.map((cat) => {
            const active = cat.value === current
            return (
              <button
                key={cat.value}
                onClick={() => {
                  router.push(`/shop?category=${cat.value}`)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  background: active ? 'rgba(0,212,200,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '0.5px solid rgba(0,212,200,0.06)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                className={active ? '' : 'hover:bg-[rgba(0,212,200,0.05)]'}
              >
                <Image
                  src={cat.icon}
                  alt={cat.label}
                  width={cat.value === 'merch' ? 18 : 26}
                  height={cat.value === 'merch' ? 18 : 26}
                  style={{ opacity: active ? 1 : 0.45, flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: active ? '#00d4c8' : '#4a6066',
                  fontWeight: active ? 700 : 400,
                }}>
                  {cat.label}
                </span>
                {active && (
                  <span style={{ marginLeft: 'auto', color: '#00d4c8', fontSize: '10px' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
