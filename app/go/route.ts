import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { QRRedirect } from '@/lib/db/models/QRRedirect'
import { logScan } from '@/lib/qr/scan'

const SESSION_COOKIE = 'hs_qr_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function GET(req: NextRequest) {
  return handleRedirect(req, 'go')
}

export async function handleRedirect(req: NextRequest, slug: string) {
  await connectDB()

  const redirect = await QRRedirect.findOne({ slug, isActive: true }).lean<{ targetUrl: string }>()
  if (!redirect) {
    return NextResponse.redirect(new URL('/', req.url), 302)
  }

  const ua         = req.headers.get('user-agent') ?? ''
  const ip         = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                  ?? req.headers.get('x-real-ip')
                  ?? ''
  const referrer   = req.headers.get('referer') ?? ''
  const existingSession = req.cookies.get(SESSION_COOKIE)?.value

  const sessionId = await logScan({ slug, userAgent: ua, ip, referrer, existingSessionId: existingSession })

  const res = NextResponse.redirect(redirect.targetUrl, 302)
  if (!existingSession) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return res
}
