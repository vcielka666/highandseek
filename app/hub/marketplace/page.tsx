import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import MarketplaceAddButton from '@/components/hub/MarketplaceAddButton'
import ListingOwnerActions from '@/components/hub/ListingOwnerActions'
import type { ListingCategory } from '@/lib/db/models/Listing'

const CATEGORY_ICONS: Record<ListingCategory | 'all', string> = {
  all: '🏪', equipment: '🔧', clones: '🌿', seeds: '🌱', nutrients: '🧪', art: '🎨', other: '📦',
}

const PAGE_SIZE = 20

export default async function MarketplacePage(props: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/marketplace')

  const { category: rawCat, page: rawPage } = await props.searchParams
  const VALID_CATS = ['equipment', 'clones', 'seeds', 'nutrients', 'art', 'other'] as const
  const category = VALID_CATS.includes(rawCat as ListingCategory) ? (rawCat as ListingCategory) : undefined
  const page = Math.max(1, parseInt(rawPage ?? '1'))

  const { locale, t } = await getServerT()
  const m = t.marketplace

  const catLabels: Record<string, string> = {
    all: m.catAll, equipment: m.catEquipment, clones: m.catClones,
    seeds: m.catSeeds, nutrients: m.catNutrients, art: m.catArt, other: m.catOther,
  }

  await connectDB()

  // Auto-expire
  await Listing.updateMany(
    { status: 'active', expiresAt: { $lt: new Date() } },
    { $set: { status: 'expired' } },
  )

  const filter: Record<string, unknown> = { status: 'active' }
  if (category) filter.category = category

  const [listingsRaw, total, boostedSlotsUsed] = await Promise.all([
    Listing.find(filter)
      .sort({ featuredUntil: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<Array<{
        _id: { toString(): string }
        userId: { toString(): string }
        title: string
        description: string
        category: ListingCategory
        price: number
        location?: string
        images: string[]
        contact: { telegram?: string; signal?: string; threema?: string; email?: string }
        expiresAt: Date
        featuredUntil: Date | null
        createdAt: Date
      }>>(),
    Listing.countDocuments(filter),
    Listing.countDocuments({ status: 'active', featuredUntil: { $gt: new Date() } }),
  ])

  // Populate user info
  const userIds = [...new Set(listingsRaw.map(l => l.userId.toString()))]
  const users = await User.find({ _id: { $in: userIds } })
    .select('username avatar')
    .lean<{ _id: { toString(): string }; username: string; avatar: string }[]>()
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  const now = Date.now()
  const listings = listingsRaw.map(l => ({
    ...l,
    _id: l._id.toString(),
    userId: l.userId.toString(),
    postedBy: userMap.get(l.userId.toString()),
    daysLeft: Math.max(0, Math.ceil((l.expiresAt.getTime() - now) / 86_400_000)),
    isFeatured: !!(l.featuredUntil && l.featuredUntil.getTime() > now),
    featuredUntil: l.featuredUntil ?? null,
  }))

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ maxWidth: '960px' }} className="px-4 pt-4 pb-20 md:px-7 md:pt-7">
      <Breadcrumb
        items={[{ label: 'Hub', href: '/hub' }, { label: m.title }]}
        color="#cc00aa"
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, color: '#e8f0ef', letterSpacing: '2px', marginBottom: '6px' }}>
            {m.title}
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
            {m.subtitle}
          </p>
        </div>
        <MarketplaceAddButton label={m.addListing} />
      </div>

      {/* Credits info */}
      <div style={{ padding: '16px', background: 'rgba(136,68,204,0.05)', border: '0.5px solid rgba(136,68,204,0.15)', borderRadius: '6px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', letterSpacing: '1px', marginBottom: '8px' }}>
              💎 {m.creditsBoxTitle}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: 'rgba(232,240,239,0.6)', lineHeight: 1.7 }}>
              {m.creditsBoxDesc}
            </div>
          </div>
          <a href="/hub/credits" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', textDecoration: 'none', border: '0.5px solid rgba(136,68,204,0.3)', borderRadius: '3px', padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start' }}
            className="hover:bg-[rgba(136,68,204,0.1)]">
            {m.buyCreditsBtn}
          </a>
        </div>
        {/* Use cases */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          {[
            { icon: '🛒', label: m.creditUse1 },
            { icon: '📋', label: m.creditUse2 },
            { icon: '🎓', label: m.creditUse3 },
            { icon: '🌱', label: m.creditUse4 },
          ].map(item => (
            <div key={item.label} style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
              color: '#4a6066', background: 'rgba(136,68,204,0.06)',
              border: '0.5px solid rgba(136,68,204,0.12)',
              borderRadius: '3px', padding: '4px 10px',
            }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {(['all', ...VALID_CATS] as const).map(cat => {
          const active = cat === 'all' ? !category : category === cat
          const href = cat === 'all' ? '/hub/marketplace' : `/hub/marketplace?category=${cat}`
          return (
            <Link
              key={cat}
              href={href}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px',
                textTransform: 'uppercase', padding: '6px 14px', borderRadius: '4px',
                textDecoration: 'none', transition: 'all 0.15s',
                color: active ? '#050508' : '#4a6066',
                background: active ? '#cc00aa' : 'transparent',
                border: `0.5px solid ${active ? '#cc00aa' : 'rgba(74,96,102,0.3)'}`,
              }}
            >
              {CATEGORY_ICONS[cat]} {catLabels[cat]}
            </Link>
          )
        })}
      </div>

      {/* Featured slots banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', padding: '10px 14px', background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.15)', borderRadius: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>⚡</span>
          <div>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', letterSpacing: '1px' }}>
              {m.featuredTitle} —
            </span>
            {' '}
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
              {m.featuredSlots(boostedSlotsUsed)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: i < boostedSlotsUsed ? '#f0a830' : 'rgba(240,168,48,0.15)', border: '0.5px solid rgba(240,168,48,0.3)' }} />
          ))}
        </div>
      </div>

      {/* Listing grid */}
      {listings.length === 0 ? (
        <div style={{ background: '#0d0d10', border: '0.5px solid rgba(204,0,170,0.15)', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>🏪</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#4a6066', marginBottom: '16px' }}>{m.noListings}</div>
          <Link href="/hub/marketplace/new" style={{ fontFamily: 'var(--font-cacha)', fontSize: '13px', letterSpacing: '1px', color: '#050508', background: '#f0a830', borderRadius: '4px', padding: '10px 24px', textDecoration: 'none' }}>
            {m.addListing}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {listings.map(listing => (
            <ListingCard key={listing._id} listing={listing} m={m as unknown as Record<string, string>} locale={locale} sessionUserId={session.user.id} boostedSlotsFull={boostedSlotsUsed >= 3} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/hub/marketplace?${category ? `category=${category}&` : ''}page=${p}`}
              style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
                padding: '6px 12px', borderRadius: '4px', textDecoration: 'none',
                color: p === page ? '#050508' : '#4a6066',
                background: p === page ? '#cc00aa' : 'transparent',
                border: `0.5px solid ${p === page ? '#cc00aa' : 'rgba(74,96,102,0.3)'}`,
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Listing Card ──────────────────────────────────────────────────────
type ListingData = {
  _id: string
  userId: string
  title: string
  description: string
  category: ListingCategory
  price: number
  location?: string
  images: string[]
  contact: { telegram?: string; signal?: string; threema?: string; email?: string }
  daysLeft: number
  isFeatured: boolean
  featuredUntil: Date | null
  postedBy?: { username: string; avatar: string }
}

type MTranslations = Record<string, string>

function ListingCard({
  listing, m, locale, sessionUserId, boostedSlotsFull,
}: {
  listing: ListingData
  m: MTranslations
  locale: string
  sessionUserId: string
  boostedSlotsFull: boolean
}) {
  const isOwner = listing.userId === sessionUserId
  const catLabel: Record<string, string> = {
    equipment: m.catEquipment, clones: m.catClones,
    seeds: m.catSeeds, nutrients: m.catNutrients, art: m.catArt, other: m.catOther,
  }

  return (
    <div style={{
      background: '#0d0d10',
      border: listing.isFeatured ? '0.5px solid rgba(240,168,48,0.45)' : '0.5px solid rgba(255,255,255,0.06)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s',
      boxShadow: listing.isFeatured ? '0 0 12px rgba(240,168,48,0.08)' : 'none',
    }}
      className={listing.isFeatured ? '' : 'hover:border-[rgba(204,0,170,0.25)]'}
    >
      {/* Image or category icon */}
      <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '48px', opacity: 0.3 }}>{CATEGORY_ICONS[listing.category]}</span>
        )}
        {/* Category badge */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase',
          color: '#4a6066', background: 'rgba(5,5,8,0.8)', border: '0.5px solid rgba(255,255,255,0.08)',
          padding: '3px 8px', borderRadius: '3px',
        }}>
          {catLabel[listing.category] ?? listing.category}
        </span>
        {/* Featured badge */}
        {listing.isFeatured && (
          <span style={{
            position: 'absolute', top: '10px', right: isOwner ? '70px' : '10px',
            fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px',
            color: '#050508', background: '#f0a830',
            padding: '3px 8px', borderRadius: '3px',
          }}>
            ⚡ {locale === 'cs' ? 'Zvýrazněno' : 'Featured'}
          </span>
        )}
        {isOwner && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px',
            color: '#f0a830', background: 'rgba(240,168,48,0.15)', border: '0.5px solid rgba(240,168,48,0.3)',
            padding: '3px 8px', borderRadius: '3px',
          }}>
            {locale === 'cs' ? 'Tvůj' : 'Yours'}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Title */}
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', fontWeight: 700, color: '#e8f0ef', lineHeight: 1.3 }}>
          {listing.title}
        </div>

        {/* Description */}
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.description}
        </div>

        {/* Price */}
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: listing.price === 0 ? '#00d4c8' : '#f0a830' }}>
          {listing.price === 0 ? m.free : `${listing.price.toLocaleString('cs-CZ')} Kč`}
        </div>

        {/* Location + expiry */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {listing.location ? (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
              📍 {listing.location}
            </span>
          ) : <span />}
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: listing.daysLeft <= 5 ? '#f0a830' : '#2a3a3e' }}>
            {m.expiresIn} {listing.daysLeft} {m.days}
          </span>
        </div>

        {/* Contact section */}
        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {listing.contact.telegram && (
            <a
              href={`https://t.me/${listing.contact.telegram.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '3px', padding: '4px 8px', textDecoration: 'none', transition: 'all 0.15s' }}
              className="hover:text-[#cc00aa] hover:border-[rgba(204,0,170,0.4)]"
            >
              ✈ {listing.contact.telegram}
            </a>
          )}
          {listing.contact.email && (
            <a
              href={`mailto:${listing.contact.email}`}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '3px', padding: '4px 8px', textDecoration: 'none', transition: 'all 0.15s' }}
              className="hover:text-[#cc00aa] hover:border-[rgba(204,0,170,0.4)]"
            >
              ✉ {listing.contact.email}
            </a>
          )}
          {listing.contact.signal && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '3px', padding: '4px 8px' }}>
              🔒 {listing.contact.signal}
            </span>
          )}
          {listing.contact.threema && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', border: '0.5px solid rgba(74,96,102,0.3)', borderRadius: '3px', padding: '4px 8px' }}>
              🛡 {listing.contact.threema}
            </span>
          )}
          {isOwner && (
            <div style={{ marginLeft: 'auto' }}>
              <ListingOwnerActions
                listingId={listing._id}
                locale={locale}
                isFeatured={listing.isFeatured}
                boostedSlotsFull={boostedSlotsFull}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
