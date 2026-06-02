'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

type GuideStatus = 'none' | 'pending' | 'approved' | 'rejected'

interface GuideRow {
  _id: string
  username: string
  email: string
  avatar: string
  tourGuideStatus: GuideStatus
  tourGuideAppliedAt?: string
  tourGuideApprovedAt?: string
  platformCommission: number
  tourGuideInfo?: {
    bio: string
    languages: string[]
    cities: string[]
    experience: string
  }
}

const STATUS_TABS: { value: 'pending' | 'approved' | 'rejected' | 'all'; label: string }[] = [
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all',      label: 'All' },
]

const STATUS_COLOR: Record<GuideStatus, string> = {
  none:     '#4a6066',
  pending:  '#f0a830',
  approved: '#44cc88',
  rejected: '#cc4444',
}

export default function GuidesClient() {
  const [tab,      setTab]      = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [guides,   setGuides]   = useState<GuideRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commissionEdit, setCommissionEdit] = useState<Record<string, number>>({})
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/guides?status=${tab}`)
      .then(r => r.json())
      .then((d: { guides: GuideRow[] }) => setGuides(d.guides ?? []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  const action = async (id: string, action: 'approve' | 'reject', commission?: number) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/admin/guides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, commission }),
      })
      if (!res.ok) throw new Error()
      toast.success(action === 'approve' ? 'Guide approved ✓' : 'Application rejected')
      load()
    } catch {
      toast.error('Failed to update')
    } finally {
      setActioning(null)
    }
  }

  const btn = (
    label: string,
    onClick: () => void,
    color: string,
    bg: string,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      disabled={disabled || actioning !== null}
      style={{
        padding: '6px 14px', borderRadius: '4px', border: 'none',
        cursor: disabled || actioning !== null ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-mono)', fontSize: '10px', fontWeight: 700,
        background: bg, color, opacity: disabled || actioning !== null ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '0.5px solid rgba(240,168,48,0.15)', paddingBottom: '1px' }}>
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', fontWeight: tab === t.value ? 700 : 400,
              color: tab === t.value ? '#f0a830' : '#4a6066',
              borderBottom: tab === t.value ? '2px solid #f0a830' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>Loading...</div>
      ) : guides.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>
          No {tab === 'all' ? '' : tab} applications.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {guides.map(guide => (
            <div key={guide._id} style={{
              borderRadius: '8px', overflow: 'hidden',
              background: '#0d0d10', border: '0.5px solid rgba(240,168,48,0.15)',
            }}>
              {/* Row header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px', cursor: 'pointer',
                }}
                onClick={() => setExpanded(e => e === guide._id ? null : guide._id)}
              >
                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(240,168,48,0.12)', border: '0.5px solid rgba(240,168,48,0.3)',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-orbitron)', fontSize: '15px', color: '#f0a830',
                }}>
                  {guide.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={guide.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : guide.username.slice(0, 1).toUpperCase()
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef', fontWeight: 700 }}>
                    {guide.username}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                    {guide.email}
                    {guide.tourGuideInfo?.cities?.length ? ` · ${guide.tourGuideInfo.cities.join(', ')}` : ''}
                    {guide.tourGuideInfo?.languages?.length ? ` · ${guide.tourGuideInfo.languages.join('/')}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {guide.tourGuideStatus === 'approved' && (
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                      {guide.platformCommission}% commission
                    </span>
                  )}
                  <span style={{
                    padding: '3px 10px', borderRadius: '10px',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', fontWeight: 700,
                    background: `${STATUS_COLOR[guide.tourGuideStatus]}18`,
                    color: STATUS_COLOR[guide.tourGuideStatus],
                    border: `0.5px solid ${STATUS_COLOR[guide.tourGuideStatus]}40`,
                    textTransform: 'uppercase',
                  }}>
                    {guide.tourGuideStatus}
                  </span>
                  <span style={{ color: '#4a6066', fontSize: '12px' }}>{expanded === guide._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === guide._id && (
                <div style={{
                  padding: '0 18px 18px',
                  borderTop: '0.5px solid rgba(240,168,48,0.1)',
                }}>
                  {guide.tourGuideInfo?.bio && (
                    <div style={{ marginTop: '14px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Bio
                      </div>
                      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6, margin: 0 }}>
                        {guide.tourGuideInfo.bio}
                      </p>
                    </div>
                  )}

                  {guide.tourGuideInfo?.experience && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Experience
                      </div>
                      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6, margin: 0 }}>
                        {guide.tourGuideInfo.experience}
                      </p>
                    </div>
                  )}

                  {guide.tourGuideAppliedAt && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginBottom: '16px' }}>
                      Applied: {new Date(guide.tourGuideAppliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {guide.tourGuideApprovedAt && ` · Approved: ${new Date(guide.tourGuideApprovedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  )}

                  {/* Actions */}
                  {guide.tourGuideStatus === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>Commission %</label>
                        <input
                          type="number" min={0} max={50} step={1}
                          value={commissionEdit[guide._id] ?? 20}
                          onChange={e => setCommissionEdit(prev => ({ ...prev, [guide._id]: Number(e.target.value) }))}
                          style={{
                            width: '60px', padding: '5px 8px', borderRadius: '4px',
                            background: 'rgba(240,168,48,0.08)', border: '0.5px solid rgba(240,168,48,0.3)',
                            color: '#f0a830', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', outline: 'none',
                          }}
                        />
                      </div>
                      {btn('✓ Approve', () => action(guide._id, 'approve', commissionEdit[guide._id] ?? 20), '#050508', '#44cc88', actioning === guide._id)}
                      {btn('✗ Reject', () => action(guide._id, 'reject'), '#e8f0ef', 'rgba(204,68,68,0.2)', actioning === guide._id)}
                    </div>
                  )}

                  {guide.tourGuideStatus === 'approved' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>Commission %</label>
                        <input
                          type="number" min={0} max={50} step={1}
                          value={commissionEdit[guide._id] ?? guide.platformCommission}
                          onChange={e => setCommissionEdit(prev => ({ ...prev, [guide._id]: Number(e.target.value) }))}
                          style={{
                            width: '60px', padding: '5px 8px', borderRadius: '4px',
                            background: 'rgba(240,168,48,0.08)', border: '0.5px solid rgba(240,168,48,0.3)',
                            color: '#f0a830', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', outline: 'none',
                          }}
                        />
                      </div>
                      {btn('Update Commission', () => action(guide._id, 'approve', commissionEdit[guide._id] ?? guide.platformCommission), '#050508', '#f0a830', actioning === guide._id)}
                      {btn('Revoke Access', () => action(guide._id, 'reject'), '#e8f0ef', 'rgba(204,68,68,0.2)', actioning === guide._id)}
                    </div>
                  )}

                  {guide.tourGuideStatus === 'rejected' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>Commission %</label>
                        <input
                          type="number" min={0} max={50} step={1}
                          value={commissionEdit[guide._id] ?? 20}
                          onChange={e => setCommissionEdit(prev => ({ ...prev, [guide._id]: Number(e.target.value) }))}
                          style={{
                            width: '60px', padding: '5px 8px', borderRadius: '4px',
                            background: 'rgba(240,168,48,0.08)', border: '0.5px solid rgba(240,168,48,0.3)',
                            color: '#f0a830', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', outline: 'none',
                          }}
                        />
                      </div>
                      {btn('Approve Now', () => action(guide._id, 'approve', commissionEdit[guide._id] ?? 20), '#050508', '#44cc88')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
