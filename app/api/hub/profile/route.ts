import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

const patchSchema = z.object({
  displayName:        z.string().max(50).optional(),
  username:           z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only').optional(),
  bio:                z.string().max(160).optional(),
  location:           z.string().max(100).optional(),
  dateOfBirth:        z.string().nullable().optional(),
  experience:         z.enum(['beginner', 'intermediate', 'expert', 'master', '']).optional(),
  preferredSetup:     z.enum(['indoor', 'outdoor', 'both', '']).optional(),
  favouriteType:      z.enum(['indica', 'sativa', 'hybrid', '']).optional(),
  showLocation:       z.boolean().optional(),
  showAge:            z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  links: z.object({
    website:   z.string().max(200).optional(),
    instagram: z.string().max(50).optional(),
    telegram:  z.string().max(50).optional(),
    signal:    z.string().max(50).optional(),
    threema:   z.string().max(50).optional(),
  }).optional(),
  favouriteStrains: z.array(z.object({
    strainSlug: z.string(),
    strainName: z.string(),
  })).max(5).optional(),
  showcaseBadges: z.array(z.string()).max(6).optional(),
  avatar: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await connectDB()

  // Check username uniqueness if changing it
  if (parsed.data.username && parsed.data.username !== session.user.username) {
    const existing = await User.findOne({ username: parsed.data.username, _id: { $ne: session.user.id } })
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const update: Record<string, unknown> = {}
  const d = parsed.data

  if (d.displayName   !== undefined) update.displayName        = d.displayName
  if (d.username      !== undefined) update.username           = d.username
  if (d.bio           !== undefined) update.bio                = d.bio
  if (d.location      !== undefined) update.location           = d.location
  if (d.dateOfBirth   !== undefined) update.dateOfBirth        = d.dateOfBirth ? new Date(d.dateOfBirth) : null
  if (d.experience    !== undefined) update.experience         = d.experience
  if (d.preferredSetup !== undefined) update.preferredSetup   = d.preferredSetup
  if (d.favouriteType !== undefined) update.favouriteType      = d.favouriteType
  if (d.showLocation  !== undefined) update.showLocation       = d.showLocation
  if (d.showAge       !== undefined) update.showAge            = d.showAge
  if (d.emailNotifications !== undefined) update.emailNotifications = d.emailNotifications
  if (d.favouriteStrains  !== undefined) update.favouriteStrains   = d.favouriteStrains
  if (d.showcaseBadges    !== undefined) update.showcaseBadges     = d.showcaseBadges
  if (d.avatar            !== undefined) update.avatar             = d.avatar
  if (d.links) {
    if (d.links.website   !== undefined) update['links.website']   = d.links.website
    if (d.links.instagram !== undefined) update['links.instagram'] = d.links.instagram
    if (d.links.telegram  !== undefined) update['links.telegram']  = d.links.telegram
    if (d.links.signal    !== undefined) update['links.signal']    = d.links.signal
    if (d.links.threema   !== undefined) update['links.threema']   = d.links.threema
  }

  const user = await User.findByIdAndUpdate(session.user.id, { $set: update }, { new: true })
    .select('-passwordHash')
    .lean()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ user })
}
