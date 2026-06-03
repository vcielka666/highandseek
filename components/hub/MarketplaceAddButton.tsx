'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GuestRegisterPrompt from './GuestRegisterPrompt'

export default function MarketplaceAddButton({ label, guestMode }: { label: string; guestMode?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
    color: '#050508', background: '#f0a830',
    padding: '10px 18px', borderRadius: '4px', textDecoration: 'none',
    whiteSpace: 'nowrap', flexShrink: 0,
    display: 'inline-block', cursor: 'pointer',
    transform: visible ? 'perspective(600px) rotateX(0deg)' : 'perspective(600px) rotateX(-90deg)',
    opacity: visible ? 1 : 0,
    transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s ease',
    transformOrigin: 'top center',
    border: 'none',
  }

  if (guestMode) return (
    <>
      <GuestRegisterPrompt open={showPrompt} onClose={() => setShowPrompt(false)} variant="market" />
      <button style={btnStyle} onClick={() => setShowPrompt(true)}>{label}</button>
    </>
  )

  return (
    <Link href="/hub/marketplace/new" style={btnStyle}>{label}</Link>
  )
}
