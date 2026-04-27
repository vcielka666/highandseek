'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'
import type { PostShape } from '@/components/hub/feed/PostCard'

interface ExploreResponse {
  posts: PostShape[]
  nextCursor: string | null
}

export default function ExplorePage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [posts, setPosts] = useState<PostShape[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadPosts(cursor?: string) {
    setLoading(true)
    try {
      const url = cursor ? `/api/hub/feed/explore?cursor=${cursor}&limit=20` : '/api/hub/feed/explore?limit=20'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json() as ExploreResponse
      if (cursor) {
        setPosts(prev => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ maxWidth: '900px', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/hub"
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}
        >
          {t.feed.backToHub}
        </Link>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, color: '#e8f0ef', marginBottom: '6px' }}>
          {t.feed.exploreTitle}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
          {t.feed.exploreSub}
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '60px 0' }}>
          …
        </div>
      ) : posts.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '60px 0' }}>
          {t.feed.exploreEmpty}
        </div>
      ) : (
        <>
          {/* Masonry-like grid */}
          <div style={{ columns: '3', columnGap: '8px' }}>
            {posts.map(post => (
              <div key={post._id} style={{ breakInside: 'avoid', marginBottom: '8px' }}>
                <a
                  href={`/hub/feed/${post._id}`}
                  style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', textDecoration: 'none', background: 'rgba(13,0,20,0.6)', border: '0.5px solid rgba(204,0,170,0.12)', position: 'relative' }}
                >
                  {post.content.mediaUrl && post.content.mediaType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.content.mediaUrl}
                      alt=""
                      style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                    />
                  ) : post.content.mediaType === 'video' && post.content.mediaUrl ? (
                    <video
                      src={post.content.mediaUrl}
                      style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }}
                      muted
                      playsInline
                    />
                  ) : (
                    <div style={{ padding: '16px', minHeight: '80px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: 'rgba(232,240,239,0.8)', lineHeight: 1.5 }}>
                        {post.content.text?.slice(0, 120)}{(post.content.text?.length ?? 0) > 120 ? '…' : ''}
                      </div>
                    </div>
                  )}

                  {/* Overlay info */}
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: '#1a2a2c',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-orbitron)', fontSize: '7px', color: '#00d4c8',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {post.user.avatar
                          ? /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={post.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : post.user.username.slice(0, 1).toUpperCase()
                        }
                      </div>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#e8f0ef' }}>
                        {post.user.username}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      👍 {post.likesCount}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={() => loadPosts(nextCursor)}
                disabled={loading}
                style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8',
                  background: 'rgba(0,212,200,0.06)', border: '0.5px solid rgba(0,212,200,0.2)',
                  borderRadius: '6px', padding: '10px 24px', cursor: 'pointer',
                }}
              >
                {loading ? '…' : t.feed.loadMore}
              </button>
            </div>
          )}

          {/* Login CTA for non-authed users */}
          {!session && (
            <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,212,200,0.04)', border: '0.5px solid rgba(0,212,200,0.15)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', marginBottom: '12px' }}>
                {t.feed.exploreJoinText}
              </div>
              <a
                href="/auth/register"
                style={{ fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '9px 20px', textDecoration: 'none', display: 'inline-block' }}
              >
                {t.feed.signUpFree}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
