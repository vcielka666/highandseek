import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

/** Returns null if admin, or a 401/403 NextResponse to return immediately. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
