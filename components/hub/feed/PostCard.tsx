'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import UserPopover, { type UserPopoverLabels } from '@/components/hub/UserPopover'

export interface PostShape {
  _id: string
  type: string
  content: {
    text?: string
    mediaUrl?: string
    mediaThumbnail?: string
    mediaType: string | null
    mediaWidth?: number
    mediaHeight?: number
    duration?: number
  }
  growUpdate?: {
    day: number
    stage: string
    health: number
    strainName: string
    metrics: { temperature?: number; humidity?: number; ph?: number }
  }
  tags: string[]
  likesCount: number
  dislikesCount: number
  commentsCount: number
  isLiked: boolean
  isDisliked: boolean
  createdAt: string
  user: { _id: string; username: string; avatar: string; level: number }
}

export interface PostCardLabels {
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
  follow: string
  unfollow: string
  followers: string
  following: string
  posts: string
}

interface CommentShape {
  _id: string
  text: string
  likesCount: number
  isLiked: boolean
  createdAt: string
  user: { _id: string; username: string; avatar: string; level: number }
}

interface PostCardProps {
  post: PostShape
  currentUserId: string
  onDelete?: (id: string) => void
  labels: PostCardLabels
}

export default function PostCard({ post, currentUserId, onDelete, labels }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked)
  const [disliked, setDisliked] = useState(post.isDisliked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [dislikesCount, setDislikesCount] = useState(post.dislikesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<CommentShape[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)

  if (deleted) return null

  const isOwn = post.user._id === currentUserId
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  async function handleLike() {
    const res = await fetch(`/api/hub/posts/${post._id}/like`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { liked: boolean; likesCount: number }
      setLiked(data.liked)
      setLikesCount(data.likesCount)
      if (data.liked && disliked) setDisliked(false)
    }
  }

  async function handleDislike() {
    const res = await fetch(`/api/hub/posts/${post._id}/dislike`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { disliked: boolean; dislikesCount: number }
      setDisliked(data.disliked)
      setDislikesCount(data.dislikesCount)
      if (data.disliked && liked) setLiked(false)
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/hub/feed/${post._id}`
    await navigator.clipboard.writeText(url)
    toast.success(labels.shareCopied)
  }

  async function handleDelete() {
    if (!confirm(labels.confirmDelete)) return
    const res = await fetch(`/api/hub/posts/${post._id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleted(true)
      onDelete?.(post._id)
    }
  }

  async function toggleComments() {
    if (!commentsOpen && comments.length === 0) {
      setLoadingComments(true)
      const res = await fetch(`/api/hub/posts/${post._id}/comments?limit=5`)
      if (res.ok) {
        const data = await res.json() as { comments: CommentShape[]; nextCursor: string | null }
        setComments(data.comments)
        if (!data.nextCursor) setAllCommentsLoaded(true)
      }
      setLoadingComments(false)
    }
    setCommentsOpen(v => !v)
  }

  async function loadAllComments() {
    setLoadingComments(true)
    const res = await fetch(`/api/hub/posts/${post._id}/comments?limit=100`)
    if (res.ok) {
      const data = await res.json() as { comments: CommentShape[] }
      setComments(data.comments)
      setAllCommentsLoaded(true)
    }
    setLoadingComments(false)
  }

  async function sendComment() {
    if (!commentText.trim()) return
    setSendingComment(true)
    const res = await fetch(`/api/hub/posts/${post._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText.trim() }),
    })
    if (res.ok) {
      const data = await res.json() as { comment: CommentShape }
      setComments(prev => [data.comment, ...prev])
      setCommentsCount(c => c + 1)
      setCommentText('')
    }
    setSendingComment(false)
  }

  async function deleteComment(commentId: string) {
    const res = await fetch(`/api/hub/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => prev.filter(c => c._id !== commentId))
      setCommentsCount(c => Math.max(0, c - 1))
    }
  }

  const healthColor = (post.growUpdate?.health ?? 100) > 60
    ? '#56c254'
    : (post.growUpdate?.health ?? 100) > 30
      ? '#f0a830'
      : '#e03535'

  return (
    <div style={{
      background: 'rgba(13,0,20,0.6)',
      border: '0.5px solid rgba(204,0,170,0.12)',
      borderRadius: '8px',
      marginBottom: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 8px', position: 'relative' }}>
        {/* Avatar + username — wrapped in UserPopover */}
        <UserPopover
          username={post.user.username}
          avatar={post.user.avatar}
          level={post.user.level}
          currentUserId={currentUserId}
          labels={{
            follow: labels.follow,
            unfollow: labels.unfollow,
            followers: labels.followers,
            following: labels.following,
            posts: labels.posts,
            viewProfile: labels.viewProfile,
          }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: post.user.avatar ? 'transparent' : '#1a2a2c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-orbitron)', fontSize: '14px', fontWeight: 700, color: '#00d4c8',
            overflow: 'hidden', cursor: 'pointer',
          }}>
            {post.user.avatar
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={post.user.avatar} alt={post.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : post.user.username.slice(0, 1).toUpperCase()
            }
          </div>
        </UserPopover>

        {/* Username + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPopover
              username={post.user.username}
              avatar={post.user.avatar}
              level={post.user.level}
              currentUserId={currentUserId}
              labels={{
                follow: labels.follow,
                unfollow: labels.unfollow,
                followers: labels.followers,
                following: labels.following,
                posts: labels.posts,
                viewProfile: labels.viewProfile,
              }}
            >
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 700, color: '#00d4c8', cursor: 'pointer' }}>
                {post.user.username}
              </span>
            </UserPopover>
            <span style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#f0a830',
              background: 'rgba(240,168,48,0.1)', borderRadius: '3px', padding: '1px 4px',
            }}>
              Lv{post.user.level}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '1px' }}>
            {timeAgo}
          </div>
        </div>

        {/* Menu (own posts) */}
        {isOwn && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: '#4a6066', cursor: 'pointer', fontSize: '16px', padding: '4px 8px', borderRadius: '4px' }}
            >
              ···
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 10,
                background: '#0d0d12', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', overflow: 'hidden', minWidth: '140px',
              }}>
                <button
                  onClick={() => { setMenuOpen(false); handleDelete() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e03535' }}
                >
                  {labels.deletePost}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grow update block */}
      {post.type === 'grow_update' && post.growUpdate && (
        <div style={{
          margin: '0 12px 8px',
          background: 'rgba(0,212,200,0.05)',
          border: '0.5px solid rgba(0,212,200,0.25)',
          borderRadius: '6px', padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px' }}>🌿</span>
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#00d4c8', fontWeight: 700 }}>
              {post.growUpdate.strainName}
            </span>
            <span style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830',
              background: 'rgba(240,168,48,0.1)', borderRadius: '3px', padding: '1px 5px',
            }}>
              {labels.dayLabel} {post.growUpdate.day}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {post.growUpdate.stage.replace('_', ' ')}
          </div>
          {/* Health bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ height: '3px', background: 'rgba(74,96,102,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${post.growUpdate.health}%`, background: healthColor, borderRadius: '2px' }} />
            </div>
          </div>
          {/* Metrics */}
          {(post.growUpdate.metrics.temperature != null || post.growUpdate.metrics.humidity != null || post.growUpdate.metrics.ph != null) && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {post.growUpdate.metrics.temperature != null && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  🌡️ {post.growUpdate.metrics.temperature}°C
                </span>
              )}
              {post.growUpdate.metrics.humidity != null && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  💧 {post.growUpdate.metrics.humidity}%
                </span>
              )}
              {post.growUpdate.metrics.ph != null && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  🔬 pH {post.growUpdate.metrics.ph}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {post.content.mediaType === 'image' && post.content.mediaUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.content.mediaUrl}
            alt=""
            onClick={() => setLightboxOpen(true)}
            style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', background: '#0a1a1c', cursor: 'pointer', display: 'block' }}
          />
          {lightboxOpen && (
            <div
              onClick={() => setLightboxOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.content.mediaUrl}
                alt=""
                style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}

      {post.content.mediaType === 'video' && post.content.mediaUrl && (
        <video
          src={post.content.mediaUrl}
          poster={post.content.mediaThumbnail}
          controls
          loop
          playsInline
          style={{ width: '100%', maxHeight: '500px', background: '#0a1a1c', display: 'block' }}
        />
      )}

      {/* Text */}
      {post.content.text && (
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef', lineHeight: 1.6, padding: '8px 12px' }}>
          {post.content.text}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '4px 12px 8px' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8',
              background: 'rgba(0,212,200,0.1)', borderRadius: '3px', padding: '2px 6px',
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <button
          onClick={handleLike}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: liked ? '#00d4c8' : '#4a6066', padding: 0 }}
        >
          👍 {likesCount}
        </button>
        <button
          onClick={handleDislike}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: disliked ? '#e03535' : '#4a6066', padding: 0 }}
        >
          👎 {dislikesCount}
        </button>
        <button
          onClick={toggleComments}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: commentsOpen ? '#cc00aa' : '#4a6066', padding: 0 }}
        >
          💬 {commentsCount}
        </button>
        <button
          onClick={handleShare}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: 0, marginLeft: 'auto' }}
        >
          📤
        </button>
      </div>

      {/* Comments panel */}
      {commentsOpen && (
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)', padding: '10px 12px' }}>
          {/* Comment input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
              placeholder={labels.commentPlaceholder}
              maxLength={300}
              style={{
                flex: 1, fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef',
                background: 'rgba(10,36,40,0.5)', border: '0.5px solid rgba(74,96,102,0.2)',
                borderRadius: '4px', padding: '6px 10px', outline: 'none',
              }}
            />
            <button
              onClick={sendComment}
              disabled={sendingComment || !commentText.trim()}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#050508',
                background: commentText.trim() ? '#cc00aa' : '#4a6066',
                border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                flexShrink: 0,
              }}
            >
              {labels.sendComment}
            </button>
          </div>

          {/* Comments list */}
          {loadingComments ? (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', padding: '8px 0' }}>…</div>
          ) : (
            <>
              {comments.map(comment => (
                <div key={comment._id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: '#1a2a2c', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-orbitron)', fontSize: '9px', color: '#00d4c8', overflow: 'hidden',
                  }}>
                    {comment.user.avatar
                      ? /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={comment.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : comment.user.username.slice(0, 1).toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 700, color: '#e8f0ef' }}>
                        {comment.user.username}
                      </span>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.8)', lineHeight: 1.4 }}>
                      {comment.text}
                    </div>
                  </div>
                  {comment.user._id === currentUserId && (
                    <button
                      onClick={() => deleteComment(comment._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6066', fontSize: '11px', flexShrink: 0, padding: '0 4px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {commentsCount > comments.length && !allCommentsLoaded && (
                <button
                  onClick={loadAllComments}
                  style={{
                    width: '100%', padding: '8px', background: 'none', border: '0.5px solid rgba(74,96,102,0.2)',
                    borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
                    marginTop: '4px',
                  }}
                >
                  {labels.showAllComments(commentsCount)}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
