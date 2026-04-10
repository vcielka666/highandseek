'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Coupon {
  _id: string
  code: string
  discount: number
  isActive: boolean
  maxUsage: number
  usageCount: number
  expiresAt: string | null
  note: string
  createdAt: string
}

const S = {
  label: {
    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1.5px',
    textTransform: 'uppercase' as const, color: '#4a6066', display: 'block', marginBottom: '6px',
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '4px',
    color: '#e8f0ef', padding: '9px 12px', fontFamily: 'var(--font-dm-mono)',
    fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const,
  },
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', discount: '10', maxUsage: '0', expiresAt: '', note: '' })
  const [creating, setCreating] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(data.coupons ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:      form.code,
          discount:  Number(form.discount),
          maxUsage:  Number(form.maxUsage),
          expiresAt: form.expiresAt || null,
          note:      form.note,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      toast.success(`Coupon ${data.coupon.code} created`)
      setForm({ code: '', discount: '10', maxUsage: '0', expiresAt: '', note: '' })
      load()
    } finally {
      setCreating(false)
    }
  }

  async function toggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    if (res.ok) { toast.success(isActive ? 'Deactivated' : 'Activated'); load() }
    else toast.error('Failed')
  }

  async function remove(id: string, code: string) {
    if (!confirm(`Delete coupon ${code}?`)) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); load() }
    else toast.error('Failed')
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: '900px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginBottom: '8px' }}>
        Shop · Discount Coupons
      </div>
      <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', color: '#f0a830', marginBottom: '28px', fontWeight: 700 }}>
        Coupons
      </h1>

      {/* Create form */}
      <div style={{ background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '8px', padding: '20px', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.5)', marginBottom: '16px' }}>
          New coupon
        </div>
        <form onSubmit={create}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={S.label}>Code *</label>
              <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Discount % *</label>
              <input required type="number" min="1" max="100" value={form.discount}
                onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Max uses (0 = unlimited)</label>
              <input type="number" min="0" value={form.maxUsage}
                onChange={e => setForm(p => ({ ...p, maxUsage: e.target.value }))} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Expires (optional)</label>
              <input type="datetime-local" value={form.expiresAt}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={{ ...S.input, colorScheme: 'dark' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={S.label}>Internal note</label>
            <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="e.g. Spring launch campaign" style={S.input} />
          </div>
          <button type="submit" disabled={creating} style={{
            fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
            padding: '9px 20px', background: creating ? '#4a6066' : '#f0a830', border: 'none',
            borderRadius: '4px', color: '#050508', cursor: creating ? 'not-allowed' : 'pointer',
          }}>
            {creating ? 'Creating…' : 'Create coupon'}
          </button>
        </form>
      </div>

      {/* Coupon list */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>Loading…</div>
      ) : coupons.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>No coupons yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {coupons.map(c => (
            <div key={c._id} style={{
              background: 'rgba(5,5,8,0.8)', border: `0.5px solid ${c.isActive ? 'rgba(240,168,48,0.2)' : 'rgba(74,96,102,0.2)'}`,
              borderRadius: '6px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
              opacity: c.isActive ? 1 : 0.5,
            }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '14px', color: c.isActive ? '#f0a830' : '#4a6066', fontWeight: 700, minWidth: '120px' }}>
                {c.code}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }}>
                {c.discount}% off
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                {c.usageCount}{c.maxUsage > 0 ? `/${c.maxUsage}` : ''} uses
              </div>
              {c.expiresAt && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: new Date(c.expiresAt) < new Date() ? 'rgba(255,80,80,0.8)' : '#4a6066' }}>
                  expires {new Date(c.expiresAt).toLocaleDateString('cs-CZ')}
                </div>
              )}
              {c.note && (
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', flex: 1, minWidth: '100px' }}>{c.note}</div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button onClick={() => toggle(c._id, c.isActive)} style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 10px',
                  background: 'transparent', border: `0.5px solid ${c.isActive ? 'rgba(240,168,48,0.4)' : 'rgba(0,212,200,0.3)'}`,
                  borderRadius: '3px', color: c.isActive ? '#f0a830' : '#00d4c8', cursor: 'pointer',
                }}>
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => remove(c._id, c.code)} style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 10px',
                  background: 'transparent', border: '0.5px solid rgba(255,80,80,0.3)',
                  borderRadius: '3px', color: 'rgba(255,80,80,0.8)', cursor: 'pointer',
                }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
