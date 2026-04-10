import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'
import ErrorLog from '@/lib/db/models/ErrorLog'
import { auth } from '@/lib/auth/config'

const patchSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: { status: parsed.data.status } },
    { new: true }
  ).lean()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Audit log
  const session = await auth()
  await ErrorLog.create({
    message: `Order ${id} status changed to ${parsed.data.status}`,
    action:  'order.status_change',
    route:   `/api/admin/orders/${id}`,
    userId:  session?.user?.id,
    severity: 'low',
  })

  return NextResponse.json({ order })
}
