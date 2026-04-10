import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import ErrorLog from '@/lib/db/models/ErrorLog'

export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  await connectDB()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const result = await ErrorLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } })

  return NextResponse.json({ deleted: result.deletedCount })
}
