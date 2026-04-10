'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'

const CATEGORIES = ['equipment', 'clones', 'seeds', 'nutrients', 'art', 'other'] as const
type Category = typeof CATEGORIES[number]

const EXTRA_IMAGE_COST = 3

interface Props {
  userCredits: number
  COST: number
}

export default function NewListingForm({ userCredits, COST }: Props) {
  const router = useRouter()
  const { t } = useLanguage()
  const m = t.marketplace
  const cr = t.credits

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [category, setCategory]     = useState<Category>('equipment')
  const [price, setPrice]           = useState('')
  const [location, setLocation]     = useState('')
  const [telegram, setTelegram]     = useState('')
  const [signal, setSignal]         = useState('')
  const [threema, setThreema]       = useState('')
  const [imageUrls, setImageUrls]   = useState<string[]>([])
  const [uploading, setUploading]   = useState<boolean[]>([false, false, false])
  const [submitting, setSubmitting] = useState(false)

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const extraImages = Math.max(0, imageUrls.length - 1)
  const extraCost = extraImages * EXTRA_IMAGE_COST
  const totalCost = COST + extraCost
  const canAfford = userCredits >= totalCost
  const descLeft = 500 - description.length

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '4px',
    fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px',
    textTransform: 'uppercase', color: '#4a6066', marginBottom: '6px', display: 'block',
  }

  async function uploadFile(file: File, slot: number) {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB')
      return
    }

    setUploading(prev => { const next = [...prev]; next[slot] = true; return next })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cloudinary/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setImageUrls(prev => {
        const next = [...prev]
        next[slot] = data.url!
        return next
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(prev => { const next = [...prev]; next[slot] = false; return next })
    }
  }

  function removeImage(slot: number) {
    setImageUrls(prev => prev.filter((_, i) => i !== slot))
    if (fileRefs[slot]?.current) fileRefs[slot].current!.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!telegram && !signal && !threema) {
      toast.error(m.contactSection)
      return
    }
    if (!canAfford) {
      toast.error(m.insufficientCredits)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/hub/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          price: parseFloat(price) || 0,
          location: location.trim() || undefined,
          contact: {
            telegram: telegram.trim() || undefined,
            signal:   signal.trim() || undefined,
            threema:  threema.trim() || undefined,
          },
          images: imageUrls.filter(u => u !== ''),
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? m.errorToast)
      toast.success(COST === 0 && extraCost === 0 ? m.successToastFree : m.successToast)
      router.push('/hub/marketplace')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.errorToast)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Title */}
      <div>
        <label style={labelStyle}>{m.titleLabel}</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder={m.titlePlaceholder}
          maxLength={80} required
          style={inputStyle}
        />
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>{m.categoryLabel}</label>
        <select
          value={category} onChange={e => setCategory(e.target.value as Category)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {CATEGORIES.map(c => {
            const key = `cat${c.charAt(0).toUpperCase() + c.slice(1)}` as keyof typeof m
            return (
              <option key={c} value={c} style={{ background: '#0d0d10' }}>
                {(m as Record<string, string>)[key as string]}
              </option>
            )
          })}
        </select>
      </div>

      {/* Description */}
      <div>
        <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>{m.descLabel}</span>
          <span style={{ color: descLeft < 50 ? '#f0a830' : '#2a3a3e' }}>{descLeft} {m.descCounter}</span>
        </label>
        <textarea
          value={description} onChange={e => setDesc(e.target.value)}
          placeholder={m.descPlaceholder}
          maxLength={500} required rows={4}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
        />
      </div>

      {/* Price + Location */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>{m.priceLabel}</label>
          <input
            type="number" min="0" step="0.01"
            value={price} onChange={e => setPrice(e.target.value)}
            placeholder={m.pricePlaceholder}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{m.locationLabel}</label>
          <input
            value={location} onChange={e => setLocation(e.target.value)}
            placeholder={m.locationPlaceholder}
            maxLength={80}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Contact */}
      <div style={{ padding: '16px', background: 'rgba(204,0,170,0.04)', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#cc00aa' }}>
          {m.contactSection}
        </div>
        <div>
          <label style={labelStyle}>{m.telegramLabel}</label>
          <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder={m.telegramPlaceholder} maxLength={80} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{m.signalLabel}</label>
          <input value={signal} onChange={e => setSignal(e.target.value)} placeholder={m.signalPlaceholder} maxLength={40} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{m.threemaLabel}</label>
          <input value={threema} onChange={e => setThreema(e.target.value)} placeholder={m.threemaPlaceholder} maxLength={40} style={inputStyle} />
        </div>
      </div>

      {/* Images — file upload */}
      <div>
        <label style={labelStyle}>Images (max 3)</label>

        {/* Cost breakdown */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginBottom: '12px', lineHeight: 1.8 }}>
          {COST > 0 && <div>Base listing: {COST} credits (included)</div>}
          <div style={{ color: extraImages >= 1 ? '#f0a830' : '#4a6066' }}>+1 extra image: +{EXTRA_IMAGE_COST} credits</div>
          <div style={{ color: extraImages >= 2 ? '#f0a830' : '#4a6066' }}>+2 extra images: +{EXTRA_IMAGE_COST * 2} credits</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map(slot => (
            <div key={slot} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {imageUrls[slot] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrls[slot]}
                    alt={`Image ${slot + 1}`}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '0.5px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageUrls[slot].split('/').pop()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(slot)}
                    style={{ background: 'none', border: '0.5px solid rgba(204,0,0,0.3)', borderRadius: '4px', color: '#cc4444', cursor: 'pointer', padding: '4px 8px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <input
                    ref={fileRefs[slot]}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file, slot)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs[slot]?.current?.click()}
                    disabled={uploading[slot] || (slot > 0 && !imageUrls[slot - 1])}
                    style={{
                      flex: 1, padding: '12px', background: 'rgba(255,255,255,0.02)',
                      border: '0.5px dashed rgba(255,255,255,0.12)', borderRadius: '4px',
                      fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
                      cursor: uploading[slot] || (slot > 0 && !imageUrls[slot - 1]) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      opacity: slot > 0 && !imageUrls[slot - 1] ? 0.4 : 1,
                    }}
                  >
                    {uploading[slot] ? 'Uploading...' : slot === 0 ? '+ Add image (free)' : `+ Add image ${slot + 1} (+${EXTRA_IMAGE_COST} credits)`}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credits warning */}
      {(COST > 0 || extraCost > 0) && (
        <div style={{
          padding: '14px 18px',
          background: canAfford ? 'rgba(240,168,48,0.05)' : 'rgba(204,0,0,0.06)',
          border: `0.5px solid ${canAfford ? 'rgba(240,168,48,0.25)' : 'rgba(204,0,0,0.3)'}`,
          borderRadius: '6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: canAfford ? '#f0a830' : '#cc4444' }}>
              {canAfford ? `Total cost: ${totalCost} credits` : m.insufficientCredits}
            </span>
            {extraCost > 0 && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '3px' }}>
                Base {COST} + {extraImages} extra image{extraImages > 1 ? 's' : ''} ×{EXTRA_IMAGE_COST} = {totalCost}
              </div>
            )}
          </div>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: canAfford ? '#f0a830' : '#cc4444' }}>
            {m.yourBalance}: {userCredits}
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !canAfford}
        style={{
          fontFamily: 'var(--font-cacha)', fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase',
          color: '#050508', background: submitting || !canAfford ? 'rgba(240,168,48,0.4)' : '#f0a830',
          border: 'none', borderRadius: '4px', padding: '14px 32px',
          cursor: submitting || !canAfford ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s', width: '100%',
        }}
        className={submitting || !canAfford ? '' : 'hover:opacity-90'}
      >
        {submitting ? '...' : m.submit}
      </button>
    </form>
  )
}
