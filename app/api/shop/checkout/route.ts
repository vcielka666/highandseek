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
  userId: z.string().optional(),
  shippingAddress: z.object({
    name:       z.string().optional().default(''),
    address:    z.string().optional().default(''),
    city:       z.string().optional().default(''),
    postalCode: z.string().optional().default(''),
    country:    z.string().optional().default('CZ'),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { items, customerEmail, userId } = parsed.data
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    // CZK smallest unit is haléř (×100)
    const amountHalers = Math.round(totalAmount * 100)

    const metadata: Record<string, string> = {
      customerEmail,
      orderItems: JSON.stringify(items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }))).slice(0, 490),
    }
    if (userId) metadata.userId = userId

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountHalers,
      currency: 'czk',
      receipt_email: customerEmail,
      metadata,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[POST /api/shop/checkout]', err)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
