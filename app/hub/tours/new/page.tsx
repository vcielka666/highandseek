'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const LANGUAGES = ['EN', 'CS', 'SK', 'DE', 'FR', 'ES', 'IT', 'PL', 'HU', 'NL']
const CATEGORIES = ['walking', 'cycling', 'private', 'group', 'event'] as const

export default function NewTourPage() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const [title,            setTitle]            = useState('')
  const [city,             setCity]             = useState('')
  const [country,          setCountry]          = useState('')
  const [shortDesc,        setShortDesc]        = useState('')
  const [description,      setDescription]      = useState('')
  const [duration,         setDuration]         = useState(120)
  const [maxGuests,        setMaxGuests]        = useState(8)
  const [languages,        setLanguages]        = useState<string[]>(['EN'])
  const [category,         setCategory]         = useState<typeof CATEGORIES[number]>('walking')
  const [priceEur,         setPriceEur]         = useState(35)
  const [priceCzk,         setPriceCzk]         = useState(850)
  const [priceCredits,     setPriceCredits]     = useState(500)
  const [meetingAddress,   setMeetingAddress]   = useState('')
  const [meetingDesc,      setMeetingDesc]      = useState('')
  const [included,         setIncluded]         = useState('')
  const [notIncluded,      setNotIncluded]      = useState('')
  const [requirements,     setRequirements]     = useState('')

  const toggleLang = (lang: string) =>
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (languages.length === 0) { toast.error('Select at least one language'); return }

    setPending(true)
    try {
      const res = await fetch('/api/hub/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            title.trim(),
          city:             city.trim(),
          country:          country.trim().toUpperCase(),
          shortDescription: shortDesc.trim(),
          description:      description.trim(),
          duration,
          maxGuests,
          languages,
          category,
          priceEur,
          priceCzk,
          priceCredits,
          meetingAddress:   meetingAddress.trim(),
          meetingDesc:      meetingDesc.trim() || undefined,
          included:         included.split('\n').map(s => s.trim()).filter(Boolean),
          notIncluded:      notIncluded.split('\n').map(s => s.trim()).filter(Boolean),
          requirements:     requirements.split('\n').map(s => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json() as { tour?: { slug: string }; error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Failed to create tour'); return }
      toast.success('Tour created!')
      router.push('/hub/tours')
    } catch {
      toast.error('Network error')
    } finally {
      setPending(false)
    }
  }

  const field = (label: string, child: React.ReactNode) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {child}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef', padding: '40px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <Link href="/hub/tours" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>← My Tours</Link>
          <span style={{ color: '#4a6066' }}>›</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830' }}>New Tour</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '28px' }}>
          Create Tour
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section: Basics */}
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,168,48,0.5)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '0.5px solid rgba(240,168,48,0.12)' }}>
            Basics
          </div>

          {field('Tour title *',
            <input type="text" required placeholder="Praha Cannabis Culture Walk" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
            {field('City *',
              <input type="text" required placeholder="Praha" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
            )}
            {field('Country code *',
              <input type="text" required maxLength={3} placeholder="CZ" value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} />
            )}
          </div>

          {field('Short description * (max 150 chars)',
            <textarea
              rows={2}
              required
              maxLength={150}
              placeholder="One-line pitch shown on tour cards..."
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          )}

          {field('Full description * (min 50 chars)',
            <textarea
              rows={5}
              required
              placeholder="Describe the full experience — what guests will see, do, and feel. Be specific and engaging."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          )}

          {/* Section: Tour details */}
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,168,48,0.5)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '0.5px solid rgba(240,168,48,0.12)', marginTop: '8px' }}>
            Tour Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {field('Duration (minutes) *',
              <input type="number" required min={30} max={480} value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle} />
            )}
            {field('Max guests *',
              <input type="number" required min={1} max={20} value={maxGuests} onChange={e => setMaxGuests(Number(e.target.value))} style={inputStyle} />
            )}
          </div>

          {field('Category *',
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} style={{
                  padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', textTransform: 'capitalize',
                  background: category === cat ? '#f0a830' : 'rgba(240,168,48,0.08)',
                  color: category === cat ? '#050508' : '#4a6066',
                  border: `0.5px solid ${category === cat ? 'transparent' : 'rgba(240,168,48,0.2)'}`,
                  fontWeight: category === cat ? 700 : 400,
                }}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {field('Languages *',
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {LANGUAGES.map(lang => (
                <button key={lang} type="button" onClick={() => toggleLang(lang)} style={{
                  padding: '5px 10px', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                  background: languages.includes(lang) ? '#f0a830' : 'rgba(240,168,48,0.08)',
                  color: languages.includes(lang) ? '#050508' : '#4a6066',
                  border: `0.5px solid ${languages.includes(lang) ? 'transparent' : 'rgba(240,168,48,0.2)'}`,
                  fontWeight: languages.includes(lang) ? 700 : 400,
                }}>
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* Section: Pricing */}
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,168,48,0.5)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '0.5px solid rgba(240,168,48,0.12)', marginTop: '8px' }}>
            Pricing (per person)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {field('Price EUR *',
              <input type="number" required min={0} step={0.5} value={priceEur} onChange={e => setPriceEur(Number(e.target.value))} style={inputStyle} />
            )}
            {field('Price CZK',
              <input type="number" min={0} value={priceCzk} onChange={e => setPriceCzk(Number(e.target.value))} style={inputStyle} />
            )}
            {field('Price Credits',
              <input type="number" min={0} value={priceCredits} onChange={e => setPriceCredits(Number(e.target.value))} style={inputStyle} />
            )}
          </div>

          {/* Section: Meeting point */}
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,168,48,0.5)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '0.5px solid rgba(240,168,48,0.12)', marginTop: '8px' }}>
            Meeting Point
          </div>

          {field('Meeting address *',
            <input type="text" required placeholder="Náměstí Republiky, Praha 1" value={meetingAddress} onChange={e => setMeetingAddress(e.target.value)} style={inputStyle} />
          )}

          {field('Meeting point instructions (optional)',
            <input type="text" placeholder="Look for your guide holding a green H&S flag..." value={meetingDesc} onChange={e => setMeetingDesc(e.target.value)} style={inputStyle} />
          )}

          {/* Section: What's included */}
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(240,168,48,0.5)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '0.5px solid rgba(240,168,48,0.12)', marginTop: '8px' }}>
            Inclusions
          </div>

          {field('What\'s included (one item per line)',
            <textarea
              rows={3}
              placeholder={'Expert local guide\nCBD tea tasting\nH&S culture booklet'}
              value={included}
              onChange={e => setIncluded(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          )}

          {field('Not included (one item per line)',
            <textarea
              rows={2}
              placeholder={'Product purchases\nFood and drinks'}
              value={notIncluded}
              onChange={e => setNotIncluded(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          )}

          {field('Requirements (one item per line)',
            <textarea
              rows={2}
              placeholder={'Must be 18+\nComfortable walking shoes'}
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '13px', borderRadius: '4px', border: 'none', cursor: pending ? 'not-allowed' : 'pointer',
              background: '#f0a830', color: '#050508',
              fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', opacity: pending ? 0.6 : 1, marginTop: '8px',
            }}
          >
            {pending ? 'Creating...' : 'Create Tour →'}
          </button>
        </form>
      </div>
    </div>
  )
}
