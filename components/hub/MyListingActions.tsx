'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/stores/languageStore'
import type { ListingStatus } from '@/lib/db/models/Listing'

interface Listing {
  _id: string
  title: string
  description: string
  category: string
  price: number
  location?: string
  status: ListingStatus
  expiresAt: string
  createdAt: string
}

interface Props {
  initialListings: Listing[]
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  active:  '#00d4c8',
  sold:    '#f0a830',
  expired: '#4a6066',
  removed: '#cc0000',
}

export default function MyListingActions({ initialListings }: Props) {
  const { t } = useLanguage()
  const m = t.marketplace
  const [listings, setListings] = useState(initialListings)
  const [loading, setLoading] = useState<string | null>(null)

  async function patch(id: string, action: string) {
    setLoading(`${id}-${action}`)
    try {
      const res = await fetch(`/api/hub/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      if (action === 'mark_sold') {
        setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'sold' } : l))
      } else if (action === 'mark_active') {
        setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'active' } : l))
      } else if (action === 'extend') {
        toast.success(m.extendSuccess)
        setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'active', expiresAt: data.expiresAt } : l))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(null)
    }
  }

  async function remove(id: string) {
    if (!confirm(m.deleteConfirm)) return
    setLoading(`${id}-delete`)
    try {
      const res = await fetch(`/api/hub/marketplace/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setListings(prev => prev.filter(l => l._id !== id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setLoading(null)
    }
  }

  const btnStyle = (color: string, bg = 'transparent'): React.CSSProperties => ({
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
    textTransform: 'uppercase', padding: '5px 10px', borderRadius: '3px',
    border: `0.5px solid ${color}66`, color, background: bg,
    cursor: 'pointer', transition: 'all 0.15s',
  })

  if (listings.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>
        {m.noMyListings}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {listings.map(l => {
        const daysLeft = Math.max(0, Math.ceil((new Date(l.expiresAt).getTime() - Date.now()) / 86_400_000))
        const isLoading = (action: string) => loading === `${l._id}-${action}`

        return (
          <div key={l._id} style={{
            padding: '14px 16px', background: '#0d0d10',
            border: `0.5px solid ${l.status === 'active' ? 'rgba(0,212,200,0.15)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef', marginBottom: '3px' }}>
                  {l.title}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  {l.price === 0 ? m.free : `€${l.price}`}
                  {l.location ? ` · 📍 ${l.location}` : ''}
                  {l.status === 'active' ? ` · ${m.expiresIn} ${daysLeft} ${m.days}` : ''}
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase',
                color: STATUS_COLORS[l.status], border: `0.5px solid ${STATUS_COLORS[l.status]}44`,
                padding: '3px 8px', borderRadius: '3px', flexShrink: 0,
              }}>
                {(m as Record<string, string>)[`status${l.status.charAt(0).toUpperCase() + l.status.slice(1)}`]}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {l.status === 'active' && (
                <button
                  onClick={() => patch(l._id, 'mark_sold')}
                  disabled={!!loading}
                  style={btnStyle('#f0a830')}
                >
                  {isLoading('mark_sold') ? '...' : m.markSold}
                </button>
              )}
              {(l.status === 'sold' || l.status === 'expired') && (
                <button
                  onClick={() => patch(l._id, 'mark_active')}
                  disabled={!!loading}
                  style={btnStyle('#00d4c8')}
                >
                  {isLoading('mark_active') ? '...' : m.markActive}
                </button>
              )}
              {(l.status === 'active' || l.status === 'expired') && (
                <button
                  onClick={() => patch(l._id, 'extend')}
                  disabled={!!loading}
                  style={btnStyle('#cc00aa')}
                >
                  {isLoading('extend') ? '...' : m.extend}
                </button>
              )}
              {l.status !== 'removed' && (
                <button
                  onClick={() => remove(l._id)}
                  disabled={!!loading}
                  style={btnStyle('#4a6066')}
                >
                  {isLoading('delete') ? '...' : m.delete}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
