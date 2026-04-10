'use client'

import { useState, useTransition, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

const MOOD_OPTIONS = [
  { value: 'great', label: '🌟 Great' },
  { value: 'good',  label: '👍 Good' },
  { value: 'okay',  label: '😐 Okay' },
  { value: 'bad',   label: '😔 Bad' },
] as const

export default function NewJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [photo,       setPhoto]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [temperature, setTemperature] = useState('')
  const [humidity,    setHumidity]    = useState('')
  const [ph,          setPh]          = useState('')
  const [ec,          setEc]          = useState('')
  const [waterAmount, setWaterAmount] = useState('')
  const [notes,       setNotes]       = useState('')
  const [mood,        setMood]        = useState<'great' | 'good' | 'okay' | 'bad'>('good')
  const [exifStripped, setExifStripped] = useState(false)
  const [pending, start] = useTransition()

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setPhoto(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(10,36,40,0.8)',
    border: '0.5px solid rgba(74,96,102,0.4)',
    borderRadius: '4px', padding: '8px 12px',
    fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
    color: '#e8f0ef', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
    letterSpacing: '2px', textTransform: 'uppercase',
    color: '#4a6066', display: 'block', marginBottom: '6px',
  }

  async function submit() {
    start(async () => {
      const fd = new FormData()
      if (photo) fd.append('photo', photo)
      if (temperature) fd.append('temperature', temperature)
      if (humidity)    fd.append('humidity', humidity)
      if (ph)          fd.append('ph', ph)
      if (ec)          fd.append('ec', ec)
      if (waterAmount) fd.append('waterAmount', waterAmount)
      if (notes)       fd.append('notes', notes)
      fd.append('mood', mood)

      const res  = await fetch('/api/hub/grow/journal', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { toast.error(data.error ?? 'Failed to save entry'); return }

      if (data.exifStripped) {
        setExifStripped(true)
        toast.success(`🔒 GPS metadata removed from photo · +${data.xpEarned}xp`)
      } else {
        toast.success(`Journal entry saved · +${data.xpEarned}xp`)
      }

      router.push(`/hub/grow/${id}`)
    })
  }

  return (
    <div style={{ maxWidth: '560px', padding: '16px 16px 60px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/hub/grow/${id}`} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textDecoration: 'none' }}>
          ← Back to grow
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: '24px', color: '#e8f0ef', margin: '6px 0 0', letterSpacing: '1px' }}>
          Journal Entry
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Mood */}
        <div>
          <label style={labelStyle}>How is it going?</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
                  padding: '7px 12px', borderRadius: '4px',
                  border: mood === m.value ? '0.5px solid rgba(204,0,170,0.5)' : '0.5px solid rgba(74,96,102,0.3)',
                  background: mood === m.value ? 'rgba(204,0,170,0.12)' : 'transparent',
                  color: mood === m.value ? '#cc00aa' : '#e8f0ef', cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>Photo (optional)</label>
          {photoPreview ? (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px' }} />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null) }} style={{
                position: 'absolute', top: '8px', right: '8px',
                background: 'rgba(5,5,8,0.8)', border: 'none', borderRadius: '50%',
                width: '28px', height: '28px', color: '#e8f0ef', cursor: 'pointer', fontSize: '14px',
              }}>×</button>
            </div>
          ) : (
            <label style={{
              display: 'block', border: '0.5px dashed rgba(74,96,102,0.4)', borderRadius: '6px',
              padding: '24px', textAlign: 'center', cursor: 'pointer',
              background: 'rgba(10,36,40,0.4)',
            }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
                📷 Tap to add photo
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(74,96,102,0.6)', marginTop: '6px' }}>
                GPS / EXIF metadata will be automatically removed
              </div>
            </label>
          )}
        </div>

        {/* Measurements */}
        <div>
          <label style={labelStyle}>Measurements (optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Temperature °C', val: temperature, set: setTemperature, placeholder: '24' },
              { label: 'Humidity %',     val: humidity,    set: setHumidity,    placeholder: '60' },
              { label: 'pH',             val: ph,          set: setPh,          placeholder: '6.5' },
              { label: 'EC mS/cm',       val: ec,          set: setEc,          placeholder: '1.4' },
              { label: 'Water ml',       val: waterAmount, set: setWaterAmount, placeholder: '500' },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label style={{ ...labelStyle, fontSize: '8px' }}>{label}</label>
                <input
                  type="number"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, 500))}
            placeholder="What did you observe today? Any changes?"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', marginTop: '4px', textAlign: 'right' }}>
            {notes.length}/500 {notes.length > 50 ? '· +15xp bonus' : ''}
          </div>
        </div>

        {/* XP preview */}
        <div style={{
          background: 'rgba(240,168,48,0.06)', border: '0.5px solid rgba(240,168,48,0.15)',
          borderRadius: '4px', padding: '10px 14px',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830' }}>
            XP preview: {15 + (photo ? 20 : 0) + (temperature && humidity ? 10 : 0) + (ph ? 10 : 0) + (notes.length > 50 ? 15 : 0)} xp
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={pending}
          style={{
            fontFamily: 'var(--font-cacha)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase',
            color: '#050508', background: pending ? '#4a6066' : '#cc00aa',
            border: 'none', borderRadius: '4px', padding: '14px 24px',
            cursor: pending ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}
        >
          {pending ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  )
}
