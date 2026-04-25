import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { QRRedirect } from '@/lib/db/models/QRRedirect'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

const UpdateSchema = z.object({
  targetUrl: z.string().url().optional(),
  label:     z.string().min(1).max(80).optional(),
  isActive:  z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await params
  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })

  await connectDB()
  const updated = await QRRedirect.findOneAndUpdate({ slug }, { $set: parsed.data }, { new: true }).lean()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ redirect: updated })
}
