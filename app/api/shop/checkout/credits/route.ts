import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { spendCredits } from '@/lib/credits'
import { awardXP } from '@/lib/xp'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import { sendOrderConfirmation } from '@/lib/email/order-confirmation'

// 1 credit = CREDIT_TO_CZK Kč when paying in the shop
export const CREDIT_TO_CZK = 25

const schema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name:      z.string(),
    quantity:  z.number().int().min(1),
    price:     z.number().min(0),
  })).min(1),
  customerEmail: z.string().email(),
  telegramContact: z.string().max(50).optional(),
  shippingAddress: z.object({
    name:       z.string().default(''),
    address:    z.string().default(''),
    city:       z.string().default(''),
    postalCode: z.string().default(''),
    country:    z.string().default('CZ'),
  }),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { items, customerEmail, telegramContact, shippingAddress } = parsed.data
  const totalCZK    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const creditsNeeded = Math.ceil(totalCZK / CREDIT_TO_CZK)

  await connectDB()

  const user = await User.findById(session.user.id).select('credits').lean<{ credits: number }>()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.credits < creditsNeeded) {
    return NextResponse.json({
      error: 'Insufficient credits',
      have: user.credits,
      need: creditsNeeded,
    }, { status: 402 })
  }

  await spendCredits(session.user.id, creditsNeeded, 'shop_purchase_credits')

  const order = await Order.create({
    items,
    totalAmount:    totalCZK,
    currency:       'czk',
    customerEmail,
    shippingAddress,
    stripePaymentIntentId: '',
    status:         'paid',
    userId:         session.user.id,
    telegramContact: telegramContact ?? '',
  })

  await awardXP(session.user.id, 'FIRST_PURCHASE').catch(() => null)

  // Send confirmation email — non-blocking
  sendOrderConfirmation({
    to: customerEmail,
    orderId: order._id.toString(),
    items,
    totalAmount: totalCZK,
    shippingAddress,
    paidWithCredits: true,
  }).catch((err) => console.error('[credits checkout] email send failed', err))

  return NextResponse.json({ orderId: order._id.toString(), creditsSpent: creditsNeeded }, { status: 201 })
}
