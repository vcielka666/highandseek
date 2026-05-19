import { connectDB }    from '@/lib/db/connect'
import TourBooking     from '@/lib/db/models/TourBooking'
import Tour            from '@/lib/db/models/Tour'
import { notFound }    from 'next/navigation'
import Link            from 'next/link'
import type { ITourBooking } from '@/lib/db/models/TourBooking'
import type { ITour }        from '@/lib/db/models/Tour'
import BookingQR             from './BookingQR'
import BookingActions        from './BookingActions'

type BookingDoc = ITourBooking & { _id: { toString(): string } }
type TourDoc    = ITour        & { _id: { toString(): string } }

export default async function BookingConfirmationPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  await connectDB()

  const bookingRaw = await TourBooking.findById(id).lean<BookingDoc>()
  if (!bookingRaw) notFound()

  const tourRaw = await Tour.findById(bookingRaw.tourId).lean<TourDoc>()

  const booking = bookingRaw
  const tour    = tourRaw

  const bookingDate = new Date(booking.date)
  const statusColor: Record<string, string> = {
    confirmed: '#44cc88',
    pending:   '#f0a830',
    completed: '#8844cc',
    cancelled: '#cc4444',
  }

  const paymentLabel: Record<string, string> = {
    stripe:  'Credit / Debit Card',
    credits: 'H&S Credits',
    crypto:  'Cryptocurrency',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0',
    borderBottom: '0.5px solid rgba(136,68,204,0.08)',
    gap: '12px',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
    color: '#4a6066', textTransform: 'uppercase', flexShrink: 0,
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans)', fontSize: '13px',
    color: '#e8f0ef', textAlign: 'right',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 40% at 50% 20%, rgba(136,68,204,0.1) 0%, transparent 60%)',
      }} />

      <div style={{
        maxWidth: '640px', margin: '0 auto', padding: '48px 24px 80px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {/* Status icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
            background: `rgba(68,204,136,0.12)`, border: `2px solid rgba(68,204,136,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
          }}>
            {booking.status === 'confirmed' ? '✅' : booking.status === 'pending' ? '⏳' : booking.status === 'completed' ? '🏆' : '❌'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-orbitron)', fontWeight: 900,
            fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: '3px',
            color: '#e8f0ef', textTransform: 'uppercase', marginBottom: '8px',
          }}>
            {booking.status === 'confirmed' ? 'Booking Confirmed!' :
             booking.status === 'pending'   ? 'Booking Pending'    :
             booking.status === 'completed' ? 'Tour Completed'      : 'Booking Cancelled'}
          </h1>

          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
            background: `${statusColor[booking.status] ?? '#4a6066'}18`,
            border: `0.5px solid ${statusColor[booking.status] ?? '#4a6066'}40`,
            fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1.5px',
            color: statusColor[booking.status] ?? '#4a6066', textTransform: 'uppercase',
          }}>
            {booking.status}
          </div>
        </div>

        {/* ── QR Code ── */}
        <div style={{
          background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.25)',
          borderRadius: '8px', padding: '28px 24px', marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', color: '#4a6066', textTransform: 'uppercase', marginBottom: '16px' }}>
            Show this at the meeting point
          </div>

          <BookingQR qrCode={booking.qrCode} />

          <div style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700,
            color: '#8844cc', letterSpacing: '3px', marginTop: '14px',
          }}>
            {booking.qrCode}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginTop: '6px', letterSpacing: '1px' }}>
            Booking code
          </div>
        </div>

        {/* ── Booking details ── */}
        <div style={{
          background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.18)',
          borderRadius: '8px', padding: '20px 24px', marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '2px',
            textTransform: 'uppercase', color: 'rgba(136,68,204,0.6)', marginBottom: '14px',
          }}>
            Booking Details
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Tour</span>
            <span style={{ ...valueStyle, color: '#8844cc', fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700 }}>
              {tour?.title ?? 'N/A'}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>City</span>
            <span style={valueStyle}>{tour?.city ?? 'N/A'}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Date</span>
            <span style={valueStyle}>
              {bookingDate.toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Guests</span>
            <span style={valueStyle}>{booking.guestsCount} person{booking.guestsCount !== 1 ? 's' : ''}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Meeting point</span>
            <span style={{ ...valueStyle, maxWidth: '260px' }}>
              {tour?.meetingPoint.address ?? 'TBD — guide will contact you'}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Guest name</span>
            <span style={valueStyle}>{booking.guest.name}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Email</span>
            <span style={{ ...valueStyle, fontSize: '12px' }}>{booking.guest.email}</span>
          </div>

          {booking.guest.phone && (
            <div style={rowStyle}>
              <span style={labelStyle}>Phone</span>
              <span style={valueStyle}>{booking.guest.phone}</span>
            </div>
          )}

          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Payment</span>
            <span style={valueStyle}>
              {paymentLabel[booking.payment.method] ?? booking.payment.method} ·{' '}
              {booking.payment.currency === 'CREDITS'
                ? `${booking.payment.creditsSpent ?? booking.payment.amount} CR`
                : `€${booking.payment.amount}`}
            </span>
          </div>
        </div>

        {/* ── XP awarded ── */}
        {booking.xpAwarded > 0 && (
          <div style={{
            background: 'rgba(240,168,48,0.06)', border: '0.5px solid rgba(240,168,48,0.25)',
            borderRadius: '8px', padding: '16px 20px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '22px' }}>⚡</span>
            <div>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#f0a830' }}>
                +{booking.xpAwarded} XP earned
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginTop: '2px' }}>
                Added to your High &amp; Seek profile
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <BookingActions qrCode={booking.qrCode} />

        {/* ── Telegram reminder ── */}
        <div style={{
          background: '#0d0d10', border: '0.5px solid rgba(136,68,204,0.15)',
          borderRadius: '8px', padding: '16px 20px', marginBottom: '24px',
        }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(136,68,204,0.5)', marginBottom: '8px' }}>
            Get Telegram reminders
          </div>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '12px', lineHeight: 1.6 }}>
            Receive a reminder 24h before your tour starts and get real-time updates from your guide.
          </p>
          <a
            href="https://t.me/highandseek_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block', padding: '9px 18px', borderRadius: '4px',
              background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.3)',
              color: '#8844cc', fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
              textDecoration: 'none', letterSpacing: '0.5px',
            }}
          >
            ✈ Connect Telegram
          </a>
        </div>

        {/* ── Back links ── */}
        <div style={{
          display: 'flex', gap: '16px', justifyContent: 'center',
          fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
          color: '#4a6066', textTransform: 'uppercase',
        }}>
          <Link href="/tours" style={{ color: '#4a6066', textDecoration: 'none' }}>← All Tours</Link>
          <Link href="/hub" style={{ color: '#4a6066', textDecoration: 'none' }}>Hub →</Link>
        </div>
      </div>
    </div>
  )
}
