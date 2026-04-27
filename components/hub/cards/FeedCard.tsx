'use client'

import { useState, useEffect, useCallback } from 'react'
import PostCard, { type PostShape, type PostCardLabels } from '../feed/PostCard'
import CreatePost, { type CreatePostLabels } from '../feed/CreatePost'

export interface FeedPreviewData {
  recentPosts: Array<{
    _id: string
    type: string
    content: { mediaUrl?: string; mediaType: string | null; text?: string }
    user: { username: string; avatar: string }
    likesCount: number
    createdAt: string
  }>
  newPostsCount: number
  followerAvatars: Array<{ username: string; avatar: string }>
  totalFollowing: number
}

interface FeedCardLabels {
  title: string
  newPosts: (n: number) => string
  followingLabel: (n: number) => string
  exploreLabel: string
  noFeedLabel: string
  createPlaceholder: string
  createTitle: string
  publishBtn: string
  mediaCaption: string
  xpPreviewText: (type: string, xp: number) => string
  tagInputPlaceholder: string
  typeText: string
  typePhoto: string
  typeGrowUpdate: string
  loadMore: string
  feedEmpty: string
  popularFeed: string
  likeBtnLabel: string
  dislikeBtnLabel: string
  commentBtnLabel: string
  shareBtnLabel: string
  shareCopied: string
  deletePost: string
  confirmDelete: string
  commentPlaceholder: string
  sendComment: string
  showAllComments: (n: number) => string
  growUpdateLabel: string
  dayLabel: string
  noPostsYet: string
  viewProfile: string
  followBtn: string
  unfollowBtn: string
  followers: string
  following: string
  posts: string
}

interface Props {
  feedPreview: FeedPreviewData | null
  currentUser: { id: string; username: string; avatar: string }
  expanded?: boolean
  labels: FeedCardLabels
}

interface FeedResponse {
  posts: PostShape[]
  nextCursor: string | null
  isPersonalized: boolean
}

