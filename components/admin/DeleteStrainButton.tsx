'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function DeleteStrainButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/strains/${slug}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Delete failed'); return }
      toast.success(`${name} deleted`)
      router.refresh()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: deleting ? 'not-allowed' : 'pointer',
            color: '#050508', background: '#cc3300', border: 'none',
            padding: '3px 10px', borderRadius: '3px', opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? '…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer',
            color: '#4a6066', background: 'transparent', border: 'none', padding: '3px 6px',
          }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer',
        color: '#4a6066', background: 'transparent', border: 'none', padding: '0',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#cc3300')}
      onMouseLeave={e => (e.currentTarget.style.color = '#4a6066')}
    >
      Delete
    </button>
  )
}
