import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import ErrorLog from '@/lib/db/models/ErrorLog'
import { sendTelegramMessage, formatOrderInquiry } from '@/lib/notifications/telegram'

// In-memory rate limiter: max 3 requests per IP per hour
const ipRequests = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 3
const WINDOW_MS   = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const record = ipRequests.get(ip)
  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

const cartItemSchema = z.object({
  cartKey:   z.string(),
  productId: z.string(),
  slug:      z.string(),
  name:      z.string(),
  price:     z.number().min(0),
  image:     z.string(),
  quantity:  z.number().int().min(1),
})

const schema = z.object({
  telegramContact: z
    .string()
    .min(3, 'Contact is too short')
    .max(50, 'Contact is too long')
    .refine(
      (v) => v.startsWith('@') || v.startsWith('+') || /^\d+$/.test(v),
      'Must start with @ (username) or + / digits (phone)'
    ),
  items:    z.array(cartItemSchema).min(1),
  subtotal: z.number().min(0),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in an hour.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { telegramContact, items, subtotal } = parsed.data

  await connectDB()

  // Audit log
  await ErrorLog.create({
    message:  `Cart inquiry from ${ip} — Telegram: ${telegramContact}`,
    route:    '/api/shop/cart/inquiry',
    severity: 'low',
    action:   'cart.inquiry',
  }).catch(() => { /* non-blocking */ })

  await sendTelegramMessage(formatOrderInquiry({ telegramContact, items, subtotal }))

  return NextResponse.json({ success: true })
}
