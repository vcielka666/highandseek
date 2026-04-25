import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { QRScan } from '@/lib/db/models/QRRedirect'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await params
  const { sessionId } = await req.json() as { sessionId?: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  await connectDB()
  const result = await QRScan.updateMany(
    { slug, sessionId, convertedToRegistration: false },
    { $set: { convertedToRegistration: true, convertedAt: new Date() } }
  )

  return NextResponse.json({ updated: result.modifiedCount })
}
