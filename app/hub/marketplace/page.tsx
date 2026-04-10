import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
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

  const [listingsRaw, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1 })
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
        contact: { telegram?: string; signal?: string; threema?: string }
        expiresAt: Date
        createdAt: Date
      }>>(),
    Listing.countDocuments(filter),
  ])

  // Populate user info
  const userIds = [...new Set(listingsRaw.map(l => l.userId.toString()))]
  const users = await User.find({ _id: { $in: userIds } })
    .select('username avatar')
    .lean<{ _id: { toString(): string }; username: string; avatar: string }[]>()
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  const listings = listingsRaw.map(l => ({
    ...l,
    _id: l._id.toString(),
    userId: l.userId.toString(),
    postedBy: userMap.get(l.userId.toString()),
    daysLeft: Math.max(0, Math.ceil((l.expiresAt.getTime() - Date.now()) / 86_400_000)),
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
        <Link
          href="/hub/marketplace/new"
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
            color: '#050508', background: '#f0a830',
            padding: '10px 18px', borderRadius: '4px', textDecoration: 'none',
            transition: 'opacity 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
          }}
          className="hover:opacity-90"
        >
          {m.addListing}
        </Link>
      </div>

      {/* Credits info */}
      <div style={{ padding: '12px 16px', background: 'rgba(136,68,204,0.05)', border: '0.5px solid rgba(136,68,204,0.15)', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', letterSpacing: '1px' }}>
            💎 {locale === 'cs' ? 'Kredity jsou in-hub měna H&S' : 'Credits are the H&S in-hub currency'} —
          </span>
          {' '}
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
            {locale === 'cs'
              ? 'získej je kvízy a growy, nebo si je kup. Slouží k inzerci, opakování kvízů a prémiových funkcích.'
              : 'earn them through quizzes and grows, or buy them. Used for listings, quiz retries, and premium features.'}
          </span>
        </div>
        <a href="/hub/credits" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#8844cc', textDecoration: 'none', border: '0.5px solid rgba(136,68,204,0.3)', borderRadius: '3px', padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
          className="hover:bg-[rgba(136,68,204,0.1)]">
          {locale === 'cs' ? 'Koupit kredity →' : 'Buy credits →'}
        </a>
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
            <ListingCard key={listing._id} listing={listing} m={m as Record<string, string>} locale={locale} sessionUserId={session.user.id} />
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
  contact: { telegram?: string; signal?: string; threema?: string }
  daysLeft: number
  postedBy?: { username: string; avatar: string }
}

type MTranslations = Record<string, string>

function ListingCard({
  listing, m, locale, sessionUserId,
}: {
  listing: ListingData
  m: MTranslations
  locale: string
  sessionUserId: string
}) {
  const isOwner = listing.userId === sessionUserId
  const catLabel: Record<string, string> = {
    equipment: m.catEquipment, clones: m.catClones,
    seeds: m.catSeeds, nutrients: m.catNutrients, art: m.catArt, other: m.catOther,
  }

  return (
    <div style={{
      background: '#0d0d10',
      border: '0.5px solid rgba(255,255,255,0.06)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s',
    }}
      className="hover:border-[rgba(204,0,170,0.25)]"
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
          {listing.price === 0 ? m.free : `€${listing.price}`}
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
        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
        </div>
      </div>
    </div>
  )
}
