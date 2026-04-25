import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const flowerUnlocked = cookieStore.get('flower_access')?.value === 'granted'
  return NextResponse.json({ flowerUnlocked })
}
