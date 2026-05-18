'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ProfileStatsProps {
  username: string
  isOwnProfile: boolean
  initialFollowing: boolean
  growsCompleted: number
  postsCount: number
  initialFollowersCount: number
  initialFollowingCount: number
  badgesCount: number
  followLabel: string
  unfollowLabel: string
}

export default function ProfileStats({
  username,
  isOwnProfile,
  initialFollowing,
  growsCompleted,
  postsCount,
  initialFollowersCount,
  initialFollowingCount,
  badgesCount,
  followLabel,
  unfollowLabel,
}: ProfileStatsProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
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
    } catch {
      toast.error('Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Follow button — only on other people's profiles */}
      {!isOwnProfile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={handleToggle}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: following ? '#4a6066' : '#cc00aa',
              background: following ? 'rgba(74,96,102,0.1)' : 'rgba(204,0,170,0.1)',
              border: `0.5px solid ${following ? 'rgba(74,96,102,0.3)' : 'rgba(204,0,170,0.3)'}`,
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? '…' : following ? unfollowLabel : followLabel}
          </button>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
            {followersCount} followers
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Grows',     value: growsCompleted },
          { label: 'Posts',     value: postsCount },
          { label: 'Followers', value: followersCount },
          { label: 'Following', value: initialFollowingCount },
          { label: 'Badges',    value: badgesCount },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#e8f0ef' }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{label}</div>
          </div>
        ))}
      </div>
    </>
  )
}
