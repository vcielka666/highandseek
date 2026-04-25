import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { QRRedirect, QRScan } from '@/lib/db/models/QRRedirect'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()

  const redirects = await QRRedirect.find().sort({ createdAt: -1 }).lean()

  // Attach scan counts
  const slugs = redirects.map(r => r.slug)
  const counts = await QRScan.aggregate([
    { $match: { slug: { $in: slugs } } },
    { $group: { _id: '$slug', total: { $sum: 1 }, converted: { $sum: { $cond: ['$convertedToRegistration', 1, 0] } }, lastScan: { $max: '$timestamp' } } },
  ])
  const countMap = Object.fromEntries(counts.map(c => [c._id, c]))

  const result = redirects.map(r => ({
    ...r,
    _id: r._id.toString(),
    totalScans:  countMap[r.slug]?.total     ?? 0,
    conversions: countMap[r.slug]?.converted ?? 0,
    lastScan:    countMap[r.slug]?.lastScan  ?? null,
  }))

  return NextResponse.json({ redirects: result })
}

const CreateSchema = z.object({
  slug:      z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  targetUrl: z.string().url(),
  label:     z.string().min(1).max(80),
})

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })

  await connectDB()

  const exists = await QRRedirect.exists({ slug: parsed.data.slug })
  if (exists) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })

  const redirect = await QRRedirect.create(parsed.data)
  return NextResponse.json({ redirect }, { status: 201 })
}
