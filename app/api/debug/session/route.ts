import { auth } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  const cookies = req.cookies.getAll()
  return NextResponse.json({
    session,
    cookies: cookies.map(c => ({ name: c.name, valueLength: c.value.length })),
    headers: {
      host: req.headers.get('host'),
      proto: req.headers.get('x-forwarded-proto'),
      origin: req.headers.get('origin'),
    },
  })
}
