import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import User from '@/lib/db/models/User'
import { calculateAttributes } from '@/lib/grow/attributes'
import type { Setup, Environment, GrowStage } from '@/lib/grow/attributes'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const byId = searchParams.get('id')

  const [growDoc, userDoc] = await Promise.all([
    byId
      ? VirtualGrow.findOne({ _id: byId, userId: session.user.id })
      : VirtualGrow.findOne({ userId: session.user.id, status: 'active' }),
    User.findById(session.user.id).select('credits').lean<{ credits: number }>(),
  ])

  const credits = userDoc?.credits ?? 0

  if (!growDoc) return NextResponse.json({ grow: null, credits })

  const grow = growDoc.toObject() as Record<string, unknown>

  // Only recalculate attributes for active grows — completed/failed are frozen
  if (grow.status === 'active') {
    const attrs = grow.attributes as { watering?: { value?: number }; nutrients?: { value?: number } } | undefined
    const freshAttrs = calculateAttributes(
      grow.setup as Setup,
      grow.environment as Environment,
      grow.stage as GrowStage,
      attrs?.watering?.value ?? 70,
      attrs?.nutrients?.value ?? 50,
    )
    grow.attributes = freshAttrs
  }

  return NextResponse.json({ grow, credits })
}
