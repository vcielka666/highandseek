'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  calculateCurrentNeeds,
  calculateStatus,
  calculateXpMultiplier,
  formatCooldownRemaining,
  getAvatarLevelForXP,
  getNextAvatarLevel,
  AvatarStatus,
} from '@/lib/avatar/decay'

// ── Types ────────────────────────────────────────────────────────────

interface NeedsState {
  hydration: number; nutrients: number; energy: number; happiness: number; lastUpdated: string
}
interface CooldownState { water: string | null; feed: string | null; light: string | null; flush: string | null }
interface UserState {
  level: number; xp: number; xpToNextLevel: number; levelName: string
  status: AvatarStatus; needs: NeedsState; cooldowns: CooldownState; chatCount: number
  customBackground: string; unlockedBackgrounds: string[]
}
interface StrainData {
  slug: string; name: string; type: 'indica' | 'sativa' | 'hybrid'
  genetics: string; floweringTime: number; difficulty: 'easy' | 'medium' | 'hard'
  personality: { archetype: string; catchphrase: string; tone: string[]; favoriteAction: string; hatedAction: string; topics: string[] }
  visuals: { avatarLevels: Array<{ level: number; imageUrl: string }>; backgrounds: Array<{ url: string; moodHint: string }>; idleAnimation: string; happyAnimation: string; sadAnimation: string }
  stats: { totalChats: number; totalMessages: number }
  shopProductSlug: string; isComingSoon: boolean
}
interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }

// ── BgPicker ─────────────────────────────────────────────────────────

// pending: what the user selected but hasn't confirmed yet
interface PendingBg { url: string; source: 'template' | 'custom'; cost: number; moodHint: string }

