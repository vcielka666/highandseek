import { connectDB }  from '@/lib/db/connect'
import Tour           from '@/lib/db/models/Tour'
import TourReview     from '@/lib/db/models/TourReview'
import { notFound }   from 'next/navigation'
import Link           from 'next/link'
import BookingWidget  from './BookingWidget'
import MeetingMap     from './MeetingMap'
import type { ITour }       from '@/lib/db/models/Tour'
import type { ITourReview } from '@/lib/db/models/TourReview'

// ─── Types ────────────────────────────────────────────────────────────────────
type TourDoc       = ITour       & { _id: { toString(): string } }
type ReviewDoc     = ITourReview & { _id: { toString(): string } }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= Math.round(rating) ? '#f0a830' : '#4a6066', fontSize: `${size}px` }}>★</span>
      ))}
    </span>
  )
}

const STOP_TYPE_LABEL: Record<string, string> = {
  club:      'Cannabis Club',
  shop:      'CBD Shop',
  viewpoint: 'Viewpoint',
  cafe:      'Café',
  culture:   'Culture',
  other:     'Stop',
}

const STOP_TYPE_COLOR: Record<string, string> = {
  club:      '#8844cc',
  shop:      '#00d4c8',
  viewpoint: '#44cc88',
  cafe:      '#cc6644',
  culture:   '#cc00aa',
  other:     '#4a6066',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TourDetailPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  await connectDB()

  const tourRaw = await Tour.findOne({ slug }).lean<TourDoc>()
  if (!tourRaw) notFound()

  const reviews = await TourReview
    .find({ tourId: tourRaw._id.toString() })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean<ReviewDoc[]>()

  const tour       = tourRaw
  const durationH  = Math.floor(tour.duration / 60)
  const durationM  = tour.duration % 60
  const durationLabel = [
    durationH > 0 ? `${durationH}h` : '',
    durationM > 0 ? `${durationM}m` : '',
  ].filter(Boolean).join(' ')

  const sectionHead: React.CSSProperties = {
    fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '2px',
    textTransform: 'uppercase', color: 'rgba(136,68,204,0.6)', marginBottom: '14px',
    fontWeight: 700,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef' }}>

      {/* ── Breadcrumb ── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid rgba(136,68,204,0.1)',
        background: 'rgba(136,68,204,0.02)',
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/tours" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}>
            Tours
          </Link>
          <span style={{ color: '#4a6066', fontSize: '10px' }}>›</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc' }}>
            {tour.city}
          </span>
          <span style={{ color: '#4a6066', fontSize: '10px' }}>›</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tour.title}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 340px',
          gap: '32px',
          alignItems: 'start',
        }}
          className="tours-detail-grid"
        >
          {/* ════════════════ LEFT COLUMN ════════════════ */}
          <div>
            {/* Cover */}
            <div style={{
              height: 'clamp(220px, 35vw, 360px)', borderRadius: '8px', marginBottom: '28px',
              overflow: 'hidden',
              background: tour.coverImage
                ? `url(${tour.coverImage}) center/cover`
                : 'linear-gradient(135deg, rgba(136,68,204,0.35) 0%, rgba(136,68,204,0.08) 60%, rgba(5,5,8,0) 100%)',
              border: '0.5px solid rgba(136,68,204,0.2)',
              position: 'relative',
            }}>
              {tour.isComingSoon && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    padding: '8px 24px', borderRadius: '20px',
                    border: '0.5px solid rgba(136,68,204,0.4)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
                    letterSpacing: '2px', color: '#8844cc', textTransform: 'uppercase',
                  }}>
                    Coming Soon
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-orbitron)', fontWeight: 700,
              fontSize: 'clamp(20px, 4vw, 28px)', color: '#e8f0ef',
              marginBottom: '14px', lineHeight: 1.2,
            }}>
              {tour.title}
            </h1>

            {/* Badges row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <span style={{
                padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(136,68,204,0.12)', border: '0.5px solid rgba(136,68,204,0.3)',
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc',
              }}>
                📍 {tour.city}, {tour.country}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.2)',
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
                textTransform: 'capitalize',
              }}>
                {tour.category}
              </span>
              {tour.languages.map(lang => (
                <span key={lang} style={{
                  padding: '4px 12px', borderRadius: '20px',
                  background: 'rgba(136,68,204,0.06)', border: '0.5px solid rgba(136,68,204,0.2)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
                }}>
                  {lang}
                </span>
              ))}
            </div>

            {/* Rating */}
            {tour.reviewsCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Stars rating={tour.rating} />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830' }}>
                  {tour.rating.toFixed(1)}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
                  ({tour.reviewsCount} review{tour.reviewsCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Meta row */}
            <div style={{
              display: 'flex', gap: '20px', flexWrap: 'wrap',
              padding: '14px 18px', borderRadius: '6px',
              background: 'rgba(136,68,204,0.04)', border: '0.5px solid rgba(136,68,204,0.12)',
              marginBottom: '28px',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066',
            }}>
              <span>🕐 {durationLabel}</span>
              <span>👥 Max {tour.maxGuests} guests</span>
              <span>🌐 {tour.languages.join(', ')}</span>
              {tour.totalBookings > 0 && <span>✅ {tour.totalBookings} booked</span>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <div style={sectionHead}>About this tour</div>
              <p style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: '14px',
                color: '#4a6066', lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {tour.description || tour.shortDescription}
              </p>
            </div>

            {/* Tour stops */}
            {tour.stops.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={sectionHead}>Tour stops</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tour.stops
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((stop, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '14px', alignItems: 'flex-start',
                        padding: '14px 16px', borderRadius: '6px',
                        background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.12)',
                      }}>
                        {/* Number */}
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: '#8844cc', color: '#050508',
                          fontFamily: 'var(--font-orbitron)', fontSize: '11px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {stop.order}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef', fontWeight: 700 }}>
                              {stop.title}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '9px',
                              fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.5px',
                              background: `${STOP_TYPE_COLOR[stop.type] ?? '#4a6066'}18`,
                              color: STOP_TYPE_COLOR[stop.type] ?? '#4a6066',
                              border: `0.5px solid ${STOP_TYPE_COLOR[stop.type] ?? '#4a6066'}40`,
                            }}>
                              {STOP_TYPE_LABEL[stop.type] ?? stop.type}
                            </span>
                          </div>
                          {stop.description && (
                            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, margin: 0 }}>
                              {stop.description}
                            </p>
                          )}
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '6px' }}>
                            ⏱ ~{stop.duration} min
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Included / Not included */}
            {(tour.included.length > 0 || tour.notIncluded.length > 0) && (
              <div style={{ marginBottom: '32px' }}>
                <div style={sectionHead}>What&apos;s included</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {tour.included.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tour.included.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#44cc88', flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', lineHeight: 1.5 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tour.notIncluded.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tour.notIncluded.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#4a6066', flexShrink: 0 }}>✗</span>
                          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.5 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {tour.requirements.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={sectionHead}>Requirements</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tour.requirements.map((req, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#f0a830', flexShrink: 0 }}>⚠</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.5 }}>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={sectionHead}>Recent reviews</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.slice(0, 5).map(review => (
                    <div key={review._id.toString()} style={{
                      padding: '14px 16px', borderRadius: '6px',
                      background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.12)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#e8f0ef', fontWeight: 700 }}>
                              {review.guestName}
                            </span>
                            {review.verified && (
                              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc' }}>✓ verified</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                          <Stars rating={review.rating} size={11} />
                          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                            {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.text && (
                        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', lineHeight: 1.6, margin: 0 }}>
                          {review.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting point map */}
            {(tour.meetingPoint.lat || tour.meetingPoint.address) && (
              <div style={{ marginBottom: '32px' }}>
                <div style={sectionHead}>Meeting point</div>
                {tour.meetingPoint.address && (
                  <p style={{
                    fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
                    color: '#4a6066', marginBottom: '12px', lineHeight: 1.6,
                  }}>
                    📍 {tour.meetingPoint.address}
                    {tour.meetingPoint.description && ` — ${tour.meetingPoint.description}`}
                  </p>
                )}
                <MeetingMap
                  lat={tour.meetingPoint.lat}
                  lng={tour.meetingPoint.lng}
                  address={tour.meetingPoint.address}
                />
              </div>
            )}
          </div>

          {/* ════════════════ RIGHT COLUMN — Sticky booking widget ════════════════ */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <BookingWidget
              tourSlug={tour.slug}
              tourTitle={tour.title}
              priceEur={tour.price.eur}
              priceCredits={tour.price.credits}
              hostName={tour.host.name}
              hostAvatar={tour.host.avatar}
              hostBio={tour.host.bio}
              hostVerified={tour.host.verified}
            />
          </div>
        </div>
      </div>

      {/* Responsive grid style override — stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .tours-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
