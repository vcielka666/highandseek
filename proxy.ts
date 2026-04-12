import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const { pathname } = nextUrl
  const isLoggedIn = !!req.auth

  if (pathname.startsWith('/hub') && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (req.auth?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/hub', nextUrl.origin))
    }
  }

  if (pathname.startsWith('/auth') && isLoggedIn) {
    return NextResponse.redirect(new URL('/hub', nextUrl.origin))
  }
})

export const config = {
  matcher: ['/hub/:path*', '/admin/:path*', '/auth/:path*'],
}
