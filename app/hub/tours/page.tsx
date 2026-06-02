'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'

interface TourRow {
  _id: string
  slug: string
  title: string
  city: string
  isActive: boolean
  isComingSoon: boolean
  totalBookings: number
  price: { eur: number }
}

type GuideStatus = 'none' | 'pending' | 'approved' | 'rejected'

const btn: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700,
  letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.15s',
}

export default function GuideDashboard() {
  const { status: sessionStatus } = useSession()

  const [guideStatus, setGuideStatus] = useState<GuideStatus | null>(null)
  const [tours, setTours]     = useState<TourRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch fresh guide status from DB (not JWT) so admin approvals take effect immediately
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return
    fetch('/api/hub/guides/status')
      .then(r => r.json())
      .then((d: { tourGuideStatus?: GuideStatus }) => setGuideStatus(d.tourGuideStatus ?? 'none'))
      .catch(() => setGuideStatus('none'))
  }, [sessionStatus])

  useEffect(() => {
    if (guideStatus !== 'approved') { setLoading(false); return }
    fetch('/api/hub/tours')
      .then(r => r.json())
      .then(d => setTours(d.tours ?? []))
      .catch(() => toast.error('Failed to load tours'))
      .finally(() => setLoading(false))
  }, [guideStatus])

  if (sessionStatus === 'loading' || guideStatus === null) return null

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(slug)
    try {
      const res = await fetch(`/api/hub/tours/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTours(prev => prev.filter(t => t.slug !== slug))
      toast.success('Tour deleted')
    } catch {
      toast.error('Failed to delete tour')
    } finally {
      setDeleting(null)
    }
  }

  const sectionHead: React.CSSProperties = {
    fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '2px',
    textTransform: 'uppercase', color: 'rgba(240,168,48,0.6)', marginBottom: '18px', fontWeight: 700,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef', padding: '40px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link href="/hub" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>
              ← Hub
            </Link>
            <span style={{ color: '#4a6066' }}>›</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830' }}>My Tours</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: '#e8f0ef' }}>
            Guide Dashboard
          </h1>
        </div>

        {/* APPROVED GUIDE: tour list */}
        {guideStatus === 'approved' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={sectionHead}>Your Tours</div>
              <Link href="/hub/tours/new" style={{
                ...btn, background: '#f0a830', color: '#050508',
                textDecoration: 'none', display: 'inline-block',
              }}>
                + New Tour
              </Link>
            </div>

            {loading ? (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>Loading...</div>
            ) : tours.length === 0 ? (
              <div style={{
                padding: '40px', borderRadius: '8px', textAlign: 'center',
                background: '#0d0d10', border: '0.5px solid rgba(240,168,48,0.15)',
              }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#4a6066', marginBottom: '8px' }}>
                  No tours yet
                </div>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '20px' }}>
                  Create your first tour to start hosting guests.
                </p>
                <Link href="/hub/tours/new" style={{
                  ...btn, background: '#f0a830', color: '#050508',
                  textDecoration: 'none', display: 'inline-block',
                }}>
                  Create Your First Tour
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tours.map(tour => (
                  <div key={tour._id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 18px', borderRadius: '8px',
                    background: '#0d0d10', border: '0.5px solid rgba(240,168,48,0.15)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef', fontWeight: 700, marginBottom: '4px' }}>
                        {tour.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                        <span>📍 {tour.city}</span>
                        <span>💶 €{tour.price.eur}/person</span>
                        <span>✅ {tour.totalBookings} bookings</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '10px', fontSize: '9px',
                        fontFamily: 'var(--font-dm-mono)',
                        background: tour.isComingSoon ? 'rgba(240,168,48,0.12)' : tour.isActive ? 'rgba(68,204,136,0.12)' : 'rgba(74,96,102,0.2)',
                        color: tour.isComingSoon ? '#f0a830' : tour.isActive ? '#44cc88' : '#4a6066',
                        border: `0.5px solid ${tour.isComingSoon ? 'rgba(240,168,48,0.3)' : tour.isActive ? 'rgba(68,204,136,0.3)' : 'rgba(74,96,102,0.3)'}`,
                      }}>
                        {tour.isComingSoon ? 'coming soon' : tour.isActive ? 'active' : 'inactive'}
                      </span>
                      <Link href={`/hub/tours/${tour.slug}/edit`} style={{
                        ...btn, padding: '6px 12px', fontSize: '9px',
                        background: 'rgba(240,168,48,0.1)', color: '#f0a830',
                        border: '0.5px solid rgba(240,168,48,0.25)', textDecoration: 'none',
                        display: 'inline-block',
                      }}>
                        Edit
                      </Link>
                      <Link href={`/tours/${tour.slug}`} target="_blank" style={{
                        ...btn, padding: '6px 12px', fontSize: '9px',
                        background: 'rgba(136,68,204,0.1)', color: '#8844cc',
                        border: '0.5px solid rgba(136,68,204,0.25)', textDecoration: 'none',
                        display: 'inline-block',
                      }}>
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(tour.slug, tour.title)}
                        disabled={deleting === tour.slug}
                        style={{
                          ...btn, padding: '6px 12px', fontSize: '9px',
                          background: 'rgba(204,0,0,0.08)', color: '#cc4444',
                          border: '0.5px solid rgba(204,0,0,0.2)',
                          opacity: deleting === tour.slug ? 0.5 : 1,
                        }}
                      >
                        {deleting === tour.slug ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue info */}
            <div style={{
              marginTop: '32px', padding: '18px 20px', borderRadius: '8px',
              background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.15)',
            }}>
              <div style={sectionHead}>Revenue Share</div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.7 }}>
                The platform keeps a commission on each booking. Your personal commission rate is set by the admin team.
                You keep the rest — paid out monthly. Contact support for payout details.
              </p>
            </div>
          </div>
        )}

        {/* PENDING */}
        {guideStatus === 'pending' && (
          <div style={{
            padding: '40px', borderRadius: '8px', textAlign: 'center',
            background: '#0d0d10', border: '0.5px solid rgba(240,168,48,0.25)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '15px', color: '#f0a830', marginBottom: '10px' }}>
              Application Under Review
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', maxWidth: '400px', margin: '0 auto' }}>
              Your guide application is being reviewed by our team. We&apos;ll reach out within 48 hours.
            </p>
          </div>
        )}

        {/* REJECTED */}
        {guideStatus === 'rejected' && (
          <div style={{
            padding: '40px', borderRadius: '8px', textAlign: 'center',
            background: '#0d0d10', border: '0.5px solid rgba(204,0,0,0.2)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>✗</div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '15px', color: '#cc4444', marginBottom: '10px' }}>
              Application Not Approved
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', maxWidth: '400px', margin: '0 auto 20px' }}>
              Your guide application was not approved at this time. You may reapply with more experience.
            </p>
            <Link href="/hub/tours/apply" style={{
              ...btn, background: '#f0a830', color: '#050508', textDecoration: 'none', display: 'inline-block',
            }}>
              Reapply
            </Link>
          </div>
        )}

        {/* NOT APPLIED */}
        {guideStatus === 'none' && (
          <div>
            <div style={{
              padding: '32px', borderRadius: '8px', marginBottom: '24px',
              background: 'linear-gradient(135deg, rgba(240,168,48,0.08) 0%, rgba(240,168,48,0.03) 100%)',
              border: '0.5px solid rgba(240,168,48,0.25)',
            }}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#f0a830', marginBottom: '12px' }}>
                Become a Tour Guide
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066', lineHeight: 1.8, marginBottom: '20px' }}>
                Share your local cannabis knowledge and earn money hosting cultural tours.
                Apply for guide status — our team reviews every application personally.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  ['🧭', 'Host your own tours', 'Set your schedule, city, and price'],
                  ['💶', 'Keep up to 85%', 'Platform takes a small commission per booking'],
                  ['⭐', 'Build reputation', 'Earn reviews and grow your guide profile'],
                  ['🛡️', 'Admin verified', 'Every guide is personally approved by our team'],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{
                    padding: '14px', borderRadius: '6px',
                    background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.12)',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#e8f0ef', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <Link href="/hub/tours/apply" style={{
                ...btn, background: '#f0a830', color: '#050508', textDecoration: 'none', display: 'inline-block',
              }}>
                Apply Now →
              </Link>
            </div>

            <Link href="/tours" style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none',
            }}>
              ← Browse tours as a guest
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
