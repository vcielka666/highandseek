import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'

export async function POST(req: Request) {
  const session = await auth()
  const guestToken = (req as Request & { headers: Headers }).headers.get('X-Guest-Token')
  if (!session && !guestToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const ownerQuery = session ? { userId: session.user.id } : { guestToken }
  const grow = await VirtualGrow.findOne({ ...ownerQuery, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  grow.status = 'abandoned'
  await grow.save()

  return NextResponse.json({ success: true })
}
