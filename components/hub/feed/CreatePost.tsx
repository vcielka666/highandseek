'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import type { PostShape } from './PostCard'

export interface CreatePostLabels {
  createPlaceholder: string
  createTitle: string
  publishBtn: string
  mediaCaption: string
  xpPreviewText: (type: string, xp: number) => string
  tagInputPlaceholder: string
  typeText: string
  typePhoto: string
  typeGrowUpdate: string
}

interface CreatePostProps {
  currentUser: { id: string; username: string; avatar: string }
  onPostCreated: (post: PostShape) => void
  labels: CreatePostLabels
}

const XP_BY_TYPE: Record<string, number> = {
  text: 10,
  photo: 20,
  video: 30,
  grow_update: 15,
}

export default function CreatePost({ currentUser, onPostCreated, labels }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectedType = mediaFile
    ? mediaFile.type.startsWith('video/')
      ? 'video'
      : 'photo'
    : 'text'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large — max 100MB')
      return
    }
    setMediaFile(file)
    const url = URL.createObjectURL(file)
    setMediaPreview(url)
  }

  function removeMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit() {
    if (!text.trim() && !mediaFile) {
      toast.error('Add text or a photo')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('type', detectedType)
    if (text.trim()) formData.append('text', text.trim())
    if (mediaFile) formData.append('media', mediaFile)
    if (tags.length > 0) formData.append('tags', tags.join(','))

    try {
      const res = await fetch('/api/hub/posts', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        toast.error(err.error ?? 'Failed to post')
        return
      }
      const data = await res.json() as { post: PostShape & { userId: string } }
      // Shape the post for display
      const shaped: PostShape = {
        ...data.post,
        user: {
          _id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          level: 1,
        },
        isLiked: false,
        isDisliked: false,
      }
      onPostCreated(shaped)
      // Reset
      setText('')
      setTags([])
      setTagInput('')
      setMediaFile(null)
      setMediaPreview(null)
      setIsOpen(false)
    } catch {
      toast.error('Failed to post')
    } finally {
      setUploading(false)
    }
  }

  const xp = XP_BY_TYPE[detectedType] ?? 10

  return (
    <>
      {/* Compact trigger */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '16px',
          background: 'rgba(0,212,200,0.04)', border: '0.5px solid rgba(0,212,200,0.15)',
          borderRadius: '8px', cursor: 'pointer',
        }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: currentUser.avatar ? 'transparent' : '#1a2a2c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#00d4c8',
          overflow: 'hidden',
        }}>
          {currentUser.avatar
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={currentUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : currentUser.username.slice(0, 1).toUpperCase()
          }
        </div>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
          {labels.createPlaceholder}
        </span>
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
          />

          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto',
            background: '#050508',
            borderTop: '0.5px solid rgba(0,212,200,0.25)',
            borderRadius: '12px 12px 0 0',
            zIndex: 1001,
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '32px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8' }}>
                {labels.createTitle}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6066', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '0 16px 24px' }}>
              {/* Textarea */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={labels.createPlaceholder}
                  maxLength={500}
                  rows={4}
                  style={{
                    width: '100%', fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#e8f0ef',
                    background: 'rgba(10,36,40,0.5)', border: '0.5px solid rgba(74,96,102,0.2)',
                    borderRadius: '6px', padding: '10px 12px', resize: 'none', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: text.length > 450 ? '#e03535' : '#4a6066' }}>
                  {500 - text.length}
                </div>
              </div>

              {/* Media upload */}
              {mediaPreview ? (
                <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  {detectedType === 'video'
                    ? <video src={mediaPreview} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    : /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={mediaPreview} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                  }
                  <button
                    onClick={removeMedia}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', color: '#e8f0ef', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1px dashed rgba(0,212,200,0.2)', borderRadius: '6px', padding: '16px',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '12px',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', marginBottom: '4px' }}>
                    📷 Add photo or video
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'rgba(74,96,102,0.6)' }}>
                    {labels.mediaCaption}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Tags */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                    placeholder={labels.tagInputPlaceholder}
                    style={{
                      flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef',
                      background: 'rgba(10,36,40,0.5)', border: '0.5px solid rgba(74,96,102,0.2)',
                      borderRadius: '4px', padding: '6px 10px', outline: 'none',
                    }}
                  />
                </div>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {tags.map(tag => (
                      <span
                        key={tag}
                        onClick={() => removeTag(tag)}
                        style={{
                          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8',
                          background: 'rgba(0,212,200,0.1)', borderRadius: '3px', padding: '2px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        #{tag} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* XP preview */}
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', marginBottom: '12px' }}>
                {labels.xpPreviewText(detectedType, xp)}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={uploading || (!text.trim() && !mediaFile)}
                style={{
                  width: '100%', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '1px',
                  textTransform: 'uppercase', color: '#050508',
                  background: uploading || (!text.trim() && !mediaFile) ? '#4a6066' : '#00d4c8',
                  border: 'none', borderRadius: '4px', padding: '12px',
                  cursor: uploading || (!text.trim() && !mediaFile) ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? '…' : labels.publishBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
