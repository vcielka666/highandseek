import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import CreditEvent from '@/lib/db/models/CreditEvent'
import { awardCredits } from '@/lib/credits/index'
import { getServerT } from '@/lib/i18n/server'
import Breadcrumb from '@/components/ui/Breadcrumb'
import BuyCreditsClient from '@/components/hub/BuyCreditsClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

const PACKAGES = [
  { credits: 5,  usd: 5,  label: '5 Credits' },
  { credits: 15, usd: 15, label: '15 Credits' },
  { credits: 30, usd: 30, label: '30 Credits' },
  { credits: 50, usd: 50, label: '50 Credits' },
]

export default async function CreditsPage(props: {
  searchParams: Promise<{ success?: string; cancelled?: string; session_id?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/credits')

  const { success, cancelled, session_id } = await props.searchParams

  const { t } = await getServerT()
  const cr = t.credits

  await connectDB()

  // Award credits if returning from successful Stripe checkout
  if (success && session_id) {
    try {
      const reason = `Credit purchase via Stripe session:${session_id}`
      const alreadyProcessed = await CreditEvent.findOne({ reason })
      if (!alreadyProcessed) {
        const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
        if (
          checkoutSession.payment_status === 'paid' &&
          checkoutSession.metadata?.type === 'credits' &&
          checkoutSession.metadata.userId === session.user.id
        ) {
          const credits = parseInt(checkoutSession.metadata.credits ?? '0', 10)
          if (credits > 0) await awardCredits(session.user.id, credits, reason)
        }
      }
    } catch {
      // Non-blocking — page still loads
    }
  }

  const userDoc = await User.findById(session.user.id)
    .select('credits walletAddress')
    .lean<{ credits?: number; walletAddress?: string }>()

  const balance       = userDoc?.credits ?? 0
  const walletAddress = userDoc?.walletAddress ?? ''

  return (
    <div style={{ maxWidth: '700px' }} className="px-4 pt-4 pb-20 md:px-7 md:pt-7">
      <Breadcrumb
        items={[{ label: 'Hub', href: '/hub' }, { label: cr.title }]}
        color="#8844cc"
      />

      {/* Success / cancelled banners */}
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,212,200,0.06)', border: '0.5px solid rgba(0,212,200,0.25)', borderRadius: '6px', marginBottom: '20px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#00d4c8' }}>
          {cr.successPurchase}
        </div>
      )}
      {cancelled && (
        <div style={{ padding: '12px 16px', background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '6px', marginBottom: '20px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830' }}>
          {cr.cancelledPurchase}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#e8f0ef', letterSpacing: '2px', marginBottom: '8px' }}>
          {cr.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#4a6066' }}>
          {cr.subtitle}
        </p>
      </div>

      {/* Big balance display */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
          {cr.balance}
        </div>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700, color: '#f0a830', lineHeight: 1 }}>
          💎 {balance}
        </div>
      </div>

      <BuyCreditsClient
        packages={PACKAGES}
        balance={balance}
        walletAddress={walletAddress}
        userId={session.user.id}
      />
    </div>
  )
}
