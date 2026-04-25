'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import Link from 'next/link'

const BASE_URL = 'https://highandseek.com'

type QREntry = {
  _id: string
  slug: string
  label: string
  targetUrl: string
  isActive: boolean
  totalScans: number
  conversions: number
  lastScan: string | null
  createdAt: string
}

const cellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '13px',
  color: '#e8f0ef',
  borderBottom: '0.5px solid rgba(240,168,48,0.07)',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '9px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#4a6066',
  marginBottom: '6px',
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(10,36,40,0.6)',
  border: '0.5px solid rgba(240,168,48,0.2)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '13px',
  color: '#e8f0ef',
  outline: 'none',
}

export default function QRAdminPage() {
  const [entries, setEntries]   = useState<QREntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<QREntry | null>(null)

  // Form state
  const [slug,      setSlug]      = useState('')
  const [label,     setLabel]     = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  // QR preview ref for download
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/admin/qr')
    const data = await res.json() as { redirects: QREntry[] }
    setEntries(data.redirects ?? [])
    setLoading(false)
  }

  function openCreate() {
    setEditEntry(null)
    setSlug('')
    setLabel('')
    setTargetUrl('')
    setError('')
    setShowForm(true)
  }

  function openEdit(e: QREntry) {
    setEditEntry(e)
    setSlug(e.slug)
    setLabel(e.label)
    setTargetUrl(e.targetUrl)
    setError('')
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      if (editEntry) {
        // PATCH
        const res = await fetch(`/api/admin/qr/${editEntry.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, targetUrl }),
        })
        if (!res.ok) {
          const d = await res.json() as { error: string }
          setError(d.error)
          return
        }
      } else {
        // POST
        const res = await fetch('/api/admin/qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, label, targetUrl }),
        })
        if (!res.ok) {
          const d = await res.json() as { error: string }
          setError(d.error)
          return
        }
      }
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(entry: QREntry) {
    await fetch(`/api/admin/qr/${entry.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !entry.isActive }),
    })
    load()
  }

  function downloadPNG() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const url  = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-${slug || editEntry?.slug}.png`
    link.href = url
    link.click()
  }

  function downloadSVG() {
    const svg = canvasRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `qr-${slug || editEntry?.slug}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const previewSlug = slug || editEntry?.slug || ''
  const qrValue     = `${BASE_URL}/go/${previewSlug}`

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', color: '#f0a830', letterSpacing: '2px', margin: 0 }}>
            QR KÓDY
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', margin: '4px 0 0' }}>
            Dynamické QR presmerovanie s analytikmi
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#f0a830', border: 'none', borderRadius: '4px', padding: '8px 18px', cursor: 'pointer' }}
        >
          + Nový QR
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }}>Načítavam...</div>
      ) : (
        <div style={{ background: 'rgba(6,8,10,0.8)', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(240,168,48,0.15)' }}>
                {['Slug', 'Label', 'Target URL', 'Scany', 'Konverzie', 'Posl. scan', 'Aktívny', ''].map(h => (
                  <th key={h} style={{ ...cellStyle, color: '#4a6066', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono)', fontWeight: 400, textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id} style={{ transition: 'background 0.15s' }} className="hover:bg-[rgba(240,168,48,0.03)]">
                  <td style={cellStyle}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', background: 'rgba(240,168,48,0.08)', borderRadius: '3px', padding: '2px 8px' }}>
                      {e.slug}
                    </span>
                  </td>
                  <td style={cellStyle}>{e.label}</td>
                  <td style={{ ...cellStyle, maxWidth: '220px' }}>
                    <span style={{ fontSize: '11px', color: '#4a6066', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {e.targetUrl}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: '14px' }}>{e.totalScans}</td>
                  <td style={{ ...cellStyle, color: '#00d4c8', fontFamily: 'var(--font-orbitron)', fontSize: '14px' }}>{e.conversions}</td>
                  <td style={{ ...cellStyle, fontSize: '11px', color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                    {e.lastScan ? new Date(e.lastScan).toLocaleDateString('sk-SK') : '—'}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => toggleActive(e)}
                      style={{ background: e.isActive ? 'rgba(0,212,200,0.12)' : 'rgba(74,96,102,0.12)', border: `0.5px solid ${e.isActive ? 'rgba(0,212,200,0.3)' : 'rgba(74,96,102,0.3)'}`, borderRadius: '12px', padding: '3px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: e.isActive ? '#00d4c8' : '#4a6066', cursor: 'pointer' }}
                    >
                      {e.isActive ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(e)} style={{ background: 'transparent', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '3px', padding: '3px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#f0a830', cursor: 'pointer' }}>
                        Upraviť
                      </button>
                      <Link href={`/admin/qr/${e.slug}`} style={{ background: 'transparent', border: '0.5px solid rgba(0,212,200,0.3)', borderRadius: '3px', padding: '3px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', textDecoration: 'none' }}>
                        Štatistiky
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && !loading && (
            <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
              Žiadne QR presmerovanie. Vytvor prvé.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.25)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', color: '#f0a830', letterSpacing: '2px', margin: 0 }}>
              {editEntry ? 'UPRAVIŤ QR' : 'NOVÝ QR'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Slug</label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="go"
                  disabled={!!editEntry}
                  style={{ ...inputStyle, opacity: editEntry ? 0.5 : 1 }}
                />
                {slug && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '4px' }}>URL: {BASE_URL}/go/{slug}</div>}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Label (interný popis)</label>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Vizitka hlavná" style={inputStyle} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Target URL</label>
                <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://highandseek.com" style={inputStyle} />
              </div>
            </div>

            {error && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#cc00aa' }}>✕ {error}</div>}

            {/* QR Preview */}
            {previewSlug && (
              <div style={{ background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '1px' }}>QR NÁHĽAD</div>
                <div ref={canvasRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  {/* Canvas for PNG download */}
                  <div style={{ display: 'none' }}>
                    <QRCodeCanvas value={qrValue} size={300} bgColor="#050508" fgColor="#00d4c8" />
                  </div>
                  {/* SVG for display + SVG download */}
                  <QRCodeSVG value={qrValue} size={160} bgColor="#050508" fgColor="#00d4c8" style={{ border: '1px solid rgba(0,212,200,0.3)', borderRadius: '4px', padding: '8px' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8' }}>{qrValue}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={downloadPNG} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#f0a830', background: 'transparent', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '3px', padding: '5px 12px', cursor: 'pointer' }}>
                    ↓ PNG
                  </button>
                  <button onClick={downloadSVG} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#f0a830', background: 'transparent', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '3px', padding: '5px 12px', cursor: 'pointer' }}>
                    ↓ SVG
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', background: 'transparent', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}>
                Zrušiť
              </button>
              <button onClick={save} disabled={saving || !slug || !label || !targetUrl} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#050508', background: saving ? '#4a6066' : '#f0a830', border: 'none', borderRadius: '4px', padding: '8px 20px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Ukladám...' : 'Uložiť'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
