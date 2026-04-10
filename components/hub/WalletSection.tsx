'use client'

import { useEffect, useState } from 'react'

interface Props {
  walletAddress: string
  userId: string
}

export default function WalletSection({ walletAddress, userId }: Props) {
  const [Content, setContent] = useState<React.ComponentType<Props> | null>(null)

  useEffect(() => {
    let cancelled = false
    import('./WalletConnectSection').then(m => {
      if (!cancelled) setContent(() => m.WalletConnectSection)
    })
    return () => { cancelled = true }
  }, [])

  if (!Content) return null
  return <Content walletAddress={walletAddress} userId={userId} />
}
