import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

const bodySchema = z.object({
  bio:        z.string().min(50).max(500),
  languages:  z.array(z.string()).min(1),
  cities:     z.array(z.string()).min(1),
  experience: z.string().min(20).max(300),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const user = await User.findById(session.user.id).select('tourGuideStatus username email')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.tourGuideStatus === 'pending') {
    return NextResponse.json({ error: 'Application already pending' }, { status: 409 })
  }
  if (user.tourGuideStatus === 'approved') {
    return NextResponse.json({ error: 'Already a guide' }, { status: 409 })
  }

  await User.findByIdAndUpdate(session.user.id, {
    tourGuideStatus: 'pending',
    tourGuideAppliedAt: new Date(),
    tourGuideInfo: {
      bio:        parsed.data.bio,
      languages:  parsed.data.languages,
      cities:     parsed.data.cities,
      experience: parsed.data.experience,
    },
  })

  try {
    await sendTelegramMessage(
      `🧭 <b>New Tour Guide Application</b>\n` +
      `User: <b>${user.username}</b> (${user.email})\n` +
      `Cities: ${parsed.data.cities.join(', ')}\n` +
      `Languages: ${parsed.data.languages.join(', ')}\n` +
      `Review at: /admin/guides`
    )
  } catch { /* never block */ }

  return NextResponse.json({ ok: true })
}
