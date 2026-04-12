'use client'

import { useEffect, useState } from 'react'

export default function FlowersBgImage() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight
      const progress = maxScroll > 0 ? Math.min(scrolled / maxScroll, 1) : 0
      setOpacity(progress * 0.5)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/flowersIcon.png"
      alt=""
      aria-hidden
      className="w-full md:w-1/2"
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}
