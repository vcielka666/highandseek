import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Order from '@/lib/db/models/Order'

const querySchema = z.object({
  status:   z.enum(['pending', 'paid', 'shipped', 'delivered', 'all']).optional(),
  search:   z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }
  const { status, search, dateFrom, dateTo } = parsed.data

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (status && status !== 'all') filter.status = status
  if (search) filter.customerEmail = { $regex: search, $options: 'i' }
  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo)   (filter.createdAt as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(1000).lean()

  const rows = [
    ['Order ID', 'Customer Email', 'Items', 'Total (CZK)', 'Status', 'Date'].join(','),
    ...orders.map((o) =>
      [
        String(o._id),
        o.customerEmail,
        o.items.length,
        o.totalAmount,
        o.status,
        new Date(o.createdAt as Date).toISOString(),
      ].join(',')
    ),
  ]

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${Date.now()}.csv"`,
    },
  })
}
