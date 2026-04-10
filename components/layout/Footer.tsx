'use client'

import { useLanguage } from '@/stores/languageStore'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer
      style={{
        padding: '20px 24px',
        borderTop: '0.5px solid rgba(0,212,200,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'rgba(10,36,40,0.3)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: '#4a6066' }}>
        HIGH<span style={{ color: '#007a74' }}>&amp;</span>SEEK
      </div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', opacity: 0.5 }}>
        {t.footer}
      </div>
    </footer>
  )
}
