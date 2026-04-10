import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const grow = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (!grow) return NextResponse.json({ error: 'No active grow' }, { status: 404 })

  grow.status = 'abandoned'
  await grow.save()

  return NextResponse.json({ success: true })
}
