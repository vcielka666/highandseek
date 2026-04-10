import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/hub') && !req.auth) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const url = new URL('/auth/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    if (req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/hub', req.url))
    }
  }
})

export const config = {
  matcher: ['/hub/:path*', '/admin/:path*'],
}
