import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import { sendTelegramMessage, formatOrderConfirmation } from '@/lib/notifications/telegram'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

const resend = new Resend(process.env.RESEND_API_KEY)

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
      const itemRows = items.map((i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;font-family:monospace;font-size:13px;color:#e8f0ef;">${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;text-align:center;font-family:monospace;font-size:13px;color:#4a6066;">×${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;text-align:right;font-family:monospace;font-size:13px;color:#00d4c8;">${(i.price * i.quantity).toLocaleString('cs-CZ')} Kč</td>
        </tr>`
      ).join('')

      await resend.emails.send({
        from: 'High & Seek <orders@highandseeek.com>',
        to: email,
        subject: `Order confirmed — #${order._id.toString().slice(-6).toUpperCase()}`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#050508;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:22px;letter-spacing:4px;color:#00d4c8;font-family:monospace;font-weight:bold;">
        HIGH &amp; SEEK
      </div>
      <div style="font-size:10px;letter-spacing:3px;color:#4a6066;margin-top:4px;text-transform:uppercase;">
        Order Confirmation
      </div>
    </div>

    <!-- Card -->
    <div style="background:#0d0d10;border:0.5px solid rgba(0,212,200,0.2);border-radius:8px;padding:28px;">
      <div style="font-size:12px;color:#4a6066;font-family:monospace;letter-spacing:1px;margin-bottom:4px;">
        ORDER
      </div>
      <div style="font-size:20px;color:#e8f0ef;font-family:monospace;font-weight:bold;margin-bottom:20px;">
        #${order._id.toString().slice(-6).toUpperCase()}
      </div>

      <p style="font-size:14px;color:rgba(232,240,239,0.7);line-height:1.6;margin:0 0 24px;">
        Your order has been received and is being prepared. We'll notify you when it ships.
      </p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="text-align:left;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Item</th>
            <th style="text-align:center;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Qty</th>
            <th style="text-align:right;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Total -->
      <div style="display:flex;justify-content:space-between;padding-top:12px;">
        <span style="font-family:monospace;font-size:11px;letter-spacing:1px;color:#4a6066;text-transform:uppercase;">Total</span>
        <span style="font-family:monospace;font-size:18px;font-weight:bold;color:#00d4c8;">${totalAmount.toLocaleString('cs-CZ')} Kč</span>
      </div>

      ${shipping?.address?.city ? `
      <!-- Shipping -->
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(0,212,200,0.08);">
        <div style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;margin-bottom:8px;">Ships to</div>
        <div style="font-size:13px;color:rgba(232,240,239,0.7);line-height:1.8;font-family:monospace;">
          ${shipping.name ?? ''}<br/>
          ${shipping.address?.line1 ?? ''}<br/>
          ${shipping.address?.postal_code ?? ''} ${shipping.address?.city ?? ''}<br/>
          ${shipping.address?.country ?? ''}
        </div>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;font-family:monospace;font-size:10px;color:#2a3a3e;line-height:1.8;">
      High & Seek · CBD products only<br/>
      Questions? Reply to this email.
    </div>
  </div>
</body>
</html>`,
      }).catch((err) => console.error('[webhook] email send failed', err))
    }
  }

  return NextResponse.json({ received: true })
}
