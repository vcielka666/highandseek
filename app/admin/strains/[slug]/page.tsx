'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { generateSystemPrompt } from '@/lib/ai/generateSystemPrompt'

function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/)
  return match ? match[1] : ''
}

function AvatarSlot({
  level, imageUrl, onUpload, onRemove,
}: {
  level: number
  imageUrl: string
  onUpload: (url: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/cloudinary/upload-strain', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Upload failed')
        return
      }
      const { url } = await res.json()
      onUpload(url)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl)
      if (publicId) {
        fetch('/api/admin/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        }).catch(() => {})
      }
    }
    onRemove()
  }

  const LEVEL_NAMES = ['', 'Seedling', 'Cutting', 'Vegetating', 'Pre-Flower',
    'Flowering', 'Trichoming', 'Ripening', 'Harvest', 'Cured', 'Legendary']

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '1px' }}>
          LVL {level}
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', letterSpacing: '0.5px' }}>
          {LEVEL_NAMES[level]}
        </span>
      </div>

      {/* Upload area */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: '100%', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden',
          position: 'relative', cursor: uploading ? 'default' : 'pointer',
          background: 'rgba(204,0,170,0.05)',
          border: '0.5px solid rgba(240,168,48,0.15)',
        }}
      >
        {imageUrl && !uploading ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`Level ${level}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : uploading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '22px', height: '22px', border: '2px solid rgba(240,168,48,0.2)',
              borderTopColor: '#f0a830', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '20px', opacity: 0.25 }}>⬆</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', letterSpacing: '0.5px' }}>UPLOAD</span>
          </div>
        )}

        {/* Hover overlay on existing image */}
        {imageUrl && !uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(5,5,8,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
          }}
            className="avatar-slot-hover"
          >
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '1px' }}>CHANGE</span>
          </div>
        )}
      </div>

      {/* Remove button */}
      {imageUrl && !uploading && (
        <button
          onClick={handleRemove}
          style={{
            marginTop: '6px', width: '100%', background: 'transparent',
            border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '3px',
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066',
            padding: '4px', cursor: 'pointer', letterSpacing: '0.5px',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#cc00aa'; (e.target as HTMLElement).style.borderColor = 'rgba(204,0,170,0.5)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#4a6066'; (e.target as HTMLElement).style.borderColor = 'rgba(204,0,170,0.2)' }}
        >
          × remove
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }}
      />
    </div>
  )
}

interface AvatarLevel { level: number; imageUrl: string; animationClass: string }
interface StrainForm {
  name: string; slug: string; type: 'indica' | 'sativa' | 'hybrid'
  genetics: string; floweringTime: number; difficulty: 'easy' | 'medium' | 'hard'
  shopProductSlug: string; isActive: boolean; isComingSoon: boolean
  personality: {
    archetype: string; tone: string[]; catchphrase: string
    favoriteAction: string; hatedAction: string
    topics: string[]; forbiddenTopics: string[]
    systemPrompt: string; customSystemPrompt: string
  }
  visuals: { avatarLevels: AvatarLevel[]; backgrounds: { url: string; moodHint: string }[]; idleAnimation: string; happyAnimation: string; sadAnimation: string }
  stats: { totalChats: number; totalMessages: number; helpfulVotes: number; unhelpfulVotes: number }
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

const FIELD: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '4px',
  color: '#e8f0ef', padding: '9px 13px',
  fontFamily: 'var(--font-dm-sans)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px',
  textTransform: 'uppercase', color: '#4a6066', display: 'block', marginBottom: '5px',
}
const SECTION: React.CSSProperties = {
  background: '#0d1014', border: '0.5px solid rgba(240,168,48,0.1)',
  borderRadius: '8px', padding: '20px', marginBottom: '16px',
}
const STITLE: React.CSSProperties = {
  fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px',
  textTransform: 'uppercase', color: 'rgba(240,168,48,0.6)',
  marginBottom: '16px', paddingBottom: '10px',
  borderBottom: '0.5px solid rgba(240,168,48,0.1)',
}

function BgSlot({ index, url, moodHint, onUpload, onMoodChange, onRemove }: {
  index: number; url: string; moodHint: string
  onUpload: (url: string) => void; onMoodChange: (hint: string) => void; onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/cloudinary/upload-strain', { method: 'POST', body: fd })
      if (!res.ok) { toast.error('Upload failed'); return }
      const { url: uploaded } = await res.json()
      onUpload(uploaded)
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  function extractPublicId(u: string) {
    const m = u.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/)
    return m ? m[1] : ''
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    if (url) {
      const pid = extractPublicId(url)
      if (pid) fetch('/api/admin/cloudinary/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId: pid }) }).catch(() => {})
    }
    onRemove()
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '1px' }}>BG {index + 1}</div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: '100%', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden',
          position: 'relative', cursor: uploading ? 'default' : 'pointer',
          background: url ? `url(${url}) center/cover` : 'rgba(240,168,48,0.04)',
          border: '0.5px solid rgba(240,168,48,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {!url && !uploading && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e' }}>⬆ UPLOAD</span>}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,8,0.5)' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(240,168,48,0.2)', borderTopColor: '#f0a830', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        {url && !uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }} className="bg-slot-hover">
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '1px' }}>CHANGE</span>
          </div>
        )}
      </div>
      {url && !uploading && (
        <button onClick={handleRemove} style={{ width: '100%', background: 'transparent', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '3px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', padding: '3px', cursor: 'pointer', letterSpacing: '0.5px' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#cc00aa' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#4a6066' }}
        >× remove</button>
      )}
      {/* Mood hint — always visible so admin can write it before uploading */}
      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>MOOD HINT</label>
        <textarea
          rows={2}
          placeholder="e.g. Chill night vibes, jazz in the air. Be laid-back and use night metaphors."
          value={moodHint}
          onChange={e => onMoodChange(e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '3px',
            color: '#e8f0ef', padding: '6px 8px',
            fontFamily: 'var(--font-dm-sans)', fontSize: '11px', outline: 'none',
            resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box',
          }}
        />
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e' }}>
          Injected into AI system prompt when user activates this bg
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }} />
    </div>
  )
}

export default function AdminStrainEditPage() {
  const params    = useParams<{ slug: string }>()
  const router    = useRouter()
  const [form, setForm] = useState<StrainForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'visuals' | 'stats'>('basic')

  // Test chat state
  const [testMessages, setTestMessages] = useState<ChatMsg[]>([])
  const [testInput, setTestInput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const testEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { testEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [testMessages])

  useEffect(() => {
    fetch(`/api/admin/strains/${params.slug}`)
      .then(r => r.json())
      .then(d => { if (d.strain) setForm(d.strain) })
      .catch(() => toast.error('Failed to load strain'))
  }, [params.slug])

  if (!form) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
      Loading...
    </div>
  )

  function setPersonality<K extends keyof StrainForm['personality']>(key: K, val: StrainForm['personality'][K]) {
    setForm(prev => prev ? { ...prev, personality: { ...prev.personality, [key]: val } } : prev)
  }

  function handleToneInput(raw: string) {
    setPersonality('tone', raw.split(',').map(t => t.trim()).filter(Boolean))
  }
  function handleTopicsInput(raw: string) {
    setPersonality('topics', raw.split(',').map(t => t.trim()).filter(Boolean))
  }
  function handleForbiddenInput(raw: string) {
    setPersonality('forbiddenTopics', raw.split(',').map(t => t.trim()).filter(Boolean))
  }

  function handleGeneratePrompt() {
    if (!form) return
    const p = form.personality
    const generated = generateSystemPrompt({
      name: form.name, archetype: p.archetype, tone: p.tone,
      catchphrase: p.catchphrase, favoriteAction: p.favoriteAction,
      hatedAction: p.hatedAction, topics: p.topics, forbiddenTopics: p.forbiddenTopics,
    })
    setPersonality('systemPrompt', generated)
    toast.success('System prompt generated')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/strains/${params.slug}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Delete failed'); return }
      toast.success(`${form?.name ?? 'Strain'} deleted`)
      router.push('/admin/strains')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/strains/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Save failed'); return }
      toast.success('Strain saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestChat() {
    const msg = testInput.trim()
    if (!msg || testLoading) return
    setTestMessages(prev => [...prev, { role: 'user', content: msg }])
    setTestInput('')
    setTestLoading(true)
    try {
      const res = await fetch(`/api/admin/strains/${params.slug}/test-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:  msg,
          history:  testMessages.slice(-6),
          prompt:   form?.personality.customSystemPrompt || form?.personality.systemPrompt,
        }),
      })
      const d = await res.json()
      setTestMessages(prev => [...prev, { role: 'assistant', content: d.response ?? d.error ?? 'Error' }])
    } catch {
      toast.error('Test chat failed')
    } finally {
      setTestLoading(false)
    }
  }

  const TABS = [
    { key: 'basic',       label: 'Basic Info' },
    { key: 'personality', label: 'Personality' },
    { key: 'visuals',     label: 'Visuals' },
    { key: 'stats',       label: 'Stats' },
  ] as const

  return (
    <div style={{ padding: '16px', maxWidth: '900px' }} className="md:px-7 md:pt-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', color: '#f0a830', marginBottom: '4px' }} className="md:text-lg">{form.name}</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{form.slug} · {form.personality.archetype}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          <button onClick={() => router.push('/admin/strains')}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(74,96,102,0.3)', padding: '7px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            ← Back
          </button>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} disabled={deleting}
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#050508', background: deleting ? 'rgba(204,51,0,0.4)' : '#cc3300', border: 'none', padding: '7px 12px', borderRadius: '4px', cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? '…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(74,96,102,0.3)', padding: '7px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(204,51,0,0.2)', padding: '7px 12px', borderRadius: '4px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#cc3300'; e.currentTarget.style.borderColor = 'rgba(204,51,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4a6066'; e.currentTarget.style.borderColor = 'rgba(204,51,0,0.2)' }}>
              Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#050508', background: saving ? 'rgba(240,168,48,0.4)' : '#f0a830', border: 'none', padding: '7px 16px', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '0.5px solid rgba(240,168,48,0.1)', paddingBottom: '0', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
              padding: '8px 16px', background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: activeTab === t.key ? '2px solid #f0a830' : '2px solid transparent',
              color: activeTab === t.key ? '#f0a830' : '#4a6066', transition: 'all 0.15s',
            }}>{t.label}</button>
        ))}
      </div>

      {/* ── BASIC INFO ──────────────────────────────────────────────── */}
      {activeTab === 'basic' && (
        <div>
          <div style={SECTION}>
            <div style={STITLE}>Basic Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { k: 'name', label: 'Name' },
                { k: 'slug', label: 'Slug' },
                { k: 'genetics', label: 'Genetics' },
                { k: 'shopProductSlug', label: 'Shop Product Slug' },
              ].map(({ k, label }) => (
                <div key={k}>
                  <label style={LABEL}>{label}</label>
                  <input style={FIELD} value={(form as unknown as Record<string, string>)[k] ?? ''} onChange={e => setForm(prev => prev ? ({ ...prev, [k]: e.target.value }) : prev)} />
                </div>
              ))}
              <div>
                <label style={LABEL}>Type</label>
                <select style={FIELD} value={form.type} onChange={e => setForm(prev => prev ? ({ ...prev, type: e.target.value as 'indica' | 'sativa' | 'hybrid' }) : prev)}>
                  <option value="indica">Indica</option>
                  <option value="sativa">Sativa</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Difficulty</label>
                <select style={FIELD} value={form.difficulty} onChange={e => setForm(prev => prev ? ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }) : prev)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Flowering Time (days)</label>
                <input type="number" style={FIELD} value={form.floweringTime} onChange={e => setForm(prev => prev ? ({ ...prev, floweringTime: parseInt(e.target.value) }) : prev)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '14px' }}>
              {[{ k: 'isActive', label: 'Active' }, { k: 'isComingSoon', label: 'Coming Soon' }].map(({ k, label }) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>
                  <input type="checkbox" checked={(form as unknown as Record<string, boolean>)[k] ?? false} onChange={e => setForm(prev => prev ? ({ ...prev, [k]: e.target.checked }) : prev)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PERSONALITY ─────────────────────────────────────────────── */}
      {activeTab === 'personality' && (
        <div>
          <div style={SECTION}>
            <div style={STITLE}>Personality</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {[
                { k: 'archetype',      label: 'Archetype',       placeholder: 'e.g. Rebel Activist' },
                { k: 'catchphrase',    label: 'Catchphrase',     placeholder: 'Signature line' },
              ].map(({ k, label, placeholder }) => (
                <div key={k}>
                  <label style={LABEL}>{label}</label>
                  <input style={FIELD} value={form.personality[k as 'archetype' | 'catchphrase']} placeholder={placeholder}
                    onChange={e => setPersonality(k as 'archetype' | 'catchphrase', e.target.value)} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }}>
                <div>
                  <label style={LABEL}>Favorite Action</label>
                  <select style={FIELD} value={form.personality.favoriteAction} onChange={e => setPersonality('favoriteAction', e.target.value)}>
                    {['water', 'feed', 'light', 'flush'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>Hated Action</label>
                  <select style={FIELD} value={form.personality.hatedAction} onChange={e => setPersonality('hatedAction', e.target.value)}>
                    {['water', 'feed', 'light', 'flush'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={LABEL}>Tone (comma-separated)</label>
                <input style={FIELD} value={form.personality.tone.join(', ')} onChange={e => handleToneInput(e.target.value)} placeholder="flirtatious, warm, playful" />
              </div>
              <div>
                <label style={LABEL}>Topics (comma-separated)</label>
                <input style={FIELD} value={form.personality.topics.join(', ')} onChange={e => handleTopicsInput(e.target.value)} placeholder="cherry, smoke, bong" />
              </div>
              <div>
                <label style={LABEL}>Forbidden Topics (comma-separated)</label>
                <input style={FIELD} value={form.personality.forbiddenTopics.join(', ')} onChange={e => handleForbiddenInput(e.target.value)} placeholder="medical advice, dosing" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleGeneratePrompt}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#050508', background: '#f0a830', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  ↻ Generate System Prompt
                </button>
              </div>

              <div>
                <label style={LABEL}>System Prompt (auto-generated)</label>
                <textarea rows={8} style={{ ...FIELD, resize: 'vertical', lineHeight: 1.6 }}
                  value={form.personality.systemPrompt}
                  onChange={e => setPersonality('systemPrompt', e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Custom System Prompt Override (admin only — overrides auto)</label>
                <textarea rows={5} style={{ ...FIELD, resize: 'vertical', lineHeight: 1.6 }}
                  value={form.personality.customSystemPrompt}
                  placeholder="Leave empty to use generated prompt above"
                  onChange={e => setPersonality('customSystemPrompt', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Test Chat */}
          <div style={SECTION}>
            <div style={STITLE}>Test Chat (uses current unsaved prompt · no XP, not saved)</div>
            <div style={{ height: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '12px' }}>
              {testMessages.length === 0 && (
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#2a3a3e', marginTop: '32px' }}>
                  Send a message to test the personality
                </div>
              )}
              {testMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', borderRadius: '8px',
                    background: m.role === 'user' ? 'rgba(0,212,200,0.1)' : 'rgba(240,168,48,0.08)',
                    fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef',
                    lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066', letterSpacing: '2px' }}>•••</div>
              )}
              <div ref={testEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...FIELD, flex: 1 }} value={testInput} placeholder="Type a test message..."
                onChange={e => setTestInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTestChat() }} />
              <button onClick={handleTestChat} disabled={testLoading || !testInput.trim()}
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#050508', background: '#f0a830', border: 'none', padding: '9px 16px', borderRadius: '4px', cursor: 'pointer', opacity: testLoading || !testInput.trim() ? 0.5 : 1 }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VISUALS ─────────────────────────────────────────────────── */}
      {activeTab === 'visuals' && (
        <>
          <div style={SECTION}>
            <div style={STITLE}>Avatar Images per Level</div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '16px', lineHeight: 1.5 }}>
              Click any slot to upload. Images are saved to Cloudinary automatically — hit Save after uploading.
            </p>
            <style>{`.avatar-slot-hover { opacity: 0 !important } *:hover > .avatar-slot-hover { opacity: 1 !important } .bg-slot-hover { opacity: 0 !important } *:hover > .bg-slot-hover { opacity: 1 !important }`}</style>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {form.visuals.avatarLevels.map((al, i) => (
                <AvatarSlot
                  key={al.level}
                  level={al.level}
                  imageUrl={al.imageUrl}
                  onUpload={url => {
                    const newLevels = [...form.visuals.avatarLevels]
                    newLevels[i] = { ...newLevels[i], imageUrl: url }
                    setForm(prev => prev ? ({ ...prev, visuals: { ...prev.visuals, avatarLevels: newLevels } }) : prev)
                  }}
                  onRemove={() => {
                    const newLevels = [...form.visuals.avatarLevels]
                    newLevels[i] = { ...newLevels[i], imageUrl: '' }
                    setForm(prev => prev ? ({ ...prev, visuals: { ...prev.visuals, avatarLevels: newLevels } }) : prev)
                  }}
                />
              ))}
            </div>
          </div>

          <div style={SECTION}>
            <div style={STITLE}>Background Templates (up to 4)</div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '16px', lineHeight: 1.5 }}>
              Users unlock templates for 3 credits or upload their own custom bg + mood for 6 credits. Each slot has a <strong style={{ color: '#e8f0ef' }}>Mood Hint</strong> — a short description that is injected into the AI system prompt whenever this background is active, subtly shifting the avatar&apos;s energy and references.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => {
                const bg = (form?.visuals.backgrounds ?? [])[i] ?? { url: '', moodHint: '' }
                return (
                  <BgSlot
                    key={i}
                    index={i}
                    url={bg.url ?? ''}
                    moodHint={bg.moodHint ?? ''}
                    onUpload={newUrl => setForm(prev => {
                      if (!prev) return prev
                      const newBgs = [...(prev.visuals.backgrounds ?? [])]
                      newBgs[i] = { url: newUrl, moodHint: newBgs[i]?.moodHint ?? '' }
                      return { ...prev, visuals: { ...prev.visuals, backgrounds: newBgs } }
                    })}
                    onMoodChange={hint => setForm(prev => {
                      if (!prev) return prev
                      const newBgs = [...(prev.visuals.backgrounds ?? [])]
                      newBgs[i] = { url: newBgs[i]?.url ?? '', moodHint: hint }
                      return { ...prev, visuals: { ...prev.visuals, backgrounds: newBgs } }
                    })}
                    onRemove={() => setForm(prev => {
                      if (!prev) return prev
                      const newBgs = [...(prev.visuals.backgrounds ?? [])]
                      newBgs[i] = { url: '', moodHint: newBgs[i]?.moodHint ?? '' }
                      return { ...prev, visuals: { ...prev.visuals, backgrounds: newBgs } }
                    })}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── STATS ───────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div style={SECTION}>
          <div style={STITLE}>Statistics (read-only)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Chats',     value: form.stats.totalChats.toLocaleString() },
              { label: 'Total Messages',  value: form.stats.totalMessages.toLocaleString() },
              { label: 'Helpful Votes',   value: form.stats.helpfulVotes.toLocaleString() },
              { label: 'Unhelpful Votes', value: form.stats.unhelpfulVotes.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', color: '#f0a830' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
