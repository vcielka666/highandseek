import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/db/connect'
import { awardCredits } from '@/lib/credits/index'
import CreditEvent from '@/lib/db/models/CreditEvent'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CREDITS_WEBHOOK_SECRET ?? '')
  } catch (err) {
    console.error('[credits/stripe-webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session

    if (checkoutSession.metadata?.type !== 'credits') {
      return NextResponse.json({ received: true })
    }

    const userId  = checkoutSession.metadata.userId
    const credits = parseInt(checkoutSession.metadata.credits ?? '0', 10)
    const reason  = `Credit purchase via Stripe session:${checkoutSession.id}`

    if (!userId || !credits) {
      return NextResponse.json({ received: true })
    }

    try {
      await connectDB()

      // Idempotency — check if this session was already processed
      const alreadyProcessed = await CreditEvent.findOne({ reason })
      if (alreadyProcessed) return NextResponse.json({ received: true })

      await awardCredits(userId, credits, reason)
    } catch (err) {
      console.error('[credits/stripe-webhook] failed to award credits', err)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
