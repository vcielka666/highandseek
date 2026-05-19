import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import TourBooking from '@/lib/db/models/TourBooking'
import Tour from '@/lib/db/models/Tour'
import { awardXP } from '@/lib/xp'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import type { BookingStatus } from '@/lib/db/models/TourBooking'

const patchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  notes:  z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  await connectDB()

  const booking = await TourBooking.findById(id)
    .populate('tourId', 'title slug city')
    .lean()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json({ booking })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const raw = await req.json()
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const existing = await TourBooking.findById(id).lean<{
    _id: import('mongoose').Types.ObjectId
    status: BookingStatus
    userId?: string
    xpAwarded: number
    guest: { name: string; email: string }
    tourId: import('mongoose').Types.ObjectId | string
  }>()

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.status !== undefined) update.status = parsed.data.status
  if (parsed.data.notes  !== undefined) update.notes  = parsed.data.notes

  const booking = await TourBooking.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).lean()

  const newStatus = parsed.data.status

  // When confirmed: send Telegram notification
  if (newStatus === 'confirmed' && existing.status !== 'confirmed') {
    try {
      const tour = await Tour.findById(existing.tourId).select('title').lean<{ title: string }>()
      const tourTitle = tour?.title ?? 'Unknown Tour'
      await sendTelegramMessage(
        `✅ <b>REZERVÁCIA POTVRDENÁ</b>\n\nTour: ${tourTitle}\nHoste: ${existing.guest.name} (${existing.guest.email})`
      )
    } catch {
      // never block caller
    }
  }

  // When completed: award XP if not yet awarded
  if (newStatus === 'completed' && existing.status !== 'completed' && existing.userId) {
    if (existing.xpAwarded === 0) {
      try {
        await awardXP(existing.userId, 'TOUR_COMPLETED')
        await TourBooking.findByIdAndUpdate(id, { xpAwarded: 200 })
      } catch {
        // never block caller
      }
    }
  }

  return NextResponse.json({ booking })
}
