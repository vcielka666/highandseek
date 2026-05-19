'use client'

import { useState, useCallback } from 'react'
import { useRouter }  from 'next/navigation'
import { toast }      from 'sonner'
import { Input }      from '@/components/ui/input'
import { Button }     from '@/components/ui/button'
import { Textarea }   from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, X, Trash2, GripVertical } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TourStop {
  order:       number
  title:       string
  description: string
  type:        'club' | 'shop' | 'viewpoint' | 'cafe' | 'culture' | 'other'
  duration:    number
  lat:         number
  lng:         number
}

export interface TourFormData {
  title:            string
  slug:             string
  city:             string
  country:          string
  duration:         number
  maxGuests:        number
  languages:        string[]
  priceEur:         number
  priceCzk:         number
  priceCredits:     number
  shortDescription: string
  description:      string
  category:         'walking' | 'cycling' | 'private' | 'group' | 'event'
  included:         string[]
  notIncluded:      string[]
  requirements:     string[]
  stops:            TourStop[]
  meetingPointAddress:     string
  meetingPointLat:         number
  meetingPointLng:         number
  meetingPointDescription: string
  hostName:     string
  hostBio:      string
  hostVerified: boolean
  isActive:     boolean
  isFeatured:   boolean
  isComingSoon: boolean
  coverImage:   string
}

interface Props {
  mode:         'new' | 'edit'
  initialData?: TourFormData
  slug?:        string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ['EN', 'CS', 'SK', 'DE', 'ES', 'FR']
const CATEGORIES: TourFormData['category'][] = ['walking', 'cycling', 'private', 'group', 'event']
const STOP_TYPES: TourStop['type'][] = ['club', 'shop', 'viewpoint', 'cafe', 'culture', 'other']

const DEFAULT_FORM: TourFormData = {
  title:            '',
  slug:             '',
  city:             '',
  country:          'CZ',
  duration:         120,
  maxGuests:        8,
  languages:        ['EN'],
  priceEur:         0,
  priceCzk:         0,
  priceCredits:     0,
  shortDescription: '',
  description:      '',
  category:         'walking',
  included:         [],
  notIncluded:      [],
  requirements:     [],
  stops:            [],
  meetingPointAddress:     '',
  meetingPointLat:         0,
  meetingPointLng:         0,
  meetingPointDescription: '',
  hostName:     '',
  hostBio:      '',
  hostVerified: false,
  isActive:     false,
  isFeatured:   false,
  isComingSoon: true,
  coverImage:   '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-3 pt-5 border-t"
      style={{
        color:       '#f0a830',
        fontFamily:  'var(--font-dm-mono)',
        borderColor: 'rgba(240,168,48,0.1)',
      }}
    >
      {children}
    </p>
  )
}

function FormInput({
  label, value, onChange, type = 'text', placeholder, max, min,
}: {
  label:        string
  value:        string | number
  onChange:     (v: string) => void
  type?:        string
  placeholder?: string
  max?:         number
  min?:         number
}) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        max={max}
        min={min}
        className="text-sm h-9"
        style={{
          background: '#0a0d10',
          border:     '0.5px solid rgba(240,168,48,0.15)',
          color:      '#e8f0ef',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />
    </div>
  )
}

