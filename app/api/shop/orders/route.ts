import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const orders = await Order.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ orders })
}