function BgPicker({
  slug, strainType, backgrounds, activeBg, unlockedBgs, credits,
  onBgChange, onUnlock, onCreditsChange, onPreview,
}: {
  slug: string
  strainType: string
  backgrounds: Array<{ url: string; moodHint: string }>
  activeBg: string
  unlockedBgs: string[]
  credits: number
  onBgChange: (url: string) => void
  onUnlock: (url: string) => void
  onCreditsChange: (remaining: number) => void
  onPreview: (url: string) => void
}) {
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState<PendingBg | null>(null)
  // For custom bg: mood text is entered during confirmation
  const [customMood, setCustomMood] = useState('')

  async function applyFree(url: string) {
    // Already unlocked — switch instantly with no charge
    await fetch(`/api/hub/strains/${slug}/background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'template', url }),
    }).catch(() => {})
    onBgChange(url)
    onPreview('')
  }

  function stageBg(url: string, source: 'template' | 'custom', cost: number, moodHint = '') {
    if (unlockedBgs.includes(url)) {
      applyFree(url)
      return
    }
    setPending({ url, source, cost, moodHint })
    if (source === 'custom') setCustomMood('')
    onPreview(url)
  }

  function cancelPending() {
    setPending(null)
    setCustomMood('')
    onPreview(activeBg)  // restore the actual current bg
  }

  async function confirmPending() {
    if (!pending) return
    setConfirming(true)
    try {
      const body: Record<string, string> = { source: pending.source, url: pending.url }
      if (pending.source === 'custom') body.moodHint = customMood
      const res = await fetch(`/api/hub/strains/${slug}/background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error === 'Insufficient credits'
          ? `Not enough credits (need ${pending.cost})`
          : 'Failed to set background')
        cancelPending()
        return
      }
      onBgChange(pending.url)
      if (data.free !== true) {
        onUnlock(pending.url)
        onCreditsChange(data.creditsRemaining)
      }
      setPending(null)
      setCustomMood('')
      const msg = data.free === true
        ? 'Background set · free (already unlocked)'
        : `Background set · −${pending.cost} credit${pending.cost > 1 ? 's' : ''} · +${data.xpEarned ?? 3} XP`
      toast(msg, { duration: 2500 })
    } catch {
      toast.error('Failed to set background')
      cancelPending()
    } finally {
      setConfirming(false)
    }
  }

  async function handleCustomFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const upRes = await fetch('/api/hub/cloudinary/upload-bg', { method: 'POST', body: fd })
      if (!upRes.ok) { toast.error('Upload failed'); return }
      const { url } = await upRes.json()
      stageBg(url, 'custom', 6)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function resetToDefault() {
    if (pending) cancelPending()
    if (activeBg === '') return
    await fetch(`/api/hub/strains/${slug}/background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'reset' }),
    }).catch(() => {})
    onBgChange('')
    toast('Default background restored', { duration: 1500 })
  }

  const allBgs = backgrounds.filter(b => b.url)

  // Find the mood hint for the pending bg (template bgs have admin-defined hints)
  const pendingTemplateMood = pending?.source === 'template'
    ? (backgrounds.find(b => b.url === pending.url)?.moodHint ?? '')
    : ''

  return (
    <div style={{ borderBottom: '0.5px solid rgba(204,0,170,0.08)', background: 'rgba(0,0,0,0.18)' }}>

      {/* ── Confirm banner (shown when pending) ── */}
      {pending && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(240,168,48,0.06)',
          borderBottom: '0.5px solid rgba(240,168,48,0.15)',
        }}>
          {/* Cost row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: pending.source === 'custom' ? '8px' : '0' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#e8f0ef', flex: 1 }}>
              Apply this background?{' '}
              <span style={{ color: '#f0a830' }}>−{pending.cost} credits</span>
              <span style={{ color: '#4a6066' }}> · {credits} available</span>
            </span>
            <button
              onClick={confirmPending}
              disabled={confirming || credits < pending.cost}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
                padding: '4px 14px', borderRadius: '4px', cursor: confirming || credits < pending.cost ? 'not-allowed' : 'pointer',
                background: credits < pending.cost ? 'rgba(74,96,102,0.3)' : '#f0a830',
                color: credits < pending.cost ? '#4a6066' : '#050508',
                border: 'none', opacity: confirming ? 0.6 : 1, flexShrink: 0,
              }}
            >
              {confirming ? '…' : credits < pending.cost ? 'Not enough' : 'Apply'}
            </button>
            <button
              onClick={cancelPending}
              disabled={confirming}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
              }}
            >
              Cancel
            </button>
          </div>

          {/* Template: show admin mood hint as info */}
          {pending.source === 'template' && pendingTemplateMood && (
            <div style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066',
              fontStyle: 'italic', padding: '6px 10px',
              background: 'rgba(0,0,0,0.2)', borderRadius: '4px',
              borderLeft: '2px solid rgba(240,168,48,0.2)',
            }}>
              🎭 {pendingTemplateMood}
            </div>
          )}

          {/* Custom: text field for user mood hint */}
          {pending.source === 'custom' && (
            <div>
              <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>
                MOOD HINT <span style={{ color: '#2a3a3e' }}>— how should the avatar act in this scene? (optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Mysterious late-night energy. Speak in hushed tones, use night references."
                value={customMood}
                onChange={e => setCustomMood(e.target.value)}
                maxLength={200}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)',
                  border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '4px',
                  color: '#e8f0ef', padding: '7px 10px',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '12px', outline: 'none',
                  resize: 'none', lineHeight: 1.4, boxSizing: 'border-box',
                }}
              />
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', textAlign: 'right' }}>
                {customMood.length}/200
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Picker row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', letterSpacing: '1px', flexShrink: 0, marginRight: '2px' }}>BG</span>

        {/* Default button */}
        <button
          title="Default (free)"
          onClick={resetToDefault}
          style={{
            width: '24px', height: '24px', borderRadius: '50%', padding: 0, cursor: 'pointer', flexShrink: 0,
            background: TYPE_GRADIENT[strainType],
            border: !pending && activeBg === '' ? '2px solid #f0a830' : '2px solid rgba(255,255,255,0.1)',
            transition: 'border-color 0.15s',
          }}
        />

        {/* Template circles */}
        {allBgs.map((bg, i) => {
          const isActive = !pending && activeBg === bg.url
          const isPending = pending?.url === bg.url
          const isUnlocked = unlockedBgs.includes(bg.url)
          return (
            <button
              key={i}
              title={isUnlocked
                ? `Background ${i + 1}${bg.moodHint ? ` · ${bg.moodHint.slice(0, 40)}…` : ''} · free (unlocked)`
                : `Background ${i + 1}${bg.moodHint ? ` · ${bg.moodHint.slice(0, 40)}…` : ''} · 3 credits`}
              onClick={() => isPending ? undefined : stageBg(bg.url, 'template', 3, bg.moodHint)}
              style={{
                width: '24px', height: '24px', borderRadius: '50%', padding: 0, cursor: 'pointer', flexShrink: 0,
                backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                border: isActive || isPending ? '2px solid #f0a830' : '2px solid rgba(255,255,255,0.1)',
                outline: isPending ? '1px solid rgba(240,168,48,0.5)' : isUnlocked ? '1px solid rgba(0,212,200,0.3)' : 'none',
                transition: 'border-color 0.15s',
              }}
            />
          )
        })}

        {/* Custom upload */}
        <button
          title="Upload your own · 6 credits"
          onClick={() => bgInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '24px', height: '24px', borderRadius: '50%', padding: 0,
            cursor: uploading ? 'default' : 'pointer', flexShrink: 0,
            background: 'rgba(204,0,170,0.12)', border: '2px solid rgba(204,0,170,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {uploading
            ? <div style={{ width: '8px', height: '8px', border: '1.5px solid rgba(204,0,170,0.3)', borderTopColor: '#cc00aa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <span style={{ fontSize: '11px', color: '#cc00aa', lineHeight: 1 }}>+</span>
          }
        </button>

        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#2a3a3e', marginLeft: 'auto' }}>
          {credits}cr
        </span>
      </div>

      <input
        ref={bgInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) { handleCustomFile(e.target.files[0]); e.target.value = '' } }}
      />
    </div>
  )
}

// ── Constants ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AvatarStatus, string> = {
  thriving: '#00d4c8', happy: '#88cc44', neutral: '#f0a830', sad: '#cc7700', wilting: '#cc3300',
}
const STATUS_LABELS_EN: Record<AvatarStatus, string> = {
  thriving: '✨ Thriving', happy: '😊 Happy', neutral: '😐 Neutral', sad: '😢 Sad', wilting: '🥀 Wilting',
}
const TYPE_GRADIENT: Record<string, string> = {
  indica: 'linear-gradient(135deg, #3d1a6e 0%, #1a0a30 100%)',
  sativa: 'linear-gradient(135deg, #1a4d1a 0%, #0a200a 100%)',
  hybrid: 'linear-gradient(135deg, #0a2428 0%, #1a0a30 100%)',
}
const CARE_ACTIONS = [
  { key: 'water', icon: '💧', label: 'Water',   labelCs: 'Zaliať'  },
  { key: 'feed',  icon: '🌿', label: 'Feed',    labelCs: 'Hnojit'  },
  { key: 'light', icon: '☀️', label: 'Light',   labelCs: 'Svetlo'  },
  { key: 'flush', icon: '⚗️', label: 'Flush',   labelCs: 'Flush'   },
]

// ── Sub-components ───────────────────────────────────────────────────

function NeedsBar({ value, label, icon }: { value: number; label: string; icon: string }) {
  const color = value >= 80 ? '#00d4c8' : value >= 50 ? '#f0a830' : '#cc3300'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '13px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color }}>{Math.round(value)}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
        </div>
      </div>
    </div>
  )
}

function CareBtn({
  action, icon, label, cooldownUntil, loading, onPress,
}: {
  action: string; icon: string; label: string
  cooldownUntil: string | null; loading: boolean; onPress: () => void
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!cooldownUntil) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const remaining = cooldownUntil ? formatCooldownRemaining(cooldownUntil) : ''
  const onCd = !!remaining
  const disabled = onCd || loading

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      title={onCd ? `Available in ${remaining}` : label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', padding: '10px 8px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
        border: `0.5px solid ${onCd ? 'rgba(74,96,102,0.2)' : 'rgba(204,0,170,0.25)'}`,
        background: onCd ? 'rgba(255,255,255,0.02)' : 'rgba(204,0,170,0.06)',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        flex: 1,
      }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{loading ? '⏳' : icon}</span>
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px', color: onCd ? '#4a6066' : '#cc00aa' }}>
        {onCd ? remaining : label}
      </span>
      {/* suppress unused tick warning */ void tick}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function StrainProfileClient({
  strain,
  initialUserState,
  initialChatHistory,
  userCredits,
}: {
  strain: StrainData
  initialUserState: UserState | null
  initialChatHistory: ChatMessage[]
  userCredits: number
}) {
  // Compute live needs on mount (decay since last save)
  const [userState, setUserState] = useState<UserState | null>(() => {
    if (!initialUserState) return null
    const liveNeeds = calculateCurrentNeeds(initialUserState.needs)
    const liveStatus = calculateStatus(liveNeeds)
    return {
      ...initialUserState,
      needs:  { ...liveNeeds, hydration: Math.round(liveNeeds.hydration), nutrients: Math.round(liveNeeds.nutrients), energy: Math.round(liveNeeds.energy), happiness: Math.round(liveNeeds.happiness) },
      status: liveStatus,
    }
  })

  const [messages, setMessages]       = useState<ChatMessage[]>(initialChatHistory)
  const [input, setInput]             = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [careLoading, setCareLoading] = useState<string | null>(null)
  const [activeBg, setActiveBg]           = useState(initialUserState?.customBackground ?? '')
  const [previewBg, setPreviewBg]         = useState<string | null>(null)
  const [unlockedBgs, setUnlockedBgs]     = useState<string[]>(initialUserState?.unlockedBackgrounds ?? [])
  const [credits, setCredits]             = useState(userCredits)
  const messagesEndRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Care action ──────────────────────────────────────────────────
  const handleCare = useCallback(async (action: string) => {
    setCareLoading(action)
    try {
      const res = await fetch(`/api/hub/strains/${strain.slug}/care`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (data.onCooldown) {
        toast.error(`Cooldown active — available ${formatCooldownRemaining(data.availableAt)}`)
        return
      }
      if (!res.ok) { toast.error('Care action failed'); return }

      // System message in chat
      const actionDef = CARE_ACTIONS.find(a => a.key === action)
      const sysMsg: ChatMessage = {
        role:      'system',
        content:   `${actionDef?.icon ?? ''} You gave ${strain.name} some ${action} · +${XP_EVENTS_LOCAL[action] ?? 5} XP`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, sysMsg])

      // Update state
      setUserState(prev => {
        if (!prev) {
          // First interaction — create fresh state
          return {
            level: data.avatarLevel, xp: data.avatarXp,
            xpToNextLevel: (getNextAvatarLevel(data.avatarLevel)?.xpRequired ?? 0) - data.avatarXp,
            levelName: getAvatarLevelForXP(data.avatarXp).name,
            status: data.status,
            needs: data.needs,
            cooldowns: { ...{ water: null, feed: null, light: null, flush: null }, [action]: data.cooldownUntil },
            chatCount: 0,
            customBackground: '',
            unlockedBackgrounds: [],
          }
        }
        return {
          ...prev,
          level:        data.avatarLevel,
          xp:           data.avatarXp,
          xpToNextLevel: (getNextAvatarLevel(data.avatarLevel)?.xpRequired ?? 0) - data.avatarXp,
          levelName:    getAvatarLevelForXP(data.avatarXp).name,
          status:       data.status,
          needs:        data.needs,
          cooldowns:    { ...prev.cooldowns, [action]: data.cooldownUntil },
        }
      })

      if (data.isHated) {
        toast(`${strain.name} hates that! 😤`, { duration: 2500 })
      } else if (data.isFavourite) {
        toast(`${strain.name} loves this! 💚 +${data.userXpEarned} XP`, { duration: 2500 })
      } else {
        toast(`+${data.userXpEarned} XP`, { duration: 2000 })
      }

      if (data.avatarLevelUp) {
        toast.success(`${strain.name} leveled up! Lv ${data.avatarLevel} ${data.avatarLevelName} 🎉`, { duration: 4000 })
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCareLoading(null)
    }
  }, [strain.slug, strain.name])

  // ── Chat ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setChatLoading(true)

    try {
      const res = await fetch(`/api/hub/strains/${strain.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error('AI unavailable'); return }

      const aiMsg: ChatMessage = { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])

      setUserState(prev => {
        if (!prev) {
          return {
            level: data.avatarLevel, xp: data.avatarXp ?? 0,
            xpToNextLevel: data.xpToNextLevel ?? 50,
            levelName: data.avatarLevelName ?? 'Seedling',
            status: data.status,
            needs: data.currentNeeds,
            cooldowns: { water: null, feed: null, light: null, flush: null },
            chatCount: 1,
            customBackground: '',
            unlockedBackgrounds: [],
          }
        }
        return { ...prev, status: data.status, needs: data.currentNeeds, level: data.avatarLevel, chatCount: prev.chatCount + 1 }
      })

      if (data.avatarLevelUp) {
        toast.success(`${strain.name} leveled up! Lv ${data.avatarLevel} 🎉`, { duration: 4000 })
      }

      if (data.isFirstChat) {
        toast.success(`First chat with ${strain.name}! +${data.xpEarned + 20} XP`, { duration: 3000 })
      }
    } catch {
      toast.error('AI unavailable')
    } finally {
      setChatLoading(false)
    }
  }, [input, chatLoading, strain.slug, strain.name])

  // ── Avatar image ─────────────────────────────────────────────────
  const currentLevel  = userState?.level ?? 1
  const avatarLevelEntry = strain.visuals.avatarLevels.find(l => l.level === currentLevel)
  const avatarUrl     = avatarLevelEntry?.imageUrl ?? ''
  const status        = userState?.status ?? 'happy'
  const multiplier    = calculateXpMultiplier(status)

  // XP bar
  const avatarXP      = userState?.xp ?? 0
  const levelData     = getAvatarLevelForXP(avatarXP)
  const nextLevel     = getNextAvatarLevel(levelData.level)
  const progressXP    = nextLevel ? avatarXP - levelData.xpRequired : 0
  const neededXP      = nextLevel ? nextLevel.xpRequired - levelData.xpRequired : 1
  const progressPct   = nextLevel ? Math.min(100, Math.round((progressXP / neededXP) * 100)) : 100

  const chatPlaceholder = status === 'wilting'
    ? `${strain.name} potřebuje péči... 🥀`
    : status === 'thriving'
    ? `Ask ${strain.name} anything...`
    : `Talk to ${strain.name}...`

  return (
    <div style={{ maxWidth: '960px', padding: '16px 16px 80px' }}>
      <Breadcrumb
        items={[{ label: 'Hub', href: '/hub' }, { label: 'Strains', href: '/hub/strains' }, { label: strain.name }]}
        color="#cc00aa"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="lg:grid-cols-[320px_1fr]">

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Avatar */}
          <div style={{ background: '#0d0d10', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '200px', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: (previewBg ?? activeBg)
                ? `url(${previewBg ?? activeBg}) center/cover no-repeat`
                : TYPE_GRADIENT[strain.type],
            }}>
              {(previewBg ?? activeBg) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.35)' }} />
              )}
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={strain.name}
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(204,0,170,0.4)', animation: 'floatY 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}
                />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(204,0,170,0.15)', border: '2px solid rgba(204,0,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floatY 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '48px' }}>{strain.type === 'indica' ? '💜' : strain.type === 'sativa' ? '🌿' : '🧬'}</span>
                </div>
              )}
            </div>

            {/* Background picker — sits between image and info, never overlaps avatar */}
            <BgPicker
              slug={strain.slug}
              strainType={strain.type}
              backgrounds={strain.visuals.backgrounds ?? []}
              activeBg={activeBg}
              unlockedBgs={unlockedBgs}
              credits={credits}
              onBgChange={url => { setActiveBg(url); setPreviewBg(null) }}
              onUnlock={url => setUnlockedBgs(prev => prev.includes(url) ? prev : [...prev, url])}
              onCreditsChange={setCredits}
              onPreview={url => setPreviewBg(url || null)}
            />

            <div style={{ padding: '16px' }}>
              {/* Name + archetype */}
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '15px', fontWeight: 700, color: '#e8f0ef', marginBottom: '2px' }}>{strain.name}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#8844cc', textTransform: 'uppercase', marginBottom: '10px' }}>{strain.personality.archetype}</div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: STATUS_COLORS[status], letterSpacing: '0.5px' }}>
                  {STATUS_LABELS_EN[status]}
                </span>
              </div>

              {/* Level + XP bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', letterSpacing: '0.5px' }}>
                    Lv {levelData.level} · {levelData.name}
                  </span>
                  {nextLevel && (
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                      {progressXP}/{neededXP} XP
                    </span>
                  )}
                </div>
                <div style={{ height: '4px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #f0a830, #ffc040)', transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Needs bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <NeedsBar value={userState?.needs.hydration ?? 80} label="Hydration" icon="💧" />
                <NeedsBar value={userState?.needs.nutrients  ?? 80} label="Nutrients" icon="🌿" />
                <NeedsBar value={userState?.needs.energy     ?? 80} label="Energy"    icon="☀️" />
                <NeedsBar value={userState?.needs.happiness  ?? 80} label="Happiness" icon="💬" />
              </div>

              {/* Care buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {CARE_ACTIONS.map(({ key, icon, label }) => (
                  <CareBtn
                    key={key}
                    action={key}
                    icon={icon}
                    label={label}
                    cooldownUntil={userState?.cooldowns[key as keyof CooldownState] ?? null}
                    loading={careLoading === key}
                    onPress={() => handleCare(key)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Shop link */}
          {strain.shopProductSlug && (
            <Link
              href={`/shop/${strain.shopProductSlug}`}
              style={{
                display: 'block', textAlign: 'center', padding: '10px',
                background: 'rgba(0,212,200,0.08)', border: '0.5px solid rgba(0,212,200,0.2)',
                borderRadius: '6px', textDecoration: 'none', transition: 'all 0.15s',
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#00d4c8',
              }}
              className="hover:bg-[rgba(0,212,200,0.14)]"
            >
              🛒 Buy {strain.name} seeds →
            </Link>
          )}
        </div>

        {/* ── RIGHT PANEL (CHAT) ──────────────────────────────────── */}
        <div style={{
          background: '#0d0d10', border: '0.5px solid rgba(204,0,170,0.15)',
          borderRadius: '8px', display: 'flex', flexDirection: 'column',
          minHeight: '500px', maxHeight: '70vh',
        }}>
          {/* Chat header */}
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(204,0,170,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: TYPE_GRADIENT[strain.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(204,0,170,0.3)' }}>
              <span style={{ fontSize: '16px' }}>{strain.type === 'indica' ? '💜' : strain.type === 'sativa' ? '🌿' : '🧬'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#e8f0ef' }}>{strain.name}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: STATUS_COLORS[status], display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                Online
              </div>
            </div>
            {/* XP multiplier */}
            {multiplier > 1 && (
              <div style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.5px',
                color: '#f0a830', background: 'rgba(240,168,48,0.1)', border: '0.5px solid rgba(240,168,48,0.3)',
                padding: '3px 8px', borderRadius: '3px',
              }}>
                ⚡ {multiplier}× XP
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{strain.type === 'indica' ? '💜' : strain.type === 'sativa' ? '🌿' : '🧬'}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6 }}>
                  <em>&ldquo;{strain.personality.catchphrase}&rdquo;</em>
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e', marginTop: '12px', letterSpacing: '0.5px' }}>
                  Say hello to start chatting
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === 'system') {
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e', letterSpacing: '0.5px' }}>
                      {msg.content}
                    </span>
                  </div>
                )
              }
              const isUser = msg.role === 'user'
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                  {!isUser && (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: TYPE_GRADIENT[strain.type], flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                      {strain.type === 'indica' ? '💜' : strain.type === 'sativa' ? '🌿' : '🧬'}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%', padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser ? 'rgba(0,212,200,0.12)' : 'rgba(204,0,170,0.1)',
                    border: `0.5px solid ${isUser ? 'rgba(0,212,200,0.2)' : 'rgba(204,0,170,0.2)'}`,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {chatLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: TYPE_GRADIENT[strain.type], flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                  {strain.type === 'indica' ? '💜' : strain.type === 'sativa' ? '🌿' : '🧬'}
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'rgba(204,0,170,0.08)', border: '0.5px solid rgba(204,0,170,0.15)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066', letterSpacing: '2px' }}>•••</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(204,0,170,0.1)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={chatPlaceholder}
              disabled={chatLoading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(204,0,170,0.18)',
                borderRadius: '4px', color: '#e8f0ef', padding: '10px 14px',
                fontFamily: 'var(--font-dm-sans)', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={chatLoading || !input.trim()}
              style={{
                padding: '10px 18px', background: chatLoading || !input.trim() ? 'rgba(204,0,170,0.3)' : '#cc00aa',
                border: 'none', borderRadius: '4px', cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#050508',
                letterSpacing: '0.5px', transition: 'all 0.2s',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Local XP lookup to avoid importing server-only index.ts
const XP_EVENTS_LOCAL: Record<string, number> = {
  water: 5, feed: 10, light: 5, flush: 5,
}

