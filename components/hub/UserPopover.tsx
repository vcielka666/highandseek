'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface UserProfile {
  username: string
  avatar: string
  level: number
  bio: string
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing: boolean
  isOwnProfile: boolean
}

export interface UserPopoverLabels {
  follow: string
  unfollow: string
  followers: string
  following: string
  posts: string
  viewProfile: string
}

interface Props {
  username: string
  avatar: string
  level: number
  currentUserId: string
  labels: UserPopoverLabels
  children: React.ReactNode
}

export default function UserPopover({ username, avatar, level, currentUserId, labels, children }: Props) {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOwnProfile = !currentUserId || profile?.isOwnProfile

  const fetchProfile = useCallback(async () => {
    if (profile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/hub/users/${username}`)
      if (res.ok) {
        const data = await res.json() as UserProfile
        setProfile(data)
        setFollowing(data.isFollowing)
        setFollowersCount(data.followersCount)
      }
    } finally {
      setLoading(false)
    }
  }, [username, profile])

  function scheduleOpen() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (!open) {
      setOpen(true)
      fetchProfile()
    }
  }

  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setOpen(false), 180)
  }

  function cancelClose() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }

  // Close on outside click (mobile)
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserId) { window.location.href = '/auth/login'; return }
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/hub/users/${username}/follow`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { following: boolean; followersCount: number }
        setFollowing(data.following)
        setFollowersCount(data.followersCount)
      } else {
        const err = await res.json() as { error?: string }
        toast.error(err.error ?? 'Action failed')
      }
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      // Desktop: hover
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      // Mobile: click
      onClick={(e) => {
        e.stopPropagation()
        if (open) { setOpen(false) } else { setOpen(true); fetchProfile() }
      }}
    >
      {children}

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            zIndex: 200,
            width: '232px',
            background: 'rgba(10,5,18,0.98)',
            border: '0.5px solid rgba(204,0,170,0.3)',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(204,0,170,0.1)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeUp 0.15s ease',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '-5px', left: '18px',
            width: '10px', height: '10px',
            background: 'rgba(10,5,18,0.98)',
            border: '0.5px solid rgba(204,0,170,0.3)',
            transform: 'rotate(45deg)',
            borderRight: 'none', borderBottom: 'none',
            zIndex: 1,
          }} />

          {loading ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textAlign: 'center', padding: '16px 0' }}>
              …
            </div>
          ) : profile ? (
            <>
              {/* Avatar + name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: avatar ? 'transparent' : 'rgba(204,0,170,0.15)',
                  border: '1.5px solid rgba(204,0,170,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#cc00aa',
                  overflow: 'hidden',
                }}>
                  {avatar
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatar} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : username.slice(0, 1).toUpperCase()
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.username}
                  </div>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830', background: 'rgba(240,168,48,0.1)', borderRadius: '3px', padding: '1px 5px' }}>
                    Lv{level}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.55)', lineHeight: 1.5, marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {profile.bio}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                {[
                  { label: labels.followers, value: followersCount },
                  { label: labels.following, value: profile.followingCount },
                  { label: labels.posts,     value: profile.postsCount },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef' }}>{value}</span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#4a6066' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: following ? '#4a6066' : '#050508',
                      background: following ? 'rgba(74,96,102,0.15)' : '#cc00aa',
                      border: `0.5px solid ${following ? 'rgba(74,96,102,0.3)' : 'transparent'}`,
                      borderRadius: '4px', padding: '7px 12px',
                      cursor: followLoading ? 'not-allowed' : 'pointer',
                      opacity: followLoading ? 0.7 : 1,
                    }}
                  >
                    {followLoading ? '…' : following ? labels.unfollow : labels.follow}
                  </button>
                )}
                <a
                  href={`/hub/profile/${username}`}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
                    textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
                    color: '#00d4c8',
                    background: 'rgba(0,212,200,0.08)',
                    border: '0.5px solid rgba(0,212,200,0.2)',
                    borderRadius: '4px', padding: '7px 12px',
                    display: 'block',
                  }}
                >
                  {labels.viewProfile}
                </a>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
