import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB }    from '@/lib/db/connect'
import Waitlist         from '@/lib/db/models/Waitlist'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const count = await Waitlist.countDocuments({ source: 'tours' })

  return NextResponse.json({ count })
}
