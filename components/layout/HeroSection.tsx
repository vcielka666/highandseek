'use client'

import Link from 'next/link'
import HeroGrid from './HeroGrid'
import { useLanguage } from '@/stores/languageStore'

function CannabisLeaf() {
  const j = { x: 40, y: 50 }
  const tips = [
    { x: 40, y: 4  },
    { x: 16, y: 14 },
    { x: 64, y: 14 },
    { x: 4,  y: 36 },
    { x: 76, y: 36 },
    { x: 27, y: 63 },
    { x: 53, y: 63 },
  ]
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px', opacity: 0, animation: 'fadeUp 0.6s ease forwards 0.85s' }}>
      <svg width="80" height="76" viewBox="0 0 80 76" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1={j.x} y1={j.y} x2="40" y2="74" stroke="#00d4c8" strokeWidth="1.2" strokeLinecap="round" />
        {tips.map((tip, i) => (
          <line key={i} x1={j.x} y1={j.y} x2={tip.x} y2={tip.y} stroke="#00d4c8" strokeWidth="1" strokeLinecap="butt" />
        ))}
      </svg>
    </div>
  )
}

export default function HeroSection() {
  const { t } = useLanguage()
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="px-6 pt-24 pb-16 md:px-12 md:pt-[100px] md:pb-20"
    >
      <HeroGrid />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px', width: '100%' }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#00d4c8', marginBottom: '24px', opacity: 0, animation: 'fadeUp 0.6s ease forwards 0.3s' }}>
          {t.hero.eyebrow}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(28px, 8vw, 72px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '8px', opacity: 0, animation: 'fadeUp 0.6s ease forwards 0.5s' }}>
          <span style={{ color: '#e8f0ef', fontFamily: 'var(--font-cacha)' }}>HIGH</span>
          <span style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(40px, 11vw, 96px)', fontWeight: 700, color: '#cc00aa', display: 'block', lineHeight: 1, textShadow: '0 0 40px rgba(204,0,170,0.5)', opacity: 0, animation: 'fadeUp 0.6s ease forwards 0.7s, glitch 8s step-end infinite 2s' }}>
            &amp;
          </span>
          <span style={{ color: 'transparent', WebkitTextStroke: '1px #00d4c8', display: 'block', fontFamily: 'var(--font-orbitron)' }}>
            SEEK
          </span>
        </h1>

        {/* Cannabis leaf */}
        <CannabisLeaf />

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', opacity: 0, animation: 'fadeUp 0.6s ease forwards 1.1s' }}>

          {/* Collection button — image floats behind it */}
          <div style={{ position: 'relative' }} className="w-full sm:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landingPage/behindCollection.png"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-40px',
                top: '-33px',
                width: '348px',
                maxWidth: 'none',
                height: 'auto',
                objectFit: 'fill',
                opacity: 0.65,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                zIndex: 0,
                transform: 'scaleX(-1)',
                WebkitMaskImage: 'radial-gradient(ellipse 85% 55% at 50% 50%, black 10%, transparent 60%)',
                maskImage: 'radial-gradient(ellipse 85% 55% at 50% 50%, black 10%, transparent 60%)',
              }}
            />
            <Link
              href="/shop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '18px 0',
                borderRadius: '6px',
                textDecoration: 'none',
                background: 'rgba(0,212,200,0.08)',
                border: 'none',
                boxShadow: '0 0 20px rgba(0,212,200,0.1), inset 0 0 20px rgba(0,212,200,0.05)',
                transition: 'all 0.25s',
                position: 'relative',
                zIndex: 1,
              }}
              className="w-full sm:w-[200px] hover:bg-[rgba(0,212,200,0.15)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(0,212,200,0.25),inset_0_0_30px_rgba(0,212,200,0.08)]"
            >
              <span style={{ fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#00d4c8', position: 'relative', zIndex: 1 }}>
                {t.hero.cta1Label}
              </span>
              <span style={{ fontSize: '10px', letterSpacing: '0.5px', color: '#4a6066', position: 'relative', zIndex: 1 }}>
                {t.hero.cta1Sub}
              </span>
            </Link>
          </div>

          {/* Hub button — steam floats behind it */}
          <div style={{ position: 'relative' }} className="w-full sm:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landingPage/steam.png"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-53px',
                top: '-49px',
                width: '348px',
                maxWidth: 'none',
                height: 'auto',
                objectFit: 'fill',
                opacity: 0.65,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                zIndex: 0,
                WebkitMaskImage: 'radial-gradient(ellipse 85% 55% at 50% 50%, black 10%, transparent 60%)',
                maskImage: 'radial-gradient(ellipse 85% 55% at 50% 50%, black 10%, transparent 60%)',
              }}
            />
            <Link
              href="/hub"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '18px 0',
                borderRadius: '6px',
                textDecoration: 'none',
                background: 'rgba(204,0,170,0.08)',
                border: 'none',
                boxShadow: '0 0 20px rgba(204,0,170,0.1), inset 0 0 20px rgba(204,0,170,0.05)',
                transition: 'all 0.25s',
                position: 'relative',
                zIndex: 1,
              }}
              className="w-full sm:w-[200px] hover:bg-[rgba(204,0,170,0.15)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(204,0,170,0.25),inset_0_0_30px_rgba(204,0,170,0.08)]"
            >
              <span style={{ fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#cc00aa' }}>
                {t.hero.cta2Label}
              </span>
              <span style={{ fontSize: '10px', letterSpacing: '0.5px', color: '#4a6066' }}>
                {t.hero.cta2Sub}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
