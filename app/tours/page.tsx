import { connectDB }  from '@/lib/db/connect'
import Tour           from '@/lib/db/models/Tour'
import CannabisSpot   from '@/lib/db/models/CannabisSpot'
import Link           from 'next/link'
import ToursMap       from './ToursMap'
import CityFilter     from './CityFilter'
import ToursWaitlist  from './ToursWaitlist'
import type { ITour }       from '@/lib/db/models/Tour'
import type { ICannabisSpot } from '@/lib/db/models/CannabisSpot'

// ─── Seed fallback (shown when DB is empty) ───────────────────────────────────
const PLACEHOLDER_TOUR: TourCard = {
  _id:              'placeholder',
  slug:             'prague-cannabis-culture-walk',
  title:            'Prague Cannabis Culture Walk',
  city:             'Praha',
  country:          'CZ',
  category:         'walking',
  shortDescription: 'Discover Praha\'s underground cannabis scene — legal spots, chill cafés, culture & history on 3 hours through the old city.',
  coverImage:       '',
  duration:         180,
  maxGuests:        8,
  languages:        ['EN', 'CS'],
  price:            { eur: 39, czk: 950, credits: 250 },
  rating:           4.8,
  reviewsCount:     12,
  isComingSoon:     false,
  isActive:         true,
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TourCard {
  _id:              string
  slug:             string
  title:            string
  city:             string
  country:          string
  category:         string
  shortDescription: string
  coverImage:       string
  duration:         number
  maxGuests:        number
  languages:        string[]
  price:            { eur: number; czk: number; credits: number }
  rating:           number
  reviewsCount:     number
  isComingSoon:     boolean
  isActive:         boolean
}

interface SpotData {
  id:      string
  name:    string
  type:    string
  address: string
  lat:     number
  lng:     number
}

interface StopData {
  id:        string
  title:     string
  type:      string
  lat:       number
  lng:       number
  tourTitle: string
}

// ─── Star rating helper ───────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ letterSpacing: '1px' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= Math.round(rating) ? '#f0a830' : '#4a6066', fontSize: '11px' }}>★</span>
      ))}
    </span>
  )
}

