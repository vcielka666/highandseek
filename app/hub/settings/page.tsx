import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'
import { BADGES } from '@/lib/badges/config'
import Breadcrumb from '@/components/ui/Breadcrumb'
import EditProfileForm from '@/components/hub/EditProfileForm'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/settings')

  await connectDB()

  const user = await User.findById(session.user.id)
    .select('-passwordHash')
    .lean<{
      _id: { toString(): string }
      username: string
      displayName: string
      email: string
      avatar: string
      bio: string
      location: string
      dateOfBirth: Date | null
      experience: string
      preferredSetup: string
      favouriteType: string
      showLocation: boolean
      showAge: boolean
      emailNotifications: boolean
      links: { website: string; instagram: string; telegram: string; signal: string; threema: string }
      favouriteStrains: { strainSlug: string; strainName: string }[]
      badges: { badgeId: string; earnedAt: Date }[]
      showcaseBadges: string[]
    }>()

  if (!user) redirect('/auth/login')

  // All available strains for the multi-select
  const strains = await Product.find({ isAvailable: true, category: { $in: ['seed', 'flower'] } })
    .select('name slug')
    .lean<{ _id: unknown; name: string; slug: string }[]>()

  const strainOptions = strains.map(s => ({ slug: s.slug, name: s.name }))

  // Earned badge options for showcase selector
  const earnedBadges = (user.badges ?? []).map(b => {
    const def = BADGES[b.badgeId as keyof typeof BADGES]
    return def ? { id: b.badgeId, name: def.name, icon: def.icon } : null
  }).filter(Boolean) as { id: string; name: string; icon: string }[]

  return (
    <div style={{ maxWidth: '720px' }} className="px-4 pt-4 pb-16 md:px-6 md:pt-6">
      <Breadcrumb
        items={[{ label: 'Hub', href: '/hub' }, { label: session.user.username, href: `/hub/profile/${session.user.username}` }, { label: 'Edit Profile' }]}
        color="#cc00aa"
      />
      <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: '#e8f0ef', marginBottom: '24px' }}>
        Edit Profile
      </h1>

      <EditProfileForm
        initial={{
          username:           user.username,
          displayName:        user.displayName ?? '',
          avatar:             user.avatar ?? '',
          bio:                user.bio ?? '',
          location:           user.location ?? '',
          dateOfBirth:        user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          experience:         (user.experience ?? '') as '',
          preferredSetup:     (user.preferredSetup ?? '') as '',
          favouriteType:      (user.favouriteType ?? '') as '',
          showLocation:       user.showLocation ?? true,
          showAge:            user.showAge ?? true,
          emailNotifications: user.emailNotifications ?? true,
          links: {
            website:   user.links?.website ?? '',
            instagram: user.links?.instagram ?? '',
            telegram:  user.links?.telegram ?? '',
            signal:    user.links?.signal ?? '',
            threema:   user.links?.threema ?? '',
          },
          favouriteStrains: (user.favouriteStrains ?? []).map(s => ({ strainSlug: s.strainSlug, strainName: s.strainName })),
          showcaseBadges:   user.showcaseBadges ?? [],
        }}
        strainOptions={strainOptions}
        earnedBadges={earnedBadges}
        profileUsername={user.username}
      />
    </div>
  )
}
