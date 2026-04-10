'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

interface StrainOption { slug: string; name: string }
interface EarnedBadge  { id: string; name: string; icon: string }

interface FormState {
  username:           string
  displayName:        string
  avatar:             string
  bio:                string
  location:           string
  dateOfBirth:        string
  experience:         '' | 'beginner' | 'intermediate' | 'expert' | 'master'
  preferredSetup:     '' | 'indoor' | 'outdoor' | 'both'
  favouriteType:      '' | 'indica' | 'sativa' | 'hybrid'
  showLocation:       boolean
  showAge:            boolean
  emailNotifications: boolean
  links: { website: string; instagram: string; telegram: string; signal: string; threema: string }
  favouriteStrains:   { strainSlug: string; strainName: string }[]
  showcaseBadges:     string[]
}

interface Props {
  initial:         FormState
  strainOptions:   StrainOption[]
  earnedBadges:    EarnedBadge[]
  profileUsername: string
}

const CARD: React.CSSProperties = {
  background: '#0d0d10',
  border: '0.5px solid rgba(204,0,170,0.15)',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}
const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-orbitron)',
  fontSize: '10px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'rgba(204,0,170,0.6)',
  marginBottom: '16px',
  paddingBottom: '10px',
  borderBottom: '0.5px solid rgba(204,0,170,0.1)',
}
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '9px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#4a6066',
  display: 'block',
  marginBottom: '6px',
}
const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(204,0,170,0.18)',
  borderRadius: '4px',
  color: '#e8f0ef',
  padding: '10px 14px',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0,
        background: value ? '#cc00aa' : 'rgba(255,255,255,0.08)',
        border: `0.5px solid ${value ? '#cc00aa' : 'rgba(255,255,255,0.12)'}`,
        position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: value ? '21px' : '3px',
        width: '14px', height: '14px', borderRadius: '50%',
        background: value ? '#050508' : '#4a6066',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function OptionPills<T extends string>({
  options, value, onChange, multi, max,
}: {
  options: { value: T; label: string }[]
  value: T | T[]
  onChange: (v: T | T[]) => void
  multi?: boolean
  max?: number
}) {
  function isActive(v: T) {
    return multi ? (value as T[]).includes(v) : value === v
  }
  function toggle(v: T) {
    if (!multi) {
      onChange(value === v ? '' as T : v)
      return
    }
    const arr = value as T[]
    if (arr.includes(v)) {
      onChange(arr.filter(x => x !== v))
    } else {
      if (max && arr.length >= max) { toast.error(`Max ${max} items`); return }
      onChange([...arr, v])
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          style={{
            padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
            border: `0.5px solid ${isActive(opt.value) ? '#cc00aa' : 'rgba(204,0,170,0.2)'}`,
            background: isActive(opt.value) ? '#cc00aa' : 'transparent',
            color: isActive(opt.value) ? '#050508' : '#4a6066',
            transition: 'all 0.15s',
          }}
        >{opt.label}</button>
      ))}
    </div>
  )
}

