import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import Listing from '@/lib/db/models/Listing'
import Strain from '@/lib/db/models/Strain'
import Post from '@/lib/db/models/Post'
import { getXPProgress } from '@/lib/xp/index'
import HubBentoGrid, { type BentoData } from '@/components/hub/HubBentoGrid'
import mongoose from 'mongoose'

export default async function HubPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  await connectDB()

  const [userData, recentXP, activeGrow, recentListings, listingCount, topUsers, strains] = await Promise.all([
    User.findById(session.user.id).select('xp level credits growsCompleted cloneBank avatar following').lean<{
      xp: number; level: number; credits: number; growsCompleted: number; avatar: string
      cloneBank: Array<{ strainSlug: string; strainName: string; strainType: string; floweringTime: number; takenAt: string }>
      following: mongoose.Types.ObjectId[]
    }>(),
    XPEvent.find({ userId: session.user.id })
      .sort({ createdAt: -1 }).limit(6)
      .lean<{ event: string; amount: number; createdAt: Date }[]>(),
    VirtualGrow.findOne({ userId: session.user.id, status: { $in: ['active', 'failed', 'completed'] }, isAcknowledged: { $ne: true } })
      .sort({ updatedAt: -1 })
      .select('_id strainName strainType stage currentDay health yieldProjection setup dayDurationSeconds status xpEarned warnings')
      .lean<{
        _id: { toString(): string }; strainName: string; strainType: string; stage: string
        currentDay: number; health: number; yieldProjection: number
        dayDurationSeconds: number; status: string; xpEarned: number
        setup: { tentSize: string; lightType: string; lightWatts: number; medium: string }
        warnings: Array<{ attribute: string; message: string; severity: string; resolvedAt?: string | null }>
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

  // Feed preview: personal feed if following someone, popular fallback otherwise
  const followingIds = userData?.following ?? []
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  type PreviewPost = {
    _id: { toString(): string }
    type: string
    content: { mediaUrl?: string; mediaType: string | null; text?: string }
    userId: { username: string; avatar: string }
    likesCount: number
    createdAt: Date
  }

  const hasFollowing = followingIds.length > 0
  const authorIds: mongoose.Types.ObjectId[] = hasFollowing
    ? [...followingIds, new mongoose.Types.ObjectId(session.user.id)]
    : []

  const [recentFeedPosts, newPostsCount, followerAvatarUsers] = await Promise.all([
    hasFollowing
      ? Post.find({ userId: { $in: authorIds }, isDeleted: false, isPublic: true })
          .sort({ _id: -1 })
          .limit(4)
          .populate('userId', 'username avatar')
          .lean<PreviewPost[]>()
      : Post.find({ isDeleted: false, isPublic: true })
          .sort({ likesCount: -1, _id: -1 })
          .limit(4)
          .populate('userId', 'username avatar')
          .lean<PreviewPost[]>(),
    hasFollowing
      ? Post.countDocuments({
          userId: { $in: authorIds },
          isDeleted: false,
          isPublic: true,
          createdAt: { $gte: oneDayAgo },
        })
      : Promise.resolve(0),
    hasFollowing
      ? User.find({ _id: { $in: followingIds.slice(0, 4) } })
          .select('username avatar')
          .lean<{ username: string; avatar: string }[]>()
      : Promise.resolve([] as { username: string; avatar: string }[]),
  ])

  const feedPreview = {
    recentPosts: recentFeedPosts.map(p => ({
      _id: p._id.toString(),
      type: p.type,
      content: p.content,
      user: { username: p.userId.username, avatar: p.userId.avatar },
      likesCount: p.likesCount ?? 0,
      createdAt: p.createdAt.toISOString(),
    })),
    newPostsCount,
    followerAvatars: followerAvatarUsers,
    totalFollowing: followingIds.length,
  }

  const data: BentoData = {
    userId:         session.user.id,
    username:       session.user.username,
    userAvatar:     userData?.avatar ?? '',
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
      ? { ...activeGrow, _id: activeGrow._id.toString(), warnings: activeGrow.warnings ?? [] }
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

    feedPreview,
  }

  return <HubBentoGrid data={data} />
}
