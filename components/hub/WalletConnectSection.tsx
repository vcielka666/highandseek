'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import bs58 from 'bs58'

interface Props {
  walletAddress: string
  userId: string
}

type PhantomProvider = {
  isPhantom: boolean
  publicKey: { toBase58(): string } | null
  connect(): Promise<{ publicKey: { toBase58(): string } }>
  signMessage(msg: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>
  disconnect(): Promise<void>
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider }
    solana?: PhantomProvider
  }
}

function getPhantom(): PhantomProvider | null {
  if (typeof window === 'undefined') return null
  return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null) ?? null
}

export function WalletConnectSection({ walletAddress, userId }: Props) {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState(walletAddress)
  const [phantomAvailable, setPhantomAvailable] = useState(false)

  useEffect(() => {
    setPhantomAvailable(!!getPhantom())
    // If already connected in the session
    const phantom = getPhantom()
    if (phantom?.publicKey) {
      setConnected(true)
      setAddress(phantom.publicKey.toBase58())
    }
  }, [])

  async function handleConnect() {
    const phantom = getPhantom()
    if (!phantom) {
      toast.error('Phantom wallet not found. Install it from phantom.app')
      return
    }

    setConnecting(true)
    try {
      const { publicKey } = await phantom.connect()
      const pubKeyStr = publicKey.toBase58()

      const message = `Connect wallet to High & Seek: ${userId} at ${Date.now()}`
      const msgBytes = new TextEncoder().encode(message)
      const { signature } = await phantom.signMessage(msgBytes, 'utf8')
      const sigB58 = bs58.encode(signature)

      const res = await fetch('/api/hub/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: pubKeyStr, signature: sigB58, message }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save wallet')

      setAddress(pubKeyStr)
      setConnected(true)
      toast.success('Wallet connected!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    const phantom = getPhantom()
    await phantom?.disconnect().catch(() => null)
    setConnected(false)
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px',
    textTransform: 'uppercase', color: '#4a6066',
  }

  return (
    <div style={{ padding: '20px 24px', background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.2)', borderRadius: '8px' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8844cc', marginBottom: '16px' }}>
        Solana Wallet
      </div>

      {address && connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ ...labelStyle, marginBottom: '4px' }}>Wallet address</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef', wordBreak: 'break-all' }}>
              {address}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', border: '0.5px solid rgba(136,68,204,0.3)', borderRadius: '3px', padding: '3px 8px' }}>
              Connected
            </span>
            <button
              onClick={handleDisconnect}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', background: 'none', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '3px', padding: '3px 8px', cursor: 'pointer' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : address && !connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ ...labelStyle, marginBottom: '4px' }}>Saved address</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', wordBreak: 'break-all' }}>{address}</div>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', color: '#050508', background: '#8844cc', border: 'none', borderRadius: '4px', padding: '10px 20px', cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            {connecting ? 'Connecting...' : 'Reconnect'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6 }}>
            Connect your Phantom wallet to pay with SOL.
          </div>
          {!phantomAvailable && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830' }}>
              Phantom not detected.{' '}
              <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" style={{ color: '#8844cc', textDecoration: 'none' }}>
                Install Phantom →
              </a>
            </div>
          )}
          <button
            onClick={handleConnect}
            disabled={connecting || !phantomAvailable}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
              color: '#050508', background: !phantomAvailable ? 'rgba(136,68,204,0.3)' : connecting ? 'rgba(136,68,204,0.6)' : '#8844cc',
              border: 'none', borderRadius: '4px', padding: '10px 20px',
              cursor: !phantomAvailable || connecting ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {connecting ? 'Connecting...' : '👻 Connect Phantom'}
          </button>
        </div>
      )}
    </div>
  )
}
