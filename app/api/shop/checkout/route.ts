import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

const itemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
})

const schema = z.object({
  items: z.array(itemSchema).min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.object({
    name:       z.string().min(1),
    address:    z.string().min(1),
    city:       z.string().min(1),
    postalCode: z.string().min(1),
    country:    z.string().length(2),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { items, customerEmail, shippingAddress } = parsed.data
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const amountCents = Math.round(totalAmount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      receipt_email: customerEmail,
      metadata: {
        customerEmail,
        shippingName: shippingAddress.name,
        itemCount: String(items.length),
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[POST /api/shop/checkout]', err)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