function TagInput({
  label, items, onChange,
}: {
  label:    string
  items:    string[]
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const trimmed = draft.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setDraft('')
  }

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type and press Enter…"
          className="text-sm h-8 flex-1"
          style={{
            background: '#0a0d10',
            border:     '0.5px solid rgba(240,168,48,0.15)',
            color:      '#e8f0ef',
            fontFamily: 'var(--font-dm-sans)',
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          className="h-8"
          style={{
            background: 'rgba(240,168,48,0.1)',
            color:      '#f0a830',
            border:     '0.5px solid rgba(240,168,48,0.2)',
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
              style={{
                background: 'rgba(136,68,204,0.1)',
                color:      '#8844cc',
                border:     '0.5px solid rgba(136,68,204,0.2)',
                fontFamily: 'var(--font-dm-mono)',
              }}
            >
              {item}
              <button type="button" onClick={() => remove(i)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({
  label, checked, onChange,
}: {
  label:    string
  checked:  boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className="flex items-center gap-3 cursor-pointer"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{
          background: checked ? 'rgba(240,168,48,0.4)' : 'rgba(255,255,255,0.08)',
          border:     `0.5px solid ${checked ? 'rgba(240,168,48,0.5)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: checked ? '#f0a830' : '#4a6066',
            transform:  checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </button>
      <span className="text-sm" style={{ color: '#e8f0ef' }}>{label}</span>
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TourFormClient({ mode, initialData, slug }: Props) {
  const router = useRouter()
  const [form,     setForm]     = useState<TourFormData>(initialData ?? DEFAULT_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = useCallback(<K extends keyof TourFormData>(key: K, value: TourFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Auto-slug from title (new mode only)
  const handleTitleChange = (val: string) => {
    set('title', val)
    if (mode === 'new') {
      set('slug', slugify(val))
    }
  }

  // Language toggles
  const toggleLang = (lang: string) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...form.languages, lang]
    set('languages', langs)
  }

  // Stops
  const addStop = () => {
    const order = form.stops.length + 1
    set('stops', [
      ...form.stops,
      { order, title: '', description: '', type: 'other', duration: 15, lat: 0, lng: 0 },
    ])
  }

  const updateStop = (idx: number, patch: Partial<TourStop>) => {
    set('stops', form.stops.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const removeStop = (idx: number) => {
    set('stops', form.stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.city.trim() || !form.slug.trim()) {
      toast.error('Title, city, and slug are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title:            form.title,
        slug:             form.slug,
        city:             form.city,
        country:          form.country,
        duration:         Number(form.duration),
        maxGuests:        Number(form.maxGuests),
        languages:        form.languages,
        price:            { eur: Number(form.priceEur), czk: Number(form.priceCzk), credits: Number(form.priceCredits) },
        shortDescription: form.shortDescription,
        description:      form.description,
        category:         form.category,
        included:         form.included,
        notIncluded:      form.notIncluded,
        requirements:     form.requirements,
        stops:            form.stops,
        meetingPoint: {
          address:     form.meetingPointAddress,
          lat:         Number(form.meetingPointLat),
          lng:         Number(form.meetingPointLng),
          description: form.meetingPointDescription,
        },
        host: {
          name:     form.hostName,
          bio:      form.hostBio,
          verified: form.hostVerified,
        },
        isActive:     form.isActive,
        isFeatured:   form.isFeatured,
        isComingSoon: form.isComingSoon,
        coverImage:   form.coverImage,
      }

      const res = await fetch(
        mode === 'new' ? '/api/admin/tours' : `/api/admin/tours/${slug}`,
        {
          method:  mode === 'new' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error((err as { error?: string }).error ?? 'Failed to save')
      }

      toast.success(mode === 'new' ? 'Tour created!' : 'Tour saved!')
      router.push('/admin/tours')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tour')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tours/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Tour deleted')
      router.push('/admin/tours')
    } catch {
      toast.error('Failed to delete tour')
    } finally {
      setDeleting(false)
    }
  }

  const inputStyle = {
    background: '#0a0d10',
    border:     '0.5px solid rgba(240,168,48,0.15)',
    color:      '#e8f0ef',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-2">

      {/* ── 1. Basic Info ──────────────────────────────────────── */}
      <SectionHeader>Basic Info</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormInput
          label="Title *"
          value={form.title}
          onChange={handleTitleChange}
          placeholder="Prague Cannabis Walk"
        />
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            Slug *
          </label>
          <Input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="prague-cannabis-walk"
            className="text-sm h-9"
            style={inputStyle}
          />
          <p className="text-xs mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            /tours/{form.slug || '…'}
          </p>
        </div>
        <FormInput label="City *"    value={form.city}    onChange={(v) => set('city', v)}    placeholder="Prague" />
        <FormInput label="Country *" value={form.country} onChange={(v) => set('country', v)} placeholder="CZ" />
        <FormInput label="Duration (min)" value={form.duration}   onChange={(v) => set('duration', Number(v))}   type="number" min={0} />
        <FormInput label="Max Guests"     value={form.maxGuests}  onChange={(v) => set('maxGuests', Number(v))}  type="number" min={1} />
      </div>

      {/* ── 2. Languages ──────────────────────────────────────── */}
      <SectionHeader>Languages</SectionHeader>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => {
          const active = form.languages.includes(lang)
          return (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLang(lang)}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                background: active ? 'rgba(240,168,48,0.15)' : 'rgba(255,255,255,0.04)',
                color:      active ? '#f0a830'               : '#4a6066',
                border:     `0.5px solid ${active ? 'rgba(240,168,48,0.3)' : 'rgba(255,255,255,0.08)'}`,
                fontFamily: 'var(--font-dm-mono)',
              }}
            >
              {lang}
            </button>
          )
        })}
      </div>

      {/* ── 3. Pricing ────────────────────────────────────────── */}
      <SectionHeader>Pricing</SectionHeader>
      <div className="grid grid-cols-3 gap-3">
        <FormInput label="Price EUR" value={form.priceEur}     onChange={(v) => set('priceEur',     Number(v))} type="number" min={0} />
        <FormInput label="Price CZK" value={form.priceCzk}     onChange={(v) => set('priceCzk',     Number(v))} type="number" min={0} />
        <FormInput label="Credits"   value={form.priceCredits} onChange={(v) => set('priceCredits', Number(v))} type="number" min={0} />
      </div>

      {/* ── 4. Short Description ──────────────────────────────── */}
      <SectionHeader>Short Description</SectionHeader>
      <div>
        <Textarea
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value.slice(0, 150))}
          placeholder="One-liner for cards and listings…"
          rows={2}
          className="text-sm resize-none"
          style={inputStyle}
        />
        <p className="text-xs mt-0.5 text-right" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
          {form.shortDescription.length}/150
        </p>
      </div>

      {/* ── 5. Full Description ───────────────────────────────── */}
      <SectionHeader>Full Description</SectionHeader>
      <div>
        <Textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value.slice(0, 2000))}
          placeholder="Detailed tour description…"
          rows={6}
          className="text-sm resize-none"
          style={inputStyle}
        />
        <p className="text-xs mt-0.5 text-right" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
          {form.description.length}/2000
        </p>
      </div>

      {/* ── 6. Category ───────────────────────────────────────── */}
      <SectionHeader>Category</SectionHeader>
      <Select value={form.category} onValueChange={(v) => set('category', v as TourFormData['category'])}>
        <SelectTrigger
          className="w-48 text-sm h-9"
          style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)' }}>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── 7. Included ───────────────────────────────────────── */}
      <SectionHeader>Included</SectionHeader>
      <TagInput label="Items included in the tour" items={form.included} onChange={(v) => set('included', v)} />

      {/* ── 8. Not Included ───────────────────────────────────── */}
      <SectionHeader>Not Included</SectionHeader>
      <TagInput label="Items not included" items={form.notIncluded} onChange={(v) => set('notIncluded', v)} />

      {/* ── 9. Requirements ───────────────────────────────────── */}
      <SectionHeader>Requirements</SectionHeader>
      <TagInput label="Guest requirements" items={form.requirements} onChange={(v) => set('requirements', v)} />

      {/* ── 10. Stops Builder ─────────────────────────────────── */}
      <SectionHeader>Stops</SectionHeader>
      <div className="space-y-3">
        {form.stops.map((stop, idx) => (
          <div
            key={idx}
            className="rounded p-3 space-y-2"
            style={{ background: 'rgba(136,68,204,0.05)', border: '0.5px solid rgba(136,68,204,0.15)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <GripVertical size={14} style={{ color: '#4a6066' }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: '#8844cc', fontFamily: 'var(--font-dm-mono)' }}
                >
                  Stop {stop.order}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeStop(idx)}
                className="text-xs"
                style={{ color: '#4a6066' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Title</label>
                <Input
                  value={stop.title}
                  onChange={(e) => updateStop(idx, { title: e.target.value })}
                  className="text-sm h-8"
                  style={inputStyle}
                  placeholder="Stop name"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Type</label>
                <Select
                  value={stop.type}
                  onValueChange={(v) => updateStop(idx, { type: v as TourStop['type'] })}
                >
                  <SelectTrigger className="text-sm h-8" style={{ ...inputStyle }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)' }}>
                    {STOP_TYPES.map((t) => (
                      <SelectItem key={t} value={t} style={{ color: '#e8f0ef' }}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                Description <span style={{ color: '#4a6066' }}>({stop.description.length}/300)</span>
              </label>
              <Textarea
                value={stop.description}
                onChange={(e) => updateStop(idx, { description: e.target.value.slice(0, 300) })}
                rows={2}
                className="text-sm resize-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Duration (min)</label>
                <Input
                  type="number"
                  value={stop.duration}
                  onChange={(e) => updateStop(idx, { duration: Number(e.target.value) })}
                  className="text-sm h-8"
                  style={inputStyle}
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Lat</label>
                <Input
                  type="number"
                  value={stop.lat}
                  onChange={(e) => updateStop(idx, { lat: Number(e.target.value) })}
                  className="text-sm h-8"
                  style={inputStyle}
                  step="any"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Lng</label>
                <Input
                  type="number"
                  value={stop.lng}
                  onChange={(e) => updateStop(idx, { lng: Number(e.target.value) })}
                  className="text-sm h-8"
                  style={inputStyle}
                  step="any"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={addStop}
          size="sm"
          style={{
            background: 'rgba(136,68,204,0.1)',
            color:      '#8844cc',
            border:     '0.5px solid rgba(136,68,204,0.2)',
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          <PlusCircle size={13} className="mr-1" /> Add Stop
        </Button>
      </div>

      {/* ── 11. Meeting Point ─────────────────────────────────── */}
      <SectionHeader>Meeting Point</SectionHeader>
      <div className="space-y-2">
        <FormInput label="Address"     value={form.meetingPointAddress}     onChange={(v) => set('meetingPointAddress', v)}     placeholder="Wenceslas Square 1, Prague" />
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Lat" value={form.meetingPointLat} onChange={(v) => set('meetingPointLat', Number(v))} type="number" />
          <FormInput label="Lng" value={form.meetingPointLng} onChange={(v) => set('meetingPointLng', Number(v))} type="number" />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            Meeting Point Note
          </label>
          <Textarea
            value={form.meetingPointDescription}
            onChange={(e) => set('meetingPointDescription', e.target.value)}
            rows={2}
            className="text-sm resize-none"
            style={inputStyle}
            placeholder="Look for the guide with a green flag…"
          />
        </div>
      </div>

      {/* ── 12. Host Info ─────────────────────────────────────── */}
      <SectionHeader>Host Info</SectionHeader>
      <div className="space-y-2">
        <FormInput label="Host Name" value={form.hostName} onChange={(v) => set('hostName', v)} placeholder="Jan Novák" />
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            Host Bio ({form.hostBio.length}/300)
          </label>
          <Textarea
            value={form.hostBio}
            onChange={(e) => set('hostBio', e.target.value.slice(0, 300))}
            rows={3}
            className="text-sm resize-none"
            style={inputStyle}
            placeholder="Local guide with 5 years of experience…"
          />
        </div>
        <Toggle label="Host Verified" checked={form.hostVerified} onChange={(v) => set('hostVerified', v)} />
      </div>

      {/* ── 13. Status Toggles ────────────────────────────────── */}
      <SectionHeader>Status</SectionHeader>
      <div className="space-y-3">
        <Toggle label="Active (visible to public)"  checked={form.isActive}     onChange={(v) => set('isActive', v)} />
        <Toggle label="Featured (shown prominently)" checked={form.isFeatured}   onChange={(v) => set('isFeatured', v)} />
        <Toggle label="Coming Soon (teaser mode)"    checked={form.isComingSoon} onChange={(v) => set('isComingSoon', v)} />
      </div>

      {/* ── 14. Cover Image ───────────────────────────────────── */}
      <SectionHeader>Cover Image</SectionHeader>
      <FormInput
        label="Cloudinary URL"
        value={form.coverImage}
        onChange={(v) => set('coverImage', v)}
        placeholder="https://res.cloudinary.com/…"
      />

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-6 pb-2 border-t" style={{ borderColor: 'rgba(240,168,48,0.1)' }}>
        <Button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? 'rgba(240,168,48,0.08)' : 'rgba(240,168,48,0.15)',
            color:      '#f0a830',
            border:     '0.5px solid rgba(240,168,48,0.3)',
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          {saving ? 'Saving…' : mode === 'new' ? 'Create Tour' : 'Save Changes'}
        </Button>

        {mode === 'edit' && (
          <Button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            style={{
              background: 'rgba(255,50,50,0.08)',
              color:      '#ff5050',
              border:     '0.5px solid rgba(255,50,50,0.2)',
              fontFamily: 'var(--font-dm-mono)',
            }}
          >
            <Trash2 size={13} className="mr-1" />
            {deleting ? 'Deleting…' : 'Delete Tour'}
          </Button>
        )}
      </div>
    </form>
  )
}
