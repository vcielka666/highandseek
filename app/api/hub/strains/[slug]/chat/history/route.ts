import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import StrainChat from '@/lib/db/models/StrainChat'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  await connectDB()

  const chats = await StrainChat.find({ userId: session.user.id, strainSlug: slug })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean<Array<{ messages: Array<{ role: string; content: string; timestamp: Date }> }>>()

  const messages = chats
    .reverse()
    .flatMap(c => c.messages)
    .slice(-20)
    .map(m => ({
      role:      m.role,
      content:   m.content,
      timestamp: m.timestamp,
    }))

  return NextResponse.json({ messages })
}
