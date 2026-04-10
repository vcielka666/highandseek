import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import { spendCredits, CREDIT_COSTS } from '@/lib/credits/index'
import { z } from 'zod'

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('mark_sold') }),
  z.object({ action: z.literal('mark_active') }),
  z.object({ action: z.literal('extend') }),
  z.object({ action: z.literal('boost') }),
])

// ── PATCH — update status or extend ─────────────────────────────────
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await connectDB()

  const listing = await Listing.findById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action } = parsed.data

  if (action === 'mark_sold') {
    listing.status = 'sold'
    await listing.save()
    return NextResponse.json({ ok: true, status: 'sold' })
  }

  if (action === 'mark_active') {
    listing.status = 'active'
    await listing.save()
    return NextResponse.json({ ok: true, status: 'active' })
  }

  if (action === 'extend') {
    try {
      await spendCredits(session.user.id, CREDIT_COSTS.MARKETPLACE_EXTEND, `Extend listing: ${listing.title}`)
    } catch {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    const newExpiry = new Date(Math.max(listing.expiresAt.getTime(), Date.now()))
    newExpiry.setDate(newExpiry.getDate() + 30)
    listing.expiresAt = newExpiry
    if (listing.status === 'expired') listing.status = 'active'
    await listing.save()
    return NextResponse.json({ ok: true, expiresAt: listing.expiresAt })
  }

  if (action === 'boost') {
    // Check if already active boost
    if (listing.featuredUntil && listing.featuredUntil > new Date()) {
      return NextResponse.json({ error: 'Listing is already featured' }, { status: 409 })
    }
    // Check global slot limit — max 3 featured at once
    const activeBoosts = await Listing.countDocuments({
      status: 'active',
      featuredUntil: { $gt: new Date() },
    })
    if (activeBoosts >= 3) {
      return NextResponse.json({ error: 'All 3 featured slots are currently taken', slotsFulle: true }, { status: 409 })
    }
    try {
      await spendCredits(session.user.id, CREDIT_COSTS.MARKETPLACE_BOOST, `Boost listing: ${listing.title}`)
    } catch {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    const until = new Date()
    until.setDate(until.getDate() + 3)
    listing.featuredUntil = until
    await listing.save()
    return NextResponse.json({ ok: true, featuredUntil: until })
  }
}

// ── DELETE — soft delete ─────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params

  await connectDB()

  const listing = await Listing.findById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  listing.status = 'removed'
  await listing.save()

  return NextResponse.json({ ok: true })
}
