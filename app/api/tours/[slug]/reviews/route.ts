import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'
import TourReview from '@/lib/db/models/TourReview'
import TourBooking from '@/lib/db/models/TourBooking'
import { awardXP } from '@/lib/xp'

const LIMIT = 10

const postSchema = z.object({
  rating:    z.number().int().min(1).max(5),
  text:      z.string().max(500),
  bookingId: z.string().min(1),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOne({ slug }).select('_id').lean<{ _id: mongoose.Types.ObjectId }>()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  const cursor = req.nextUrl.searchParams.get('cursor')

  const filter: Record<string, unknown> = { tourId: tour._id }
  if (cursor) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) }
  }

  const reviews = await TourReview.find(filter)
    .sort({ _id: -1 })
    .limit(LIMIT + 1)
    .lean()

  const hasMore = reviews.length > LIMIT
  const page    = hasMore ? reviews.slice(0, LIMIT) : reviews
  const nextCursor = hasMore
    ? String((page[page.length - 1] as { _id: mongoose.Types.ObjectId })._id)
    : null

  return NextResponse.json({ reviews: page, nextCursor })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await req.json()
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }
  const { rating, text, bookingId } = parsed.data

  await connectDB()

  const tour = await Tour.findOne({ slug }).lean<{ _id: mongoose.Types.ObjectId; reviewsCount: number; rating: number }>()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  // Verify booking belongs to user and is completed
  const booking = await TourBooking.findOne({
    _id:    bookingId,
    userId: session.user.id,
    tourId: tour._id,
    status: 'completed',
  }).lean<{ _id: mongoose.Types.ObjectId; guest: { name: string } }>()

  if (!booking) {
    return NextResponse.json(
      { error: 'No completed booking found for this tour' },
      { status: 403 }
    )
  }

  // Guard duplicate review per booking
  const existing = await TourReview.findOne({ bookingId }).lean()
  if (existing) {
    return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 409 })
  }

  const review = await TourReview.create({
    tourId:    tour._id,
    bookingId: booking._id,
    userId:    session.user.id,
    rating,
    text,
    guestName: booking.guest.name,
    verified:  true,
  })

  // Recalculate tour rating
  const agg = await TourReview.aggregate<{ avg: number; count: number }>([
    { $match: { tourId: tour._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  if (agg.length > 0) {
    const { avg, count } = agg[0]
    await Tour.findByIdAndUpdate(tour._id, {
      rating:       Math.round(avg * 10) / 10,
      reviewsCount: count,
    })
  }

  try {
    await awardXP(session.user.id, 'TOUR_REVIEWED')
  } catch {
    // never block caller
  }

  return NextResponse.json({ review }, { status: 201 })
}
