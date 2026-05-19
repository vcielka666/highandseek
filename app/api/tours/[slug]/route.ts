import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'
import TourReview from '@/lib/db/models/TourReview'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOne({ slug }).lean()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  const reviews = await TourReview.find({ tourId: (tour as { _id: unknown })._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

  return NextResponse.json({ tour, reviews })
}
