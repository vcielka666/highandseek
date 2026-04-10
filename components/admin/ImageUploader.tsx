'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Upload, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  images:   string[]   // array of Cloudinary URLs
  onChange: (urls: string[]) => void
}

function extractPublicId(url: string): string {
  // e.g. https://res.cloudinary.com/xxx/image/upload/v123/highandseek/products/abc.webp
  // → highandseek/products/abc
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/)
  return match ? match[1] : ''
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string[]>([])  // local blob URLs being uploaded
  const [dragging,  setDragging]  = useState(false)

  const upload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const blobUrls  = fileArray.map((f) => URL.createObjectURL(f))

    // Show placeholders immediately
    setUploading((prev) => [...prev, ...blobUrls])

    const results = await Promise.allSettled(
      fileArray.map(async (file, i) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/cloudinary/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Upload failed')
        }
        const { url } = await res.json()
        return { url, blobUrl: blobUrls[i] }
      })
    )

    const newUrls: string[] = []
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        newUrls.push(r.value.url)
        URL.revokeObjectURL(r.value.blobUrl)
      } else {
        toast.error(r.reason?.message ?? 'Upload failed')
      }
    })

    setUploading((prev) => prev.filter((u) => !blobUrls.includes(u)))
    if (newUrls.length) onChange([...images, ...newUrls])
  }

  const remove = async (idx: number) => {
    const url = images[idx]
    const publicId = extractPublicId(url)
    if (publicId) {
      fetch('/api/admin/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      }).catch(() => { /* best effort */ })
    }
    onChange(images.filter((_, i) => i !== idx))
  }

  const move = (from: number, to: number) => {
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }

  const allImages = [
    ...images.map((url, i) => ({ url, type: 'uploaded' as const, idx: i })),
    ...uploading.map((url)   => ({ url, type: 'uploading' as const, idx: -1 })),
  ]

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {allImages.map(({ url, type, idx }, i) => (
            <div key={url} className="relative group rounded overflow-hidden aspect-square"
              style={{ border: `0.5px solid ${i === 0 && type === 'uploaded' ? 'rgba(240,168,48,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                style={{ opacity: type === 'uploading' ? 0.4 : 1 }}
                unoptimized={type === 'uploading'}
              />

              {type === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin" style={{ color: '#f0a830' }} />
                </div>
              )}

              {type === 'uploaded' && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1"
                  style={{ background: 'rgba(5,5,8,0.7)' }}>
                  {/* Main image label */}
                  {idx === 0 && (
                    <span className="text-[9px] self-start px-1 py-0.5 rounded"
                      style={{ background: 'rgba(240,168,48,0.2)', color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
                      MAIN
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-0.5">
                      {idx > 0 && (
                        <button onClick={() => move(idx, idx - 1)} className="p-0.5 rounded hover:bg-white/10" title="Move left">
                          <ArrowLeft size={11} style={{ color: '#e8f0ef' }} />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button onClick={() => move(idx, idx + 1)} className="p-0.5 rounded hover:bg-white/10" title="Move right">
                          <ArrowRight size={11} style={{ color: '#e8f0ef' }} />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => remove(idx)}
                      className="p-0.5 rounded hover:bg-red-900/40"
                      title="Remove"
                    >
                      <X size={12} style={{ color: '#cc00aa' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="cursor-pointer rounded flex flex-col items-center justify-center gap-2 py-6 transition-colors"
        style={{
          border:     `1px dashed ${dragging ? 'rgba(240,168,48,0.5)' : 'rgba(240,168,48,0.2)'}`,
          background: dragging ? 'rgba(240,168,48,0.04)' : 'transparent',
        }}
      >
        <Upload size={20} style={{ color: '#4a6066' }} />
        <p className="text-sm" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}>
          Drop images here or <span style={{ color: '#f0a830' }}>click to browse</span>
        </p>
        <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
          JPEG · PNG · WebP · GIF · max 10MB each
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) { upload(e.target.files); e.target.value = '' } }}
      />

      {images.length > 0 && (
        <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
          First image is used as the main product image. Use arrows to reorder.
        </p>
      )}
    </div>
  )
}
