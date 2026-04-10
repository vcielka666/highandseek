'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useWallet } from '@solana/wallet-adapter-react'
import { useLanguage } from '@/stores/languageStore'

interface Package {
  credits: number
  czk: number
  label: string
}

interface Props {
  packages: Package[]
  balance: number
  walletAddress: string
  userId: string
}

type Tab = 'card' | 'solana'

function BuyCreditsClientImpl({ packages, balance, walletAddress, userId }: Props) {
  const { t } = useLanguage()
  const cr = t.credits

  const [tab, setTab]           = useState<Tab>('card')
  const [loading, setLoading]   = useState<number | null>(null)
  const [solPrice, setSolPrice] = useState(0) // CZK per SOL
  const [verifying, setVerifying] = useState<number | null>(null)

  const wallet = useWallet()

  useEffect(() => {
    fetch('/api/hub/credits/sol-price')
      .then(r => r.json() as Promise<{ sol_czk: number }>)
      .then(d => setSolPrice(d.sol_czk ?? 0))
      .catch(() => setSolPrice(0))
  }, [])

  async function buyWithCard(credits: number) {
    setLoading(credits)
    try {
      const res  = await fetch('/api/hub/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(null)
    }
  }

  async function buyWithSolana(credits: number) {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Connect your wallet first')
      return
    }
    if (solPrice === 0) {
      toast.error(cr.priceUnavailable)
      return
    }

    const expectedSol = (credits * 25) / solPrice // 1 credit = 25 CZK, solPrice = CZK/SOL
    toast.info(`Send ${expectedSol.toFixed(4)} SOL to ${process.env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS ?? 'treasury'}, then click Verify below.`)
    setVerifying(credits)
  }

  async function verifySolana(credits: number) {
    const sig = prompt('Enter your Solana transaction signature:')
    if (!sig) return

    setVerifying(credits)
    try {
      const res  = await fetch('/api/hub/credits/solana-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: sig.trim(), credits }),
      })
      const data = await res.json() as { ok?: boolean; credits?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Verification failed')
      toast.success(cr.successPurchase)
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(null)
    }
  }

  const connected = wallet.connected
  const displayWallet = wallet.publicKey?.toBase58() ?? walletAddress

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
    padding: '10px 20px', cursor: 'pointer', border: 'none',
    background: active ? 'rgba(136,68,204,0.15)' : 'transparent',
    color: active ? '#8844cc' : '#4a6066',
    borderBottom: active ? '2px solid #8844cc' : '2px solid transparent',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Tab switcher */}
      <div style={{ borderBottom: '0.5px solid rgba(136,68,204,0.15)', display: 'flex' }}>
        <button style={tabStyle(tab === 'card')}   onClick={() => setTab('card')}>
          {cr.cardTab}
        </button>
        <button style={tabStyle(tab === 'solana')} onClick={() => setTab('solana')}>
          {cr.solanaTab}
        </button>
      </div>

      {/* Packages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {packages.map(pkg => (
          <div key={pkg.credits} style={{
            padding: '20px 16px',
            background: '#0d0d10',
            border: '0.5px solid rgba(136,68,204,0.2)',
            borderRadius: '8px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            transition: 'border-color 0.2s',
          }}
            className="hover:border-[rgba(136,68,204,0.5)]"
          >
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, color: '#f0a830' }}>
              💎 {pkg.credits}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
              {pkg.label}
            </div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#e8f0ef' }}>
              {pkg.czk.toLocaleString('cs-CZ')} Kč
            </div>

            {tab === 'card' && (
              <button
                onClick={() => buyWithCard(pkg.credits)}
                disabled={loading === pkg.credits}
                style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
                  color: '#050508', background: loading === pkg.credits ? 'rgba(136,68,204,0.5)' : '#8844cc',
                  border: 'none', borderRadius: '4px', padding: '9px 16px',
                  cursor: loading === pkg.credits ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
                }}
              >
                {loading === pkg.credits ? '...' : cr.buyBtn}
              </button>
            )}

            {tab === 'solana' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {solPrice > 0 ? (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                    ≈ {(pkg.czk / solPrice).toFixed(4)} SOL
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                    {cr.priceUnavailable}
                  </div>
                )}
                <button
                  onClick={() => verifying === pkg.credits ? verifySolana(pkg.credits) : buyWithSolana(pkg.credits)}
                  disabled={!connected || solPrice === 0}
                  style={{
                    fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
                    color: '#050508', background: !connected || solPrice === 0 ? 'rgba(136,68,204,0.3)' : '#8844cc',
                    border: 'none', borderRadius: '4px', padding: '9px 16px',
                    cursor: !connected || solPrice === 0 ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
                  }}
                >
                  {verifying === pkg.credits ? cr.verifying : cr.payWithSol}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Solana wallet status */}
      {tab === 'solana' && (
        <div style={{ padding: '16px', background: 'rgba(136,68,204,0.04)', border: '0.5px solid rgba(136,68,204,0.15)', borderRadius: '6px' }}>
          {connected || displayWallet ? (
            <div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                {cr.walletConnected}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#8844cc', wordBreak: 'break-all' }}>
                {displayWallet}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
              {cr.connectWallet} — go to your profile to connect a Solana wallet.
            </div>
          )}
        </div>
      )}

      {/* What are credits */}
      <div style={{ padding: '16px 20px', background: 'rgba(136,68,204,0.04)', border: '0.5px solid rgba(136,68,204,0.12)', borderRadius: '8px' }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8844cc', marginBottom: '10px' }}>
          {cr.whatAreCredits}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.7, marginBottom: '8px' }}>
          {cr.creditsExplain}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', lineHeight: 1.6 }}>
          {cr.creditsUsedFor}
        </div>
      </div>

      {/* Current balance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '6px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{cr.balance}</span>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', fontWeight: 700, color: '#f0a830' }}>
          💎 {balance}
        </span>
      </div>
    </div>
  )
}

import { SolanaWalletProvider } from '@/components/hub/SolanaWalletProvider'

export default function BuyCreditsInnerExport(props: Props) {
  return (<SolanaWalletProvider><BuyCreditsClientImpl {...props} /></SolanaWalletProvider>)
}
