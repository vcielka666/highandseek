import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import Listing from '@/lib/db/models/Listing'
import Strain from '@/lib/db/models/Strain'
import { getXPProgress } from '@/lib/xp/index'
import HubBentoGrid, { type BentoData } from '@/components/hub/HubBentoGrid'

export default async function HubPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()

  const [userData, recentXP, activeGrow, recentListings, listingCount, topUsers, strains] = await Promise.all([
    User.findById(session.user.id).select('xp level credits growsCompleted cloneBank').lean<{
      xp: number; level: number; credits: number; growsCompleted: number
      cloneBank: Array<{ strainSlug: string; strainName: string; strainType: string; floweringTime: number; takenAt: string }>
    }>(),
    XPEvent.find({ userId: session.user.id })
      .sort({ createdAt: -1 }).limit(6)
      .lean<{ event: string; amount: number; createdAt: Date }[]>(),
    VirtualGrow.findOne({ userId: session.user.id, status: { $in: ['active', 'failed', 'completed'] } })
      .sort({ updatedAt: -1 })
      .select('_id strainName strainType stage currentDay health yieldProjection setup dayDurationSeconds status')
      .lean<{
        _id: { toString(): string }; strainName: string; strainType: string; stage: string
        currentDay: number; health: number; yieldProjection: number
        dayDurationSeconds: number; status: string
        setup: { tentSize: string; lightType: string; lightWatts: number; medium: string }
      }>(),
    Listing.find({ status: 'active' }).sort({ createdAt: -1 }).limit(4)
      .select('title category price images')
      .lean<{ _id: { toString(): string }; title: string; category: string; price: number; images: string[] }[]>(),
    Listing.countDocuments({ status: 'active' }),
    User.find({}).sort({ xp: -1 }).limit(5).select('username xp level')
      .lean<{ _id: { toString(): string }; username: string; xp: number; level: number }[]>(),
    Strain.find({ isActive: true }).limit(8)
      .select('slug name type shopProductSlug visuals floweringTime difficulty')
      .lean<{
        slug: string; name: string; type: string; shopProductSlug?: string
        floweringTime?: number; difficulty?: string
        visuals?: { avatarLevels?: Array<{ imageUrl: string }> }
      }[]>(),
  ])

  const xp      = userData?.xp    ?? session.user.xp    ?? 0
  const level   = userData?.level ?? session.user.level ?? 1
  const { current, next, percent } = getXPProgress(xp)

  const data: BentoData = {
    userId:         session.user.id,
    username:       session.user.username,
    xp,
    level,
    credits:        userData?.credits        ?? 0,
    growsCompleted: userData?.growsCompleted ?? 0,
    cloneBank:      (userData?.cloneBank     ?? []).map(c => ({ ...c })),
    percent,
    levelName:     current.name,
    nextLevelName: next?.name    ?? null,
    nextLevelXP:   next?.xpRequired ?? null,

    activeGrow: activeGrow
      ? { ...activeGrow, _id: activeGrow._id.toString() }
      : null,

    strains: strains.map(s => ({
      slug:          s.slug,
      name:          s.name,
      type:          s.type,
      imageUrl:      s.visuals?.avatarLevels?.[0]?.imageUrl ?? '',
      floweringTime: s.floweringTime,
      difficulty:    s.difficulty,
    })),
    strainCount: strains.length,

    listings: recentListings.map(l => ({
      _id:      l._id.toString(),
      title:    l.title,
      category: l.category,
      price:    l.price,
      images:   l.images,
    })),
    listingCount,

    topUsers: topUsers.map(u => ({
      _id:      u._id.toString(),
      username: u.username,
      xp:       u.xp,
      level:    u.level,
    })),

    xpEvents: recentXP.map(e => ({
      event:     e.event,
      amount:    e.amount,
      createdAt: e.createdAt.toISOString(),
    })),
  }

  return <HubBentoGrid data={data} />
}