// ─── Tour Card ────────────────────────────────────────────────────────────────
function TourCard({ tour }: { tour: TourCard }) {
  const durationH = Math.floor(tour.duration / 60)
  const durationM = tour.duration % 60

  return (
    <Link
      href={tour.isComingSoon ? '#' : `/tours/${tour.slug}`}
      style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
    >
      <div style={{
        background: '#0d0d10',
        border: '0.5px solid rgba(136,68,204,0.18)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: tour.isComingSoon ? 'default' : 'pointer',
      }}>
        {/* Cover image / gradient placeholder */}
        <div style={{
          height: '180px', position: 'relative',
          background: tour.coverImage
            ? `url(${tour.coverImage}) center/cover`
            : 'linear-gradient(135deg, rgba(136,68,204,0.3) 0%, rgba(136,68,204,0.06) 60%, rgba(5,5,8,0) 100%)',
        }}>
          {/* City badge */}
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(136,68,204,0.75)', backdropFilter: 'blur(4px)',
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
            color: '#e8f0ef', textTransform: 'uppercase',
          }}>
            {tour.city}
          </div>

          {/* Category badge */}
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(4px)',
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px',
            color: '#4a6066', textTransform: 'uppercase',
          }}>
            {tour.category}
          </div>

          {/* Coming soon overlay */}
          {tour.isComingSoon && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(5,5,8,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                padding: '6px 18px', borderRadius: '20px',
                border: '0.5px solid rgba(136,68,204,0.4)',
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
                letterSpacing: '2px', color: '#8844cc', textTransform: 'uppercase',
              }}>
                Coming Soon
              </div>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '16px 18px' }}>
          <h3 style={{
            fontFamily: 'var(--font-orbitron)', fontWeight: 700,
            fontSize: '14px', color: '#e8f0ef', marginBottom: '6px', lineHeight: 1.35,
          }}>
            {tour.title}
          </h3>

          <p style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '12px',
            color: '#4a6066', lineHeight: 1.6, marginBottom: '12px',
            display: '-webkit-box', overflow: 'hidden',
          } as React.CSSProperties}>
            {tour.shortDescription}
          </p>

          {/* Meta row */}
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066',
            marginBottom: '12px',
          }}>
            <span>🕐 {durationH > 0 ? `${durationH}h` : ''}{durationM > 0 ? ` ${durationM}m` : ''}</span>
            <span>👥 Max {tour.maxGuests}</span>
            <span>🌐 {tour.languages.join(', ')}</span>
          </div>

          {/* Rating + Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stars rating={tour.rating} />
              {tour.reviewsCount > 0 && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  ({tour.reviewsCount})
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: 'var(--font-orbitron)', fontSize: '16px',
                fontWeight: 700, color: '#8844cc',
              }}>
                €{tour.price.eur}
              </span>
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '4px',
              }}>
                / person
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ToursPage() {
  let tours:    TourCard[] = []
  let spots:    SpotData[] = []
  let tourStops: StopData[] = []
  let dbError = false

  try {
    await connectDB()

    const [rawTours, rawSpots] = await Promise.all([
      Tour.find({ $or: [{ isActive: true }, { isComingSoon: true }] })
        .sort({ isFeatured: -1, isComingSoon: 1, createdAt: -1 })
        .limit(20)
        .lean<(ITour & { _id: { toString(): string } })[]>(),

      CannabisSpot.find({ isActive: true })
        .limit(50)
        .lean<(ICannabisSpot & { _id: { toString(): string } })[]>(),
    ])

    tours = rawTours.map(t => ({
      _id:              t._id.toString(),
      slug:             t.slug,
      title:            t.title,
      city:             t.city,
      country:          t.country,
      category:         t.category,
      shortDescription: t.shortDescription,
      coverImage:       t.coverImage ?? '',
      duration:         t.duration,
      maxGuests:        t.maxGuests,
      languages:        t.languages,
      price:            t.price,
      rating:           t.rating,
      reviewsCount:     t.reviewsCount,
      isComingSoon:     t.isComingSoon,
      isActive:         t.isActive,
    }))

    spots = rawSpots.map(s => ({
      id:      s._id.toString(),
      name:    s.name,
      type:    s.type,
      address: s.address,
      lat:     s.lat,
      lng:     s.lng,
    }))

    // Collect tour stops for map markers
    tourStops = rawTours.flatMap(t =>
      (t.stops ?? [])
        .filter(stop => stop.lat && stop.lng)
        .map((stop, i) => ({
          id:        `${t._id.toString()}-${i}`,
          title:     stop.title,
          type:      stop.type,
          lat:       stop.lat,
          lng:       stop.lng,
          tourTitle: t.title,
        }))
    )
  } catch {
    dbError = true
  }

  // Fallback placeholder when DB is empty
  if (!dbError && tours.length === 0) {
    tours = [PLACEHOLDER_TOUR]
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef' }}>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', padding: 'clamp(60px,10vw,100px) 24px 48px',
        textAlign: 'center', overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(136,68,204,0.18) 0%, transparent 70%)',
        }} />
        {/* Scanline-style grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(136,68,204,0.04) 1px, transparent 1px)',
          backgroundSize: '100% 28px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', marginBottom: '16px',
            padding: '4px 14px', borderRadius: '20px',
            background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.3)',
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px',
            color: '#8844cc', textTransform: 'uppercase',
          }}>
            High &amp; Seek · Tours
          </div>

          <h1 style={{
            fontFamily: 'var(--font-orbitron)', fontWeight: 900,
            fontSize: 'clamp(28px, 7vw, 56px)', letterSpacing: '4px',
            color: '#e8f0ef', textTransform: 'uppercase', marginBottom: '12px',
            lineHeight: 1.05,
          }}>
            City Canna<br />
            <span style={{ color: '#8844cc' }}>Tours</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '13px',
            letterSpacing: '1px', color: '#4a6066', marginBottom: '36px',
          }}>
            Cannabis culture · Local guides · City vibes
          </p>

          {/* City pills */}
          <CityFilter />

          {/* Legal disclaimer */}
          <p style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '11px',
            color: '#4a6066', maxWidth: '480px', margin: '0 auto',
            lineHeight: 1.6, opacity: 0.75,
          }}>
            High &amp; Seek provides cultural and educational cannabis tourism experiences.
            All activities comply with local laws. 18+ only.
          </p>
        </div>
      </section>

      {/* ── Map ── */}
      <section style={{ padding: '0 24px 48px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{
          height: 'clamp(260px, 35vw, 420px)',
          borderRadius: '8px', overflow: 'hidden',
          border: '0.5px solid rgba(136,68,204,0.18)',
        }}>
          <ToursMap
            spots={spots}
            tourStops={tourStops}
            defaultLat={50.0755}
            defaultLng={14.4378}
          />
        </div>

        {/* Map legend */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px',
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '0.5px',
        }}>
          {[
            { color: '#8844cc', label: 'Cannabis Club' },
            { color: '#00d4c8', label: 'CBD Shop' },
            { color: '#f0a830', label: 'Smoke Friendly' },
            { color: '#44cc88', label: 'Grow Shop' },
            { color: '#cc6644', label: 'Café' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              {label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8844cc', transform: 'rotate(45deg)' }} />
            Tour Stop
          </div>
        </div>
      </section>

      {/* ── Tour Cards ── */}
      <section style={{ padding: '0 24px 64px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '20px', gap: '12px', flexWrap: 'wrap',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-orbitron)', fontWeight: 700,
            fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: '#e8f0ef',
          }}>
            Available Tours
          </h2>
          {dbError && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
              Showing demo data — database unavailable
            </span>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {tours.map(tour => (
            <TourCard key={tour._id} tour={tour} />
          ))}
        </div>
      </section>

      {/* ── Waitlist ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1080px', margin: '0 auto' }}>
        <ToursWaitlist />
      </section>

      {/* ── Back link ── */}
      <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
          letterSpacing: '1px', color: '#4a6066', textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          ← Back to H&amp;S
        </Link>
      </div>
    </div>
  )
}