export default function EditProfileForm({ initial, strainOptions, earnedBadges, profileUsername }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }
  function setLink(key: keyof FormState['links'], value: string) {
    setForm(prev => ({ ...prev, links: { ...prev.links, [key]: value } }))
  }

  async function uploadAvatar(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cloudinary/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        set('avatar', data.url)
        toast.success('Photo updated')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/hub/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Could not save')
        return
      }
      toast.success('Profile saved')
      // If username changed, redirect to new profile URL
      const newUsername = (data.user as { username?: string })?.username ?? form.username
      router.push(`/hub/profile/${newUsername}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const toggleStrain = (slug: string, name: string) => {
    const current = form.favouriteStrains
    if (current.some(s => s.strainSlug === slug)) {
      set('favouriteStrains', current.filter(s => s.strainSlug !== slug))
    } else {
      if (current.length >= 5) { toast.error('Max 5 strains'); return }
      set('favouriteStrains', [...current, { strainSlug: slug, strainName: name }])
    }
  }

  const toggleBadge = (id: string) => {
    const current = form.showcaseBadges
    if (current.includes(id)) {
      set('showcaseBadges', current.filter(b => b !== id))
    } else {
      if (current.length >= 6) { toast.error('Max 6 badges'); return }
      set('showcaseBadges', [...current, id])
    }
  }

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(204,0,170,0.5)'
  }
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(204,0,170,0.18)'
  }

  return (
    <div>
      {/* ── 1. Basic Info ─────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_TITLE}>Basic Info</div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(204,0,170,0.1)', border: '2px solid rgba(204,0,170,0.2)',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s',
            }}
            className="hover:border-[rgba(204,0,170,0.5)]"
          >
            {form.avatar ? (
              <Image src={form.avatar} alt="Avatar" fill style={{ objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', color: '#cc00aa' }}>
                {form.username.slice(0, 2).toUpperCase()}
              </span>
            )}
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px' }}>⏳</span>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
                color: '#cc00aa', background: 'rgba(204,0,170,0.08)',
                border: '0.5px solid rgba(204,0,170,0.25)', borderRadius: '4px',
                padding: '7px 14px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '5px' }}>
              JPG, PNG — max 5MB
            </p>
          </div>
          <input
            ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={LABEL}>Username *</label>
            <input
              value={form.username}
              onChange={e => set('username', e.target.value)}
              style={INPUT} onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
          <div>
            <label style={LABEL}>Display Name</label>
            <input
              value={form.displayName}
              onChange={e => set('displayName', e.target.value)}
              placeholder="e.g. John Doe"
              style={INPUT} onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={LABEL}>
            Bio
            <span style={{ marginLeft: '8px', color: form.bio.length > 140 ? '#cc00aa' : '#4a6066' }}>
              {form.bio.length}/160
            </span>
          </label>
          <textarea
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            maxLength={160}
            rows={3}
            style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focusBorder} onBlur={blurBorder}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
          <div>
            <label style={LABEL}>Location</label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Prague, CZ"
              style={INPUT} onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
          <div>
            <label style={LABEL}>Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={e => set('dateOfBirth', e.target.value)}
              style={{ ...INPUT, colorScheme: 'dark' }}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Contacts & Social ──────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_TITLE}>Contacts &amp; Social</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {([
            { key: 'telegram',  label: 'Telegram',  placeholder: '@username' },
            { key: 'signal',    label: 'Signal',    placeholder: '+421...' },
            { key: 'threema',   label: 'Threema',   placeholder: 'Threema ID' },
            { key: 'instagram', label: 'Instagram', placeholder: '@handle' },
            { key: 'website',   label: 'Website',   placeholder: 'https://...' },
          ] as { key: keyof FormState['links']; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={LABEL}>{label}</label>
              <input
                value={form.links[key]}
                onChange={e => setLink(key, e.target.value)}
                placeholder={placeholder}
                style={INPUT} onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Cannabis Profile ───────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_TITLE}>Cannabis Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ ...LABEL, marginBottom: '10px' }}>Experience</label>
            <OptionPills
              options={[
                { value: 'beginner',     label: '🌱 Beginner' },
                { value: 'intermediate', label: '🌿 Intermediate' },
                { value: 'expert',       label: '⚡ Expert' },
                { value: 'master',       label: '🏆 Master Grower' },
              ]}
              value={form.experience}
              onChange={v => set('experience', v as FormState['experience'])}
            />
          </div>
          <div>
            <label style={{ ...LABEL, marginBottom: '10px' }}>Preferred Setup</label>
            <OptionPills
              options={[
                { value: 'indoor',  label: '🏠 Indoor' },
                { value: 'outdoor', label: '🌤 Outdoor' },
                { value: 'both',    label: '🔄 Both' },
              ]}
              value={form.preferredSetup}
              onChange={v => set('preferredSetup', v as FormState['preferredSetup'])}
            />
          </div>
          <div>
            <label style={{ ...LABEL, marginBottom: '10px' }}>Favourite Type</label>
            <OptionPills
              options={[
                { value: 'indica',  label: '💜 Indica' },
                { value: 'sativa',  label: '🩵 Sativa' },
                { value: 'hybrid',  label: '🟣 Hybrid' },
              ]}
              value={form.favouriteType}
              onChange={v => set('favouriteType', v as FormState['favouriteType'])}
            />
          </div>
          <div>
            <label style={{ ...LABEL, marginBottom: '10px' }}>
              Favourite Strains
              <span style={{ marginLeft: '8px', color: '#4a6066' }}>{form.favouriteStrains.length}/5</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {strainOptions.map(s => {
                const active = form.favouriteStrains.some(f => f.strainSlug === s.slug)
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggleStrain(s.slug, s.name)}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                      fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                      border: `0.5px solid ${active ? '#00d4c8' : 'rgba(0,212,200,0.15)'}`,
                      background: active ? 'rgba(0,212,200,0.12)' : 'transparent',
                      color: active ? '#00d4c8' : '#4a6066',
                      transition: 'all 0.15s',
                    }}
                  >{s.name}</button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Settings ───────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_TITLE}>Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {([
            { key: 'showLocation',       label: 'Show location on profile' },
            { key: 'showAge',            label: 'Show age on profile' },
            { key: 'emailNotifications', label: 'Email notifications' },
          ] as { key: 'showLocation' | 'showAge' | 'emailNotifications'; label: string }[]).map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>{label}</span>
              <Toggle value={form[key]} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Showcase Badges ────────────────────────── */}
      {earnedBadges.length > 0 && (
        <div style={CARD}>
          <div style={SECTION_TITLE}>
            Showcase Badges
            <span style={{ marginLeft: '8px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '9px' }}>
              {form.showcaseBadges.length}/6
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '14px', lineHeight: 1.5 }}>
            Choose up to 6 badges displayed on your public profile.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {earnedBadges.map(b => {
              const active = form.showcaseBadges.includes(b.id)
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBadge(b.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 12px', borderRadius: '6px', cursor: 'pointer',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                    border: `0.5px solid ${active ? '#f0a830' : 'rgba(240,168,48,0.15)'}`,
                    background: active ? 'rgba(240,168,48,0.12)' : 'transparent',
                    color: active ? '#f0a830' : '#4a6066',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{b.icon}</span>
                  {b.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Save button ───────────────────────────────── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '14px',
          background: saving ? 'rgba(204,0,170,0.4)' : '#cc00aa',
          color: '#050508',
          fontFamily: 'var(--font-cacha)', fontSize: '15px', letterSpacing: '1.5px',
          textTransform: 'uppercase', border: 'none', borderRadius: '4px',
          cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        }}
        className="hover:bg-[#e000bb] hover:shadow-[0_0_20px_rgba(204,0,170,0.4)]"
      >
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  )
}
