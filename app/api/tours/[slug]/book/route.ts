import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { nanoid } from 'nanoid'
import { Resend } from 'resend'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'
import TourBooking from '@/lib/db/models/TourBooking'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { awardBadge } from '@/lib/badges'
import { sendTelegramMessage, formatTourBooking } from '@/lib/notifications/telegram'

const bodySchema = z.object({
  date:        z.string().min(1),
  guestsCount: z.number().int().min(1).max(20),
  guest: z.object({
    name:            z.string().min(1),
    email:           z.string().email(),
    phone:           z.string().optional(),
    telegramContact: z.string().optional(),
  }),
  payment: z.object({
    method:   z.enum(['stripe', 'crypto', 'credits']),
    amount:   z.number(),
    currency: z.string().default('EUR'),
  }),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await auth()

  const raw = await req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }
  const { date, guestsCount, guest, payment, notes } = parsed.data

  await connectDB()

  const tour = await Tour.findOne({ slug }).lean<{
    _id: import('mongoose').Types.ObjectId
    title: string
    meetingPoint: { address: string }
  }>()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  const userId = session?.user?.id ?? undefined

  // Handle credits payment
  let creditsSpent: number | undefined
  if (payment.method === 'credits') {
    if (!userId) {
      return NextResponse.json({ error: 'Login required for credits payment' }, { status: 401 })
    }
    const user = await User.findById(userId).select('credits').lean<{ credits: number }>()
    if (!user || user.credits < payment.amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    creditsSpent = payment.amount
    await User.findByIdAndUpdate(userId, { $inc: { credits: -creditsSpent } })
  }

  // Handle Stripe payment intent
  let stripePaymentIntentId: string | undefined
  let stripeClientSecret: string | undefined
  if (payment.method === 'stripe') {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(payment.amount * 100),
      currency: payment.currency.toLowerCase(),
      metadata: { tourSlug: slug, guestEmail: guest.email },
    })
    stripePaymentIntentId = intent.id
    stripeClientSecret    = intent.client_secret ?? undefined
  }

  const qrCode = nanoid(12)

  const bookingStatus =
    payment.method === 'credits' || payment.method === 'crypto'
      ? 'confirmed'
      : 'pending'

  const paymentStatus =
    payment.method === 'credits' ? 'paid' : 'pending'

  const booking = await TourBooking.create({
    tourId:      tour._id,
    userId,
    guest,
    date:        new Date(date),
    guestsCount,
    payment: {
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      stripePaymentIntentId,
      creditsSpent,
      status: paymentStatus,
    },
    status:  bookingStatus,
    qrCode,
    notes,
    xpAwarded: 0,
  })

  await Tour.findByIdAndUpdate(tour._id, { $inc: { totalBookings: 1 } })

  if (userId) {
    try {
      await awardXP(userId, 'TOUR_BOOKED')
    } catch {
      // never block caller
    }
    try {
      await awardBadge(userId, 'canna_tourist')
    } catch {
      // never block caller
    }
  }

  // Telegram notification
  try {
    const msg = formatTourBooking({
      tourTitle:       tour.title,
      guestName:       guest.name,
      guestEmail:      guest.email,
      telegramContact: guest.telegramContact,
      date:            new Date(date),
      guestsCount,
      paymentMethod:   payment.method,
      amount:          payment.amount,
      currency:        payment.currency,
      qrCode,
    })
    await sendTelegramMessage(msg)
  } catch {
    // never block caller
  }

  // Confirmation email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const dateStr = new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    })
    await resend.emails.send({
      from:    'High & Seek <noreply@highandseek.com>',
      to:      guest.email,
      subject: `🧭 Booking confirmed — ${tour.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
          <h2 style="color:#00d4c8">Your tour is booked!</h2>
          <p>Hi ${guest.name},</p>
          <p>We're excited to have you join <strong>${tour.title}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Tour</td><td style="padding:8px;border:1px solid #ddd">${tour.title}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Date</td><td style="padding:8px;border:1px solid #ddd">${dateStr}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Guests</td><td style="padding:8px;border:1px solid #ddd">${guestsCount}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Meeting point</td><td style="padding:8px;border:1px solid #ddd">${tour.meetingPoint.address}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Booking code</td><td style="padding:8px;border:1px solid #ddd"><strong>${qrCode}</strong></td></tr>
          </table>
          <p>Show this booking code to your guide on the day.</p>
          <p style="color:#666;font-size:12px">High & Seek — highandseek.com</p>
        </div>
      `,
    })
  } catch {
    // never block caller
  }

  return NextResponse.json(
    {
      booking: {
        _id:         String(booking._id),
        qrCode:      booking.qrCode,
        status:      booking.status,
        tourTitle:   tour.title,
        date:        booking.date,
        guestsCount: booking.guestsCount,
        guest:       booking.guest,
        payment:     booking.payment,
      },
      ...(stripeClientSecret ? { stripeClientSecret } : {}),
    },
    { status: 201 }
  )
}
