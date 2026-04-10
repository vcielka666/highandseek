'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  listingId: string
  locale: string
  isFeatured: boolean
  boostedSlotsFull: boolean
}

export default function ListingOwnerActions({ listingId, locale, isFeatured, boostedSlotsFull }: Props) {
  const router = useRouter()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loading, setLoading] = useState<'delete' | 'boost' | null>(null)

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      setTimeout(() => setConfirmingDelete(false), 4000)
      return
    }
    setLoading('delete')
    try {
      const res = await fetch(`/api/hub/marketplace/${listingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(locale === 'cs' ? 'Inzerát odstraněn' : 'Listing removed')
      router.refresh()
    } catch {
      toast.error(locale === 'cs' ? 'Chyba při mazání' : 'Failed to remove listing')
    } finally {
      setLoading(null)
      setConfirmingDelete(false)
    }
  }

  async function handleBoost() {
    setLoading('boost')
    try {
      const res = await fetch(`/api/hub/marketplace/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'boost' }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(locale === 'cs' ? 'Všechny 3 sloty jsou obsazeny' : 'All 3 featured slots are taken')
        } else if (res.status === 402) {
          toast.error(locale === 'cs' ? 'Nedostatek kreditů' : 'Not enough credits')
        } else {
          toast.error(data.error ?? 'Error')
        }
        return
      }
      toast.success(locale === 'cs' ? '⚡ Inzerát zvýrazněn na 3 dny! −5 kreditů' : '⚡ Listing featured for 3 days! −5 credits')
      router.refresh()
    } catch {
      toast.error(locale === 'cs' ? 'Chyba' : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)',
    fontSize: '9px',
    letterSpacing: '0.5px',
    padding: '4px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {/* Boost button — only show if not already featured */}
      {!isFeatured && (
        <button
          type="button"
          onClick={handleBoost}
          disabled={loading !== null || boostedSlotsFull}
          title={boostedSlotsFull
            ? (locale === 'cs' ? 'Všechny sloty obsazeny' : 'All slots taken')
            : (locale === 'cs' ? 'Zvýrazni na 3 dny za 5 kreditů' : 'Feature for 3 days — 5 credits')}
          style={{
            ...btnBase,
            border: '0.5px solid rgba(240,168,48,0.35)',
            background: boostedSlotsFull ? 'transparent' : 'rgba(240,168,48,0.08)',
            color: boostedSlotsFull ? '#2a3a3e' : '#f0a830',
            opacity: loading === 'boost' ? 0.5 : 1,
          }}
        >
          {loading === 'boost' ? '...' : '⚡'}
        </button>
      )}

      {/* Already featured indicator */}
      {isFeatured && (
        <span style={{ ...btnBase, border: '0.5px solid rgba(240,168,48,0.3)', background: 'rgba(240,168,48,0.08)', color: '#f0a830', cursor: 'default' }}>
          ⚡ {locale === 'cs' ? 'Aktivní' : 'Active'}
        </span>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        style={{
          ...btnBase,
          border: `0.5px solid ${confirmingDelete ? 'rgba(204,0,170,0.6)' : 'rgba(204,0,170,0.25)'}`,
          background: confirmingDelete ? 'rgba(204,0,170,0.15)' : 'transparent',
          color: confirmingDelete ? '#cc00aa' : '#4a6066',
          opacity: loading === 'delete' ? 0.5 : 1,
        }}
      >
        {loading === 'delete'
          ? '...'
          : confirmingDelete
            ? (locale === 'cs' ? '✕ Potvrdit' : '✕ Confirm')
            : (locale === 'cs' ? 'Smazat' : 'Delete')}
      </button>
    </div>
  )
}
