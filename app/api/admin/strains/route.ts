import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  await connectDB()

  const strains = await Strain.find({})
    .select('slug name type personality.archetype stats isActive isComingSoon createdAt')
    .sort({ name: 1 })
    .lean()

  return NextResponse.json({ strains })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const body = await req.json().catch(() => null)
  if (!body?.slug || !body?.name) return NextResponse.json({ error: 'slug and name required' }, { status: 400 })

  await connectDB()
  const strain = await Strain.create(body)
  return NextResponse.json({ strain }, { status: 201 })
}
