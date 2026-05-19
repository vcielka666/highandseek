import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import CannabisSpot from '@/lib/db/models/CannabisSpot'
import { awardXP } from '@/lib/xp'

const bodySchema = z.object({
  name:        z.string().min(1),
  city:        z.string().min(1),
  country:     z.string().min(1),
  type:        z.enum(['cbd_shop', 'smoke_friendly', 'cannabis_club', 'grow_shop', 'cafe', 'event_space']),
  description: z.string().max(500).default(''),
  address:     z.string().min(1),
  lat:         z.number(),
  lng:         z.number(),
  hours:       z.string().optional(),
  website:     z.string().url().optional(),
  instagram:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const spot = await CannabisSpot.create({
    ...parsed.data,
    verified: false,
    addedBy:  session.user.id,
  })

  try {
    await awardXP(session.user.id, 'SPOT_SUGGESTED')
  } catch {
    // never block caller
  }

  return NextResponse.json({ spot }, { status: 201 })
}
