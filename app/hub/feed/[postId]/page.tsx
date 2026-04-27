'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/stores/languageStore'
import PostCard, { type PostShape, type PostCardLabels } from '@/components/hub/feed/PostCard'

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [post, setPost] = useState<PostShape | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [postId, setPostId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setPostId(p.postId))
  }, [params])

  useEffect(() => {
    if (!postId) return
    fetch(`/api/hub/posts/${postId}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json() as Promise<{ post: PostShape }>
      })
      .then(data => {
        if (data) setPost(data.post)
      })
      .finally(() => setLoading(false))
  }, [postId])

  const labels: PostCardLabels = {
    likeBtnLabel: t.feed.likeBtnLabel,
    dislikeBtnLabel: t.feed.dislikeBtnLabel,
    commentBtnLabel: t.feed.commentBtnLabel,
    shareBtnLabel: t.feed.shareBtnLabel,
    shareCopied: t.feed.shareCopied,
    deletePost: t.feed.deletePost,
    confirmDelete: t.feed.confirmDelete,
    commentPlaceholder: t.feed.commentPlaceholder,
    sendComment: t.feed.sendComment,
    showAllComments: t.feed.showAllComments,
    growUpdateLabel: t.feed.growUpdateLabel,
    dayLabel: t.feed.dayLabel,
    noPostsYet: t.feed.noPostsYet,
    viewProfile: t.feed.viewProfile,
    follow: t.feed.followBtn,
    unfollow: t.feed.unfollowBtn,
    followers: t.feed.followers,
    following: t.feed.following,
    posts: t.feed.posts,
  }

  return (
    <div style={{ maxWidth: '640px', padding: '24px' }}>
      <Link
        href="/hub"
        style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}
      >
        {t.feed.backToHub}
      </Link>

      {loading && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', textAlign: 'center', padding: '60px 0' }}>
          …
        </div>
      )}

      {!loading && notFound && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#4a6066', textAlign: 'center', padding: '60px 0' }}>
          {t.feed.postNotFound}
        </div>
      )}

      {!loading && post && (
        <PostCard
          post={post}
          currentUserId={session?.user.id ?? ''}
          labels={labels}
        />
      )}

      {/* Login CTA for guests interacting */}
      {!loading && post && !session && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,212,200,0.04)', border: '0.5px solid rgba(0,212,200,0.15)', borderRadius: '8px', textAlign: 'center' }}>
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
    </div>
  )
}
