'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

const CITIES = ['Praha', 'Brno', 'Amsterdam', 'Barcelona', 'Vienna', 'Berlin', 'Budapest', 'Other']
const LANGUAGES = ['EN', 'CS', 'SK', 'DE', 'FR', 'ES', 'IT', 'PL', 'HU', 'NL', 'PT']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '4px',
  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(240,168,48,0.25)',
  color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', resize: 'vertical' as const,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px',
  color: '#4a6066', textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

export default function GuideApplyPage() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const [bio,        setBio]        = useState('')
  const [experience, setExperience] = useState('')
  const [languages,  setLanguages]  = useState<string[]>(['EN'])
  const [cities,     setCities]     = useState<string[]>([])
  const [customCity, setCustomCity] = useState('')

  const toggleLang = (lang: string) =>
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])

  const toggleCity = (city: string) =>
    setCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])

  const allCities = customCity.trim() ? [...cities.filter(c => c !== 'Other'), customCity.trim()] : cities.filter(c => c !== 'Other')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (languages.length === 0) { toast.error('Select at least one language'); return }
    if (allCities.length === 0) { toast.error('Select at least one city'); return }
    if (bio.trim().length < 50) { toast.error('Bio must be at least 50 characters'); return }
    if (experience.trim().length < 20) { toast.error('Experience description too short'); return }

    setPending(true)
    try {
      const res = await fetch('/api/hub/guides/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.trim(), experience: experience.trim(), languages, cities: allCities }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Failed to submit'); return }
      toast.success('Application submitted! We\'ll review it within 48h.')
      router.push('/hub/tours')
    } catch {
      toast.error('Network error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef', padding: '40px 24px' }}>
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <Link href="/hub" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>Hub</Link>
          <span style={{ color: '#4a6066' }}>›</span>
          <Link href="/hub/tours" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>My Tours</Link>
          <span style={{ color: '#4a6066' }}>›</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830' }}>Apply</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '8px' }}>
          Tour Guide Application
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', marginBottom: '32px', lineHeight: 1.7 }}>
          Tell us about yourself. Our team personally reviews every application — be genuine.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Bio */}
          <div>
            <label style={labelStyle}>Your guide bio * <span style={{ color: '#4a6066', fontWeight: 400 }}>(min 50 chars)</span></label>
            <textarea
              rows={4}
              required
              placeholder="Introduce yourself as a guide — your story, what guests can expect, what makes your tours special..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: bio.length < 50 ? '#cc4444' : '#4a6066', marginTop: '4px' }}>
              {bio.length} / 500
            </div>
          </div>

          {/* Experience */}
          <div>
            <label style={labelStyle}>Cannabis & tourism experience * <span style={{ color: '#4a6066', fontWeight: 400 }}>(min 20 chars)</span></label>
            <textarea
              rows={3}
              required
              placeholder="Describe your experience with cannabis culture, local knowledge, and working with tourists..."
              value={experience}
              onChange={e => setExperience(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Languages */}
          <div>
            <label style={labelStyle}>Languages you guide in *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLang(lang)}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                    background: languages.includes(lang) ? '#f0a830' : 'rgba(240,168,48,0.08)',
                    color: languages.includes(lang) ? '#050508' : '#4a6066',
                    border: `0.5px solid ${languages.includes(lang) ? 'transparent' : 'rgba(240,168,48,0.2)'}`,
                    fontWeight: languages.includes(lang) ? 700 : 400,
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div>
            <label style={labelStyle}>Cities you can guide in *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {CITIES.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleCity(city)}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                    background: cities.includes(city) ? '#f0a830' : 'rgba(240,168,48,0.08)',
                    color: cities.includes(city) ? '#050508' : '#4a6066',
                    border: `0.5px solid ${cities.includes(city) ? 'transparent' : 'rgba(240,168,48,0.2)'}`,
                    fontWeight: cities.includes(city) ? 700 : 400,
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
            {cities.includes('Other') && (
              <input
                type="text"
                placeholder="Enter city name..."
                value={customCity}
                onChange={e => setCustomCity(e.target.value)}
                style={{ ...inputStyle, resize: undefined }}
              />
            )}
          </div>

          {/* Submit */}
          <div style={{
            padding: '16px 18px', borderRadius: '6px',
            background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.15)',
            fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.7,
          }}>
            By applying, you agree to host tours that comply with local laws and H&amp;S community guidelines.
            Platform commission applies to all bookings made through the platform.
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
            {pending ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>
      </div>
    </div>
  )
}
