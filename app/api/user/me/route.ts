import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById(session.user.id)
    .select('credits xp level')
    .lean<{ credits?: number; xp?: number; level?: number }>()

  return NextResponse.json({
    credits: user?.credits ?? 0,
    xp:      user?.xp      ?? session.user.xp      ?? 0,
    level:   user?.level   ?? session.user.level   ?? 1,
  })
}
