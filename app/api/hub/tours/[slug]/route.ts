import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'

const patchSchema = z.object({
  title:            z.string().min(5).max(100).optional(),
  shortDescription: z.string().min(20).max(150).optional(),
  description:      z.string().min(50).max(2000).optional(),
  duration:         z.number().int().min(30).max(480).optional(),
  maxGuests:        z.number().int().min(1).max(20).optional(),
  languages:        z.array(z.string()).optional(),
  priceEur:         z.number().min(0).optional(),
  priceCzk:         z.number().min(0).optional(),
  priceCredits:     z.number().min(0).optional(),
  meetingAddress:   z.string().min(5).max(200).optional(),
  meetingLat:       z.number().optional(),
  meetingLng:       z.number().optional(),
  included:         z.array(z.string()).optional(),
  notIncluded:      z.array(z.string()).optional(),
  requirements:     z.array(z.string()).optional(),
  isComingSoon:     z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOne({ slug })
  if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  if (tour.host?.userId?.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — not your tour' }, { status: 403 })
  }

  const raw = await req.json()
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const update: Record<string, unknown> = {}
  if (d.title !== undefined) update.title = d.title
  if (d.shortDescription !== undefined) update.shortDescription = d.shortDescription
  if (d.description !== undefined) update.description = d.description
  if (d.duration !== undefined) update.duration = d.duration
  if (d.maxGuests !== undefined) update.maxGuests = d.maxGuests
  if (d.languages !== undefined) update.languages = d.languages
  if (d.priceEur !== undefined || d.priceCzk !== undefined || d.priceCredits !== undefined) {
    update.price = {
      eur:     d.priceEur     ?? tour.price.eur,
      czk:     d.priceCzk    ?? tour.price.czk,
      credits: d.priceCredits ?? tour.price.credits,
    }
  }
  if (d.meetingAddress !== undefined) {
    update['meetingPoint.address'] = d.meetingAddress
    if (d.meetingLat !== undefined) update['meetingPoint.lat'] = d.meetingLat
    if (d.meetingLng !== undefined) update['meetingPoint.lng'] = d.meetingLng
  }
  if (d.included !== undefined) update.included = d.included
  if (d.notIncluded !== undefined) update.notIncluded = d.notIncluded
  if (d.requirements !== undefined) update.requirements = d.requirements
  if (d.isComingSoon !== undefined) update.isComingSoon = d.isComingSoon

  const updated = await Tour.findByIdAndUpdate(tour._id, update, { new: true }).lean()
  return NextResponse.json({ tour: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOne({ slug })
  if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  if (tour.host?.userId?.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await Tour.deleteOne({ _id: tour._id })
  return NextResponse.json({ ok: true })
}
