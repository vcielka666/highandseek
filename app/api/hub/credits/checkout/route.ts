import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import Stripe from 'stripe'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

const VALID_PACKAGES = [5, 15, 30, 50] as const

const BodySchema = z.object({
  credits: z.number().refine(v => (VALID_PACKAGES as readonly number[]).includes(v), {
    message: 'Invalid credit package',
  }),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const { credits } = parsed.data

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: credits * 100,
          product_data: { name: `${credits} High & Seek Credits` },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/hub/credits?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/hub/credits?cancelled=1`,
      metadata: {
        type:    'credits',
        userId:  session.user.id,
        credits: String(credits),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[credits/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
