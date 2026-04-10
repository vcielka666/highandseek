'use client'

import { useEffect, useState } from 'react'

interface Package {
  credits: number
  usd: number
  label: string
}

interface Props {
  packages: Package[]
  balance: number
  walletAddress: string
  userId: string
}

export default function BuyCreditsClient(props: Props) {
  const [Content, setContent] = useState<React.ComponentType<Props> | null>(null)

  useEffect(() => {
    let cancelled = false
    import('./BuyCreditsInner').then(m => {
      if (!cancelled) setContent(() => m.default)
    })
    return () => { cancelled = true }
  }, [])

  if (!Content) return null
  return <Content {...props} />
}
