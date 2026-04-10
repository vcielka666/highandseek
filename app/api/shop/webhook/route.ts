import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    await connectDB()

    // Avoid double-processing
    const exists = await Order.findOne({ stripePaymentIntentId: pi.id })
    if (exists) return NextResponse.json({ received: true })

    const metadata = pi.metadata as {
      customerEmail: string
      shippingName: string
      userId?: string
      orderItems?: string
    }

    // Parse serialised order items if present
    let items: { productId: string; name: string; quantity: number; price: number }[] = []
    try {
      if (metadata.orderItems) items = JSON.parse(metadata.orderItems)
    } catch { /* no items in metadata — fallback */ }

    const order = await Order.create({
      items,
      totalAmount: pi.amount / 100,
      currency: pi.currency,
      customerEmail: metadata.customerEmail ?? '',
      shippingAddress: {
        name:       metadata.shippingName ?? '',
        address:    '',
        city:       '',
        postalCode: '',
        country:    '',
      },
      stripePaymentIntentId: pi.id,
      status: 'paid',
      userId: metadata.userId ?? null,
    })

    // Award XP to logged-in user
    if (metadata.userId) {
      await User.findByIdAndUpdate(metadata.userId, { $inc: { xp: 50 } })
      await Order.findByIdAndUpdate(order._id, { xpAwarded: true })
    }
  }

  return NextResponse.json({ received: true })
}
