'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '4px',
  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(240,168,48,0.25)',
  color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px',
  color: '#4a6066', textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

interface TourData {
  title: string
  shortDescription: string
  description: string
  duration: number
  maxGuests: number
  price?: { eur?: number; czk?: number; credits?: number }
  meetingPoint?: { address?: string }
  included: string[]
  notIncluded: string[]
  requirements: string[]
  isComingSoon: boolean
}

export default function EditTourPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [loading, setLoading]   = useState(true)
  const [pending, setPending]   = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [title,        setTitle]        = useState('')
  const [shortDesc,    setShortDesc]    = useState('')
  const [description,  setDescription]  = useState('')
  const [duration,     setDuration]     = useState(120)
  const [maxGuests,    setMaxGuests]    = useState(8)
  const [priceEur,     setPriceEur]     = useState(0)
  const [priceCzk,     setPriceCzk]     = useState(0)
  const [priceCredits, setPriceCredits] = useState(0)
  const [meetingAddr,  setMeetingAddr]  = useState('')
  const [included,     setIncluded]     = useState('')
  const [notIncluded,  setNotIncluded]  = useState('')
  const [requirements, setRequirements] = useState('')
  const [isComingSoon, setIsComingSoon] = useState(false)

  useEffect(() => {
    fetch(`/api/tours/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { tour: TourData }) => {
        const t = d.tour
        setTitle(t.title)
        setShortDesc(t.shortDescription)
        setDescription(t.description)
        setDuration(t.duration)
        setMaxGuests(t.maxGuests)
        setPriceEur(t.price?.eur ?? 0)
        setPriceCzk(t.price?.czk ?? 0)
        setPriceCredits(t.price?.credits ?? 0)
        setMeetingAddr(t.meetingPoint?.address ?? '')
        setIncluded((t.included ?? []).join('\n'))
        setNotIncluded((t.notIncluded ?? []).join('\n'))
        setRequirements((t.requirements ?? []).join('\n'))
        setIsComingSoon(t.isComingSoon)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const res = await fetch(`/api/hub/tours/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          shortDescription: shortDesc.trim(),
          description: description.trim(),
          duration,
          maxGuests,
          priceEur,
          priceCzk,
          priceCredits,
          meetingAddress: meetingAddr.trim(),
          included: included.split('\n').map(s => s.trim()).filter(Boolean),
          notIncluded: notIncluded.split('\n').map(s => s.trim()).filter(Boolean),
          requirements: requirements.split('\n').map(s => s.trim()).filter(Boolean),
          isComingSoon,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Failed to update'); return }
      toast.success('Tour updated!')
      router.push('/hub/tours')
    } catch {
      toast.error('Network error')
    } finally {
      setPending(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>Loading...</span>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', color: '#cc4444' }}>Tour not found or access denied</span>
      <Link href="/hub/tours" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', textDecoration: 'none' }}>← Back to My Tours</Link>
    </div>
  )

  const field = (label: string, child: React.ReactNode) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {child}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef', padding: '40px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <Link href="/hub/tours" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>← My Tours</Link>
          <span style={{ color: '#4a6066' }}>›</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830' }}>Edit Tour</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '28px' }}>
          Edit: {title}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {field('Title *', <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />)}

          {field('Short description *',
            <textarea rows={2} required maxLength={150} value={shortDesc} onChange={e => setShortDesc(e.target.value)} style={{ ...inputStyle, resize: 'vertical' as const }} />
          )}

          {field('Full description *',
            <textarea rows={5} required value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, resize: 'vertical' as const }} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {field('Duration (min)', <input type="number" required min={30} max={480} value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle} />)}
            {field('Max guests', <input type="number" required min={1} max={20} value={maxGuests} onChange={e => setMaxGuests(Number(e.target.value))} style={inputStyle} />)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {field('EUR / person', <input type="number" min={0} step={0.5} value={priceEur} onChange={e => setPriceEur(Number(e.target.value))} style={inputStyle} />)}
            {field('CZK / person', <input type="number" min={0} value={priceCzk} onChange={e => setPriceCzk(Number(e.target.value))} style={inputStyle} />)}
            {field('Credits / person', <input type="number" min={0} value={priceCredits} onChange={e => setPriceCredits(Number(e.target.value))} style={inputStyle} />)}
          </div>

          {field('Meeting address', <input type="text" value={meetingAddr} onChange={e => setMeetingAddr(e.target.value)} style={inputStyle} />)}

          {field('Included (one per line)',
            <textarea rows={3} value={included} onChange={e => setIncluded(e.target.value)} style={{ ...inputStyle, resize: 'vertical' as const }} />
          )}
          {field('Not included (one per line)',
            <textarea rows={2} value={notIncluded} onChange={e => setNotIncluded(e.target.value)} style={{ ...inputStyle, resize: 'vertical' as const }} />
          )}
          {field('Requirements (one per line)',
            <textarea rows={2} value={requirements} onChange={e => setRequirements(e.target.value)} style={{ ...inputStyle, resize: 'vertical' as const }} />
          )}

          {/* Visibility toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: '6px',
            background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.15)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#e8f0ef', marginBottom: '3px' }}>
                Mark as Coming Soon
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066' }}>
                Hides booking form, shows &quot;Coming Soon&quot; overlay
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsComingSoon(v => !v)}
              style={{
                padding: '6px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', fontWeight: 700,
                background: isComingSoon ? 'rgba(240,168,48,0.2)' : 'rgba(74,96,102,0.2)',
                color: isComingSoon ? '#f0a830' : '#4a6066',
              }}
            >
              {isComingSoon ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '13px', borderRadius: '4px', border: 'none', cursor: pending ? 'not-allowed' : 'pointer',
              background: '#f0a830', color: '#050508',
              fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? 'Saving...' : 'Save Changes →'}
          </button>
        </form>
      </div>
    </div>
  )
}
