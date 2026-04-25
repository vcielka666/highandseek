import { QRScan } from '@/lib/db/models/QRRedirect'
import { randomUUID } from 'crypto'

export function parseDevice(ua: string): 'ios' | 'android' | 'desktop' | 'other' {
  if (/iPhone|iPad/i.test(ua)) return 'ios'
  if (/Android/i.test(ua))     return 'android'
  if (/Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua)) return 'desktop'
  return 'other'
}

export async function logScan(opts: {
  slug: string
  userAgent: string
  ip: string
  referrer: string
  existingSessionId?: string
}): Promise<string> {
  const sessionId = opts.existingSessionId || randomUUID()
  const device    = parseDevice(opts.userAgent)

  await QRScan.create({
    slug:      opts.slug,
    userAgent: opts.userAgent,
    ip:        opts.ip,
    device,
    referrer:  opts.referrer,
    sessionId,
    timestamp: new Date(),
  })

  return sessionId
}
