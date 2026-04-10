import { connectDB } from '@/lib/db/connect'
import ErrorLog from '@/lib/db/models/ErrorLog'
import type { CartItem } from '@/types/shop'

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  ?? ''
const CHAT_ID    = process.env.TELEGRAM_CHAT_ID    ?? ''

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping')
    return
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Telegram API ${res.status}: ${err}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[telegram] sendMessage failed:', message)
    try {
      await connectDB()
      await ErrorLog.create({
        message: `Telegram send failed: ${message}`,
        route:   'lib/notifications/telegram',
        severity: 'low',
        action:  'telegram.send_failed',
      })
    } catch {
      // never block caller
    }
  }
}

export function formatOrderInquiry(data: {
  telegramContact: string
  items: CartItem[]
  subtotal: number
}): string {
  const { telegramContact, items, subtotal } = data
  const timestamp = new Date().toLocaleString('cs-CZ', {
    timeZone:  'Europe/Prague',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const itemLines = items
    .map((i) => `• ${i.name} ×${i.quantity} — ${(i.price * i.quantity).toLocaleString('cs-CZ')} Kč`)
    .join('\n')

  return [
    `📲 <b>NOVÝ DOTAZ PŘES TELEGRAM</b>`,
    ``,
    `👤 Kontakt: ${telegramContact}`,
    ``,
    `📦 <b>Zájem o:</b>`,
    itemLines,
    ``,
    `💰 <b>Celkem: ${subtotal.toLocaleString('cs-CZ')} Kč</b>`,
    ``,
    `⏰ ${timestamp}`,
    `<i>Zákazník si přeje být kontaktován.</i>`,
  ].join('\n')
}

interface OrderSummary {
  _id:                  { toString: () => string }
  customerEmail:        string
  shippingAddress:      { city: string; country: string }
  items:                Array<{ name: string; quantity: number; price: number }>
  totalAmount:          number
  stripePaymentIntentId: string
  telegramContact?:     string
}

export function formatOrderConfirmation(order: OrderSummary): string {
  const orderId   = order._id.toString().slice(-6).toUpperCase()
  const piShort   = order.stripePaymentIntentId.slice(0, 20) + '…'
  const telegram  = order.telegramContact ?? '—'
  const timestamp = new Date().toLocaleString('cs-CZ', {
    timeZone:  'Europe/Prague',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const itemLines = order.items
    .map((i) => `• ${i.name} ×${i.quantity} — ${(i.price * i.quantity).toLocaleString('cs-CZ')} Kč`)
    .join('\n')

  return [
    `✅ <b>NOVÁ OBJEDNÁVKA #${orderId}</b>`,
    ``,
    `👤 ${order.customerEmail}`,
    `📍 ${order.shippingAddress.city}, ${order.shippingAddress.country}`,
    `📱 Telegram: ${telegram}`,
    ``,
    `📦 <b>Produkty:</b>`,
    itemLines,
    ``,
    `💰 <b>Celkem: ${order.totalAmount.toLocaleString('cs-CZ')} Kč</b>`,
    `💳 Stripe: ${piShort}`,
    ``,
    `⏰ ${timestamp}`,
  ].join('\n')
}
