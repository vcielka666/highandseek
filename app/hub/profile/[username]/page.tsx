import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import XPEvent from '@/lib/db/models/XPEvent'
import Order from '@/lib/db/models/Order'
import Listing from '@/lib/db/models/Listing'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import OrderCard from '@/components/shop/OrderCard'
import type { OrderData } from '@/components/shop/OrderCard'
import { getXPProgress } from '@/lib/xp/index'
import { BADGES } from '@/lib/badges/index'
import MyListingActions from '@/components/hub/MyListingActions'
import type { ListingStatus } from '@/lib/db/models/Listing'
import WalletSection from '@/components/hub/WalletSection'

type Tab = 'overview' | 'grows' | 'badges' | 'activity' | 'orders' | 'listings'

export default async function ProfilePage(props: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub')

  const { username } = await props.params
  const { tab: rawTab } = await props.searchParams
  const tab: Tab = (['overview', 'grows', 'badges', 'activity', 'orders', 'listings'].includes(rawTab ?? '') ? rawTab : 'overview') as Tab

  await connectDB()

  const profileUser = await User.findOne({ username }).lean<{
    _id: { toString(): string }
    username: string
    xp: number
    level: number
    credits: number
    avatar: string
    bio: string
    location: string
    links: { website: string; instagram: string }
    badges: { badgeId: string; earnedAt: Date }[]
    followers: unknown[]
    following: unknown[]
    growsCompleted: number
    totalXpEarned: number
    showcaseBadges: string[]
    walletAddress: string
    createdAt: Date
  }>()

  if (!profileUser) notFound()

  const isOwnProfile = profileUser._id.toString() === session.user.id
  const { current, next, percent } = getXPProgress(profileUser.xp)

  const recentXP = await XPEvent.find({ userId: profileUser._id.toString() })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean<{ event: string; amount: number; createdAt: Date }[]>()

  const userOrdersRaw = isOwnProfile
    ? await Order.find({ userId: profileUser._id.toString() })
        .sort({ createdAt: -1 })
        .lean<{ _id: { toString(): string }; items: { productId: { toString(): string }; name: string; quantity: number; price: number }[]; totalAmount: number; currency?: string; status: string; customerEmail?: string; shippingAddress?: { name: string; address: string; city: string; postalCode: string; country: string }; stripePaymentIntentId?: string; createdAt: Date; xpAwarded?: boolean }[]>()
    : []
  const userOrders: OrderData[] = userOrdersRaw.map(o => ({
    _id: o._id.toString(),
    items: o.items.map(i => ({ ...i, productId: i.productId?.toString() ?? '' })),
    totalAmount: o.totalAmount,
    currency: o.currency,
    status: o.status,
    customerEmail: o.customerEmail,
    shippingAddress: o.shippingAddress,
    stripePaymentIntentId: o.stripePaymentIntentId,
    createdAt: o.createdAt.toISOString(),
    xpAwarded: o.xpAwarded,
  }))

  // Fetch own listings (all statuses except 'removed')
  const userListingsRaw = isOwnProfile
    ? await Listing.find({ userId: profileUser._id.toString(), status: { $ne: 'removed' } })
        .sort({ createdAt: -1 })
        .lean<{ _id: { toString(): string }; title: string; description: string; category: string; price: number; location?: string; status: ListingStatus; expiresAt: Date; createdAt: Date }[]>()
    : []
  const userListings = userListingsRaw.map(l => ({
    _id: l._id.toString(),
    title: l.title,
    description: l.description,
    category: l.category,
    price: l.price,
    location: l.location,
    status: l.status,
    expiresAt: l.expiresAt.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }))

  const EVENT_LABELS: Record<string, string> = {
    WATER_PLANT: '🌿 Watered plant',
    FEED_PLANT: '🧪 Fed plant',
    FORUM_QUESTION: '🔍 Asked a question',
    FIRST_PURCHASE: '🛒 First purchase',
    PROFILE_COMPLETED: '👤 Completed profile',
    GROW_COMPLETED: '🏆 Grow completed',
    FIRST_STRAIN_CHAT: '🧬 First strain chat',
    ACADEMY_ARTICLE_READ: '📚 Read article',
  }

  const userBadges = profileUser.badges ?? []
  const allBadgeIds = Object.keys(BADGES) as (keyof typeof BADGES)[]
  const earnedBadgeIds = new Set(userBadges.map(b => b.badgeId))

  const TABS: { value: Tab; label: string; icon: string }[] = [
    { value: 'overview',  label: 'Overview',                        icon: '◈' },
    { value: 'grows',     label: 'Grows',                           icon: '🌱' },
    { value: 'badges',    label: `Badges ${userBadges.length > 0 ? `· ${userBadges.length}` : ''}`,   icon: '🏆' },
    { value: 'activity',  label: 'Activity',                        icon: '⚡' },
    ...(isOwnProfile ? [{ value: 'orders'   as Tab, label: `Orders ${userOrders.length > 0 ? `· ${userOrders.length}` : ''}`,     icon: '🛒' }] : []),
    ...(isOwnProfile ? [{ value: 'listings' as Tab, label: `Listings ${userListings.length > 0 ? `· ${userListings.length}` : ''}`, icon: '🏪' }] : []),
  ]

  const cardStyle: React.CSSProperties = {
    background: '#0d0d10',
    border: '0.5px solid rgba(204,0,170,0.15)',
    borderRadius: '8px',
    padding: '20px',
  }

  return (
    <div style={{ maxWidth: '900px', overflowX: 'hidden' }}>
      <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: profileUser.username }]} color="#cc00aa" />
      {/* Banner */}
      <div style={{
        height: '120px',
        background: 'linear-gradient(135deg, rgba(204,0,170,0.12) 0%, rgba(136,68,204,0.08) 50%, rgba(5,5,8,0) 100%)',
        borderBottom: '0.5px solid rgba(204,0,170,0.15)',
        position: 'relative',
      }}>
        {/* Grid dots */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(204,0,170,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
      </div>

      {/* Profile header */}
      <div style={{ padding: '0 24px 24px', borderBottom: '0.5px solid rgba(204,0,170,0.1)' }}>
        {/* Avatar — overlaps banner */}
        <div style={{ marginTop: '-40px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(204,0,170,0.15)', border: '3px solid #050508',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-orbitron)', fontSize: '24px', fontWeight: 700, color: '#cc00aa',
          }}>
            {profileUser.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileUser.avatar} alt={profileUser.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : profileUser.username.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '22px', fontWeight: 700, color: '#e8f0ef', marginBottom: '4px' }}>
              {profileUser.username}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830', marginBottom: '6px' }}>
              ⚡ Level {current.level} · {current.name}
            </div>
            {profileUser.bio && (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066', maxWidth: '500px', lineHeight: 1.6, marginBottom: '8px' }}>
                {profileUser.bio}
              </div>
            )}
            {profileUser.location && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginBottom: '6px' }}>
                📍 {profileUser.location}
              </div>
            )}
            {/* Links */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {profileUser.links?.instagram && (
                <a href={`https://instagram.com/${profileUser.links.instagram}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 10px' }}
                  className="hover:text-[#cc00aa] hover:border-[rgba(204,0,170,0.3)]">
                  @{profileUser.links.instagram}
                </a>
              )}
              {profileUser.links?.website && (
                <a href={profileUser.links.website} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 10px' }}
                  className="hover:text-[#00d4c8] hover:border-[rgba(0,212,200,0.3)]">
                  🌐 Website
                </a>
              )}
            </div>
          </div>

          {/* Action button */}
          {isOwnProfile ? (
            <Link
              href="/hub/settings"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#4a6066', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '8px 16px', textDecoration: 'none', transition: 'all 0.2s' }}
              className="hover:border-[rgba(204,0,170,0.4)] hover:text-[#cc00aa]"
            >
              Edit Profile
            </Link>
          ) : (
            <button
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#cc00aa', background: 'rgba(204,0,170,0.1)', border: '0.5px solid rgba(204,0,170,0.3)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
              className="hover:bg-[rgba(204,0,170,0.2)]"
            >
              + Follow
            </button>
          )}
        </div>

        {/* XP bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>{profileUser.xp.toLocaleString()} XP</span>
            {next && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>→ {next.name}</span>}
          </div>
          <div style={{ height: '3px', background: 'rgba(240,168,48,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #f0a830, #ffc040)', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Grows', value: profileUser.growsCompleted },
            { label: 'Followers', value: (profileUser.followers ?? []).length },
            { label: 'Following', value: (profileUser.following ?? []).length },
            { label: 'Badges', value: userBadges.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#e8f0ef' }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet section — own profile only */}
      {isOwnProfile && (
        <div style={{ padding: '0 24px', marginTop: '20px' }}>
          <WalletSection
            walletAddress={profileUser.walletAddress ?? ''}
            userId={profileUser._id.toString()}
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{ position: 'relative', marginTop: '20px', borderBottom: '0.5px solid rgba(204,0,170,0.1)' }}>
        {/* Fade hint — right edge */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: '1px',
          width: '48px', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(to right, transparent, #050508)',
        }} />
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 16px 10px' }}>
        {TABS.map(({ value, label, icon }) => {
          const active = tab === value
          return (
          <Link
            key={value}
            href={`/hub/profile/${profileUser.username}?tab=${value}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px',
              background: active ? '#cc00aa' : 'rgba(204,0,170,0.07)',
              color: active ? '#050508' : '#4a6066',
              border: `0.5px solid ${active ? 'transparent' : 'rgba(204,0,170,0.14)'}`,
              fontWeight: active ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '12px', lineHeight: 1 }}>{icon}</span>
            {label}
          </Link>
        )})}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Showcase badges */}
            {userBadges.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '14px' }}>
                  Badges Earned
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {userBadges.slice(0, 6).map(b => {
                    const badge = BADGES[b.badgeId as keyof typeof BADGES]
                    if (!badge) return null
                    return (
                      <div key={b.badgeId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px', background: 'rgba(204,0,170,0.06)', border: '0.5px solid rgba(204,0,170,0.2)', borderRadius: '6px', minWidth: '70px' }}>
                        <span style={{ fontSize: '22px' }}>{badge.icon}</span>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#e8f0ef', textAlign: 'center' }}>{badge.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div style={cardStyle}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(204,0,170,0.5)', marginBottom: '14px' }}>
                Recent Activity
              </div>
              {recentXP.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentXP.map((evt, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
                        {EVENT_LABELS[evt.event] ?? evt.event}
                      </span>
                      <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '11px', color: '#f0a830' }}>
                        +{evt.amount} XP
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>No activity yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Grows */}
        {tab === 'grows' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066' }}>
              {profileUser.growsCompleted > 0
                ? `${profileUser.growsCompleted} grows completed`
                : 'No grows yet — start a Grow Simulation to see results here.'}
            </div>
            {isOwnProfile && (
              <Link href="/hub/grow" style={{ display: 'inline-block', marginTop: '16px', fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#cc00aa', borderRadius: '4px', padding: '9px 20px', textDecoration: 'none', transition: 'all 0.2s' }}
                className="hover:bg-[#e000bb]">
                Start a Grow →
              </Link>
            )}
          </div>
        )}

        {/* Badges */}
        {tab === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {allBadgeIds.map(id => {
              const badge = BADGES[id]
              const earned = earnedBadgeIds.has(id)
              return (
                <div key={id} style={{
                  padding: '16px', borderRadius: '6px', textAlign: 'center',
                  background: earned ? 'rgba(204,0,170,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `0.5px solid ${earned ? 'rgba(204,0,170,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: earned ? 1 : 0.45,
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px', filter: earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: earned ? '#e8f0ef' : '#4a6066', marginBottom: '4px' }}>{badge.name}</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: '#4a6066', lineHeight: 1.4 }}>{badge.condition}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Activity */}
        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentXP.length > 0 ? recentXP.map((evt, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(13,13,16,0.8)', border: '0.5px solid rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef' }}>
                  {EVENT_LABELS[evt.event] ?? evt.event}
                </span>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#f0a830' }}>+{evt.amount} XP</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                    {new Date(evt.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', padding: '20px 0' }}>No activity yet.</div>
            )}
          </div>
        )}

        {/* Listings — own profile only */}
        {tab === 'listings' && isOwnProfile && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                {userListings.length} listing{userListings.length !== 1 ? 's' : ''}
              </div>
              <Link
                href="/hub/marketplace/new"
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: '4px', padding: '6px 14px', textDecoration: 'none', transition: 'all 0.15s' }}
                className="hover:bg-[rgba(240,168,48,0.08)]"
              >
                + New Listing
              </Link>
            </div>
            <MyListingActions initialListings={userListings} />
          </div>
        )}

        {/* Orders — own profile only */}
        {tab === 'orders' && isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {userOrders.length === 0 ? (
              <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', marginBottom: '14px' }}>No orders yet.</div>
                <Link href="/shop" style={{ fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '8px 16px', textDecoration: 'none' }}>
                  Go to Shop →
                </Link>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', marginBottom: '6px' }}>
                  {userOrders.length} order{userOrders.length !== 1 ? 's' : ''} · click any row to expand
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userOrders.map((order) => <OrderCard key={order._id} order={order} />)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
