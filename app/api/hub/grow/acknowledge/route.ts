import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { growId } = await req.json()
  if (!growId) return NextResponse.json({ error: 'Missing growId' }, { status: 400 })

  await connectDB()

  const grow = await VirtualGrow.findOne({
    _id: growId,
    userId: session.user.id,
    status: { $in: ['failed', 'abandoned'] },
  })
  if (!grow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  grow.isAcknowledged = true
  await grow.save()

  return NextResponse.json({ ok: true })
}
