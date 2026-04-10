'use client'

import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'

function FeatureGrid({ features, dotColor }: { features: readonly string[]; dotColor: string }) {
  return (
    <div style={{ padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {features.map((feat) => (
        <div
          key={feat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '4px',
            border: '0.5px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.02)',
            fontSize: '11px',
            transition: 'all 0.15s',
          }}
          className="hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.08)]"
        >
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0, background: dotColor, boxShadow: `0 0 4px ${dotColor}`, display: 'inline-block' }} />
          <span style={{ color: 'rgba(232,240,239,0.7)' }}>{feat}</span>
        </div>
      ))}
    </div>
  )
}

export default function PillarsSection() {
  const { t } = useLanguage()

  return (
    <>
      {/* Divider */}
      <div id="shop" style={{ display: 'flex', alignItems: 'center', padding: '0 48px', margin: '0 0 60px' }}>
        <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,212,200,0.1)' }} />
      </div>

      {/* Pillars */}
      <section style={{ padding: '0 48px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Shop */}
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid rgba(0,212,200,0.2)', background: 'linear-gradient(160deg, rgba(0,212,200,0.04) 0%, transparent 60%)' }}>
          <div style={{ padding: '28px 28px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#007a74', marginBottom: '12px' }}>
              {t.shop.pillarNum}
            </div>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '24px', letterSpacing: '-0.5px', color: '#00d4c8', marginBottom: '8px' }}>
              {t.shop.title}
            </div>
            <div style={{ fontSize: '13px', color: '#4a6066', lineHeight: 1.6, marginBottom: '14px' }}>
              {t.shop.desc}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '3px', padding: '3px 9px', background: 'rgba(0,212,200,0.06)', color: '#007a74', border: '0.5px solid rgba(0,212,200,0.2)' }}>
              {t.shop.tag}
            </span>
          </div>
          <FeatureGrid features={t.shop.features} dotColor="#00d4c8" />
          <div style={{ padding: '0 20px 20px' }}>
            <Link href="/shop" style={{ display: 'block', width: '100%', padding: '11px', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', background: 'rgba(0,212,200,0.08)', color: '#00d4c8', border: '0.5px solid rgba(0,212,200,0.3)', transition: 'all 0.2s' }}
              className="hover:bg-[rgba(0,212,200,0.16)] hover:shadow-[0_0_16px_rgba(0,212,200,0.2)]">
              {t.shop.cta}
            </Link>
          </div>
        </div>

        {/* Hub */}
        <div id="hub" style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid rgba(204,0,170,0.2)', background: 'linear-gradient(160deg, rgba(204,0,170,0.04) 0%, transparent 60%)' }}>
          <div style={{ padding: '28px 28px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.6)', marginBottom: '12px' }}>
              {t.hub.pillarNum}
            </div>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '24px', letterSpacing: '-0.5px', color: '#cc00aa', marginBottom: '8px' }}>
              {t.hub.title}
            </div>
            <div style={{ fontSize: '13px', color: '#4a6066', lineHeight: 1.6, marginBottom: '14px' }}>
              {t.hub.desc}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '3px', padding: '3px 9px', background: 'rgba(240,168,48,0.06)', color: '#8a5e1a', border: '0.5px solid rgba(240,168,48,0.2)' }}>
              {t.hub.tag}
            </span>
          </div>
          <FeatureGrid features={t.hub.features} dotColor="#cc00aa" />
          <div style={{ padding: '0 20px 20px' }}>
            <Link href="/hub" style={{ display: 'block', width: '100%', padding: '11px', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', background: 'rgba(204,0,170,0.08)', color: '#cc00aa', border: '0.5px solid rgba(204,0,170,0.3)', transition: 'all 0.2s' }}
              className="hover:bg-[rgba(204,0,170,0.16)] hover:shadow-[0_0_16px_rgba(204,0,170,0.2)]">
              {t.hub.cta}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
