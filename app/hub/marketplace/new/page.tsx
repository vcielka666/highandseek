import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'
import { CREDIT_COSTS } from '@/lib/credits/index'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import NewListingForm from '@/components/hub/NewListingForm'

export default async function NewListingPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/marketplace/new')

  const { locale, t } = await getServerT()
  const m = t.marketplace

  let userCredits = 0
  let isFirstListing = true

  try {
    await connectDB()
    const [userDoc, existingCount] = await Promise.all([
      User.findById(session.user.id).select('credits').lean<{ credits?: number }>(),
      Listing.countDocuments({ userId: session.user.id, status: { $ne: 'removed' } }),
    ])
    userCredits = userDoc?.credits ?? 0
    isFirstListing = existingCount === 0
  } catch (err) {
    console.error('[marketplace/new] DB error:', err)
    // Non-fatal — form will show with 0 credits, API will re-validate
  }

  const costForUser = isFirstListing ? 0 : CREDIT_COSTS.MARKETPLACE_POST

  return (
    <div style={{ maxWidth: '640px' }} className="px-4 pt-4 pb-20 md:px-7 md:pt-7">
      <Breadcrumb
        items={[
          { label: 'Hub', href: '/hub' },
          { label: m.title, href: '/hub/marketplace' },
          { label: m.newListing },
        ]}
        color="#cc00aa"
      />

      <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, color: '#e8f0ef', letterSpacing: '2px', marginBottom: '24px' }}>
        {m.newListing}
      </h1>

      {/* First listing free banner */}
      {isFirstListing && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(0,212,200,0.06)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '6px' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8' }}>
            {locale === 'cs' ? '✓ Tvůj první inzerát je zdarma!' : '✓ Your first listing is free!'}
          </span>
        </div>
      )}

      <NewListingForm userCredits={userCredits} COST={costForUser} />

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Link href="/hub/marketplace" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', textDecoration: 'none' }}
          className="hover:text-[#cc00aa]">
          ← {m.title}
        </Link>
      </div>
    </div>
  )
}
