import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import { sendTelegramMessage, formatOrderConfirmation } from '@/lib/notifications/telegram'
import { sendOrderConfirmation } from '@/lib/email/order-confirmation'

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
      customerEmail:   string
      userId?:         string
      orderItems?:     string
      telegramContact?: string
    }

    let items: { productId: string; name: string; quantity: number; price: number }[] = []
    try {
      if (metadata.orderItems) items = JSON.parse(metadata.orderItems)
    } catch { /* fallback to empty */ }

    const shipping = pi.shipping
    const totalAmount = pi.amount / 100 // haléře → CZK

    const order = await Order.create({
      items,
      totalAmount,
      currency: pi.currency,
      customerEmail: metadata.customerEmail ?? '',
      shippingAddress: {
        name:       shipping?.name ?? '',
        address:    shipping?.address?.line1 ?? '',
        city:       shipping?.address?.city ?? '',
        postalCode: shipping?.address?.postal_code ?? '',
        country:    shipping?.address?.country ?? '',
      },
      stripePaymentIntentId: pi.id,
      status: 'paid',
      userId: metadata.userId ?? null,
      telegramContact: metadata.telegramContact ?? '',
    })

    // Telegram notification — must never throw
    sendTelegramMessage(formatOrderConfirmation({
      _id:                  order._id,
      customerEmail:        order.customerEmail,
      shippingAddress:      order.shippingAddress,
      items:                items,
      totalAmount:          order.totalAmount,
      stripePaymentIntentId: pi.id,
      telegramContact:      metadata.telegramContact,
    })).catch((err) => console.error('[webhook] telegram failed', err))

    // Award XP to logged-in user
    if (metadata.userId) {
      await User.findByIdAndUpdate(metadata.userId, { $inc: { xp: 50 } })
      await Order.findByIdAndUpdate(order._id, { xpAwarded: true })
    }

    // Send confirmation email
    const email = metadata.customerEmail
    if (email) {
      sendOrderConfirmation({
        to: email,
        orderId: order._id.toString(),
        items,
        totalAmount,
        shippingAddress: shipping?.address ? {
          name:       shipping.name ?? '',
          address:    shipping.address.line1 ?? '',
          city:       shipping.address.city ?? '',
          postalCode: shipping.address.postal_code ?? '',
          country:    shipping.address.country ?? '',
        } : undefined,
      }).catch((err) => console.error('[webhook] email send failed', err))
    }
  }

  return NextResponse.json({ received: true })
}