export default function FeedCard({ feedPreview, currentUser, expanded = false, labels }: Props) {
  const [posts, setPosts] = useState<PostShape[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isPersonalized, setIsPersonalized] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const postCardLabels: PostCardLabels = {
    likeBtnLabel: labels.likeBtnLabel,
    dislikeBtnLabel: labels.dislikeBtnLabel,
    commentBtnLabel: labels.commentBtnLabel,
    shareBtnLabel: labels.shareBtnLabel,
    shareCopied: labels.shareCopied,
    deletePost: labels.deletePost,
    confirmDelete: labels.confirmDelete,
    commentPlaceholder: labels.commentPlaceholder,
    sendComment: labels.sendComment,
    showAllComments: labels.showAllComments,
    growUpdateLabel: labels.growUpdateLabel,
    dayLabel: labels.dayLabel,
    noPostsYet: labels.noPostsYet,
    viewProfile: labels.viewProfile,
    follow: labels.followBtn,
    unfollow: labels.unfollowBtn,
    followers: labels.followers,
    following: labels.following,
    posts: labels.posts,
  }

  const createPostLabels: CreatePostLabels = {
    createPlaceholder: labels.createPlaceholder,
    createTitle: labels.createTitle,
    publishBtn: labels.publishBtn,
    mediaCaption: labels.mediaCaption,
    xpPreviewText: labels.xpPreviewText,
    tagInputPlaceholder: labels.tagInputPlaceholder,
    typeText: labels.typeText,
    typePhoto: labels.typePhoto,
    typeGrowUpdate: labels.typeGrowUpdate,
  }

  const loadFeed = useCallback(async (cursor?: string) => {
    setLoading(true)
    try {
      const url = cursor ? `/api/hub/feed?cursor=${cursor}&limit=10` : '/api/hub/feed?limit=10'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json() as FeedResponse
      if (cursor) {
        setPosts(prev => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }
      setNextCursor(data.nextCursor)
      setIsPersonalized(data.isPersonalized)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (expanded && !initialized) {
      loadFeed()
    }
  }, [expanded, initialized, loadFeed])

  function handlePostCreated(post: PostShape) {
    setPosts(prev => [post, ...prev])
  }

  function handlePostDeleted(id: string) {
    setPosts(prev => prev.filter(p => p._id !== id))
  }

  // Preview state
  if (!expanded) {
    const hasFollowing = feedPreview && feedPreview.totalFollowing > 0
    const previewPosts = feedPreview?.recentPosts ?? []
    const featuredPost = previewPosts[0] ?? null
    const hasFeaturedImage = featuredPost?.content.mediaType === 'image' && featuredPost.content.mediaUrl

    function timeAgo(iso: string) {
      const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
      if (secs < 60)  return `${secs}s`
      if (secs < 3600) return `${Math.floor(secs / 60)}m`
      if (secs < 86400) return `${Math.floor(secs / 3600)}h`
      return `${Math.floor(secs / 86400)}d`
    }

    /* ── No posts at all — truly empty platform ── */
    if (!featuredPost) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 13px 10px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.7)' }}>
              {labels.title}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>
              {labels.noFeedLabel}
            </div>
            <a
              href="/hub/feed/explore"
              onClick={e => e.stopPropagation()}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', textDecoration: 'none', letterSpacing: '0.5px' }}
            >
              {labels.exploreLabel}
            </a>
          </div>
        </div>
      )
    }

    /* ── Featured post preview (always shown, with discover CTA when not following) ── */
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Full-bleed background — featured post image or gradient */}
        {hasFeaturedImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={featuredPost.content.mediaUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'saturate(0.8)' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(204,0,170,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(0,212,200,0.07) 0%, transparent 60%)' }} />
        )}

        {/* Top-to-bottom gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,8,0.88) 0%, rgba(5,5,8,0.25) 45%, rgba(5,5,8,0.0) 65%)' }} />

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(5,5,8,0.97) 0%, rgba(5,5,8,0.65) 40%, transparent 100%)' }} />

        {/* Content layer */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 13px 8px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.7)' }}>
              {labels.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {!hasFollowing && (
                <a
                  href="/hub/feed/explore"
                  onClick={e => e.stopPropagation()}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#00d4c8', textDecoration: 'none', letterSpacing: '0.3px', background: 'rgba(0,212,200,0.08)', border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '8px', padding: '2px 6px' }}
                >
                  {labels.exploreLabel}
                </a>
              )}
              {feedPreview && feedPreview.newPostsCount > 0 && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#cc00aa', background: 'rgba(204,0,170,0.15)', borderRadius: '10px', padding: '2px 7px', border: '0.5px solid rgba(204,0,170,0.3)' }}>
                  {labels.newPosts(feedPreview.newPostsCount)}
                </span>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Teaser section */}
          <div style={{ padding: '0 13px 10px', flexShrink: 0 }}>
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#1a2a2c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {featuredPost.user.avatar
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={featuredPost.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '6px', color: '#00d4c8' }}>{featuredPost.user.username.slice(0, 1).toUpperCase()}</span>
                }
              </div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'rgba(232,240,239,0.6)' }}>
                {featuredPost.user.username}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066' }}>
                · {timeAgo(featuredPost.createdAt)}
              </span>
              {featuredPost.likesCount > 0 && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(204,0,170,0.6)', marginLeft: 'auto' }}>
                  ♥ {featuredPost.likesCount}
                </span>
              )}
            </div>

            {/* Post teaser text */}
            {featuredPost.content.text && (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(232,240,239,0.75)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, marginBottom: '10px' }}>
                {featuredPost.content.text}
              </div>
            )}
            {!featuredPost.content.text && hasFeaturedImage && (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: 'rgba(232,240,239,0.35)', marginBottom: '10px' }}>
                📷
              </div>
            )}

            {/* Footer — follower avatars (or post count when not following) + thumbnail strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {hasFollowing && feedPreview && feedPreview.followerAvatars.length > 0 ? (
                  <>
                    <div style={{ display: 'flex' }}>
                      {feedPreview.followerAvatars.slice(0, 4).map((u, i) => (
                        <div
                          key={u.username}
                          style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: u.avatar ? 'transparent' : '#1a2a2c',
                            border: '1.5px solid rgba(5,5,8,0.9)',
                            marginLeft: i > 0 ? '-5px' : 0,
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {u.avatar
                            ? /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '5px', color: '#00d4c8' }}>{u.username.slice(0, 1).toUpperCase()}</span>
                          }
                        </div>
                      ))}
                    </div>
                    {feedPreview.totalFollowing > 4 && (
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066' }}>
                        {labels.followingLabel(feedPreview.totalFollowing - 4)}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: '#4a6066', letterSpacing: '0.3px' }}>
                    🔥 {labels.popularFeed.split(' ').slice(0, 2).join(' ')}
                  </span>
                )}
              </div>

              {/* Tiny thumbnail strip of other posts */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {previewPosts.slice(1, 4).map((p, i) => {
                  const hasImg = p.content.mediaType === 'image' && p.content.mediaUrl
                  return (
                    <div key={i} style={{ width: '28px', height: '28px', borderRadius: '3px', overflow: 'hidden', background: hasImg ? '#0a1a1c' : 'rgba(204,0,170,0.08)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                      {hasImg
                        ? /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.content.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '6px', color: 'rgba(232,240,239,0.3)', overflow: 'hidden', lineHeight: 1.2, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical' as const }}>
                              {p.content.text ?? ''}
                            </div>
                          </div>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expanded state
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 40px', minHeight: '100%' }}>
      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.55)', marginBottom: '16px' }}>
        {labels.title}
      </div>

      <CreatePost
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
        labels={createPostLabels}
      />

      {!isPersonalized && initialized && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginBottom: '12px', padding: '8px 12px', background: 'rgba(0,212,200,0.04)', borderRadius: '6px', textAlign: 'center' }}>
          {labels.popularFeed}
        </div>
      )}

      {!initialized && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '40px 0' }}>
          …
        </div>
      )}

      {initialized && posts.length === 0 && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '40px 0' }}>
          {labels.feedEmpty}
        </div>
      )}

      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={currentUser.id}
          onDelete={handlePostDeleted}
          labels={postCardLabels}
        />
      ))}

      {nextCursor && (
        <button
          onClick={() => loadFeed(nextCursor)}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: 'rgba(0,212,200,0.06)',
            border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '6px', cursor: 'pointer',
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8', marginTop: '8px',
          }}
        >
          {loading ? '…' : labels.loadMore}
        </button>
      )}
    </div>
  )
}
