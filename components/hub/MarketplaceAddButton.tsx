'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MarketplaceAddButton({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <Link
      href="/hub/marketplace/new"
      style={{
        fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
        color: '#050508', background: '#f0a830',
        padding: '10px 18px', borderRadius: '4px', textDecoration: 'none',
        whiteSpace: 'nowrap', flexShrink: 0,
        display: 'inline-block',
        transform: visible ? 'perspective(600px) rotateX(0deg)' : 'perspective(600px) rotateX(-90deg)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s ease',
        transformOrigin: 'top center',
      }}
    >
      {label}
    </Link>
  )
}
