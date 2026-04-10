'use client'

import { useLanguage } from '@/stores/languageStore'

const sources = ['ICMag', 'Rollitup', 'r/microgrowery', 'Grasscity', 'THCFarmer', 'H&S Forum']

export default function ForumBridgeSection() {
  const { t } = useLanguage()

  return (
    <section id="forum" className="px-6 pb-16 md:px-12 md:pb-20">
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
        style={{
          border: '0.5px solid rgba(136,68,204,0.25)',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(136,68,204,0.04) 0%, transparent 50%)',
          padding: '28px 24px',
          alignItems: 'center',
        }}
      >
        {/* Left */}
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8844cc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ opacity: 0.5 }}>//</span>
            {t.forum.tag}
          </div>
          <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px', color: '#e8f0ef', marginBottom: '12px', lineHeight: 1.2 }}>
            {t.forum.title1}<br />
            <span style={{ color: '#8844cc' }}>{t.forum.title2}</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#4a6066', lineHeight: 1.7, marginBottom: '20px' }}>
            {t.forum.desc}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sources.map((src) => (
              <span key={src} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', color: '#4a6066', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '3px', padding: '3px 9px' }}>
                {src}
              </span>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '0.5px solid rgba(136,68,204,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '0.5px solid rgba(136,68,204,0.15)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(136,68,204,0.06)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cc00aa', display: 'inline-block' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f0a830', display: 'inline-block' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4c8', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', marginLeft: '4px' }}>
              {t.forum.query}
            </span>
          </div>
          {t.forum.results.map((result, i) => (
            <div key={i} style={{ padding: '12px 14px', borderBottom: i < t.forum.results.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#00d4c8', marginBottom: '4px' }}>
                {result.source}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(232,240,239,0.65)', lineHeight: 1.5 }}>
                {result.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
