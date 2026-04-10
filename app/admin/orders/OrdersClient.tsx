'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input }    from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import StatusBadge  from '@/components/admin/StatusBadge'
import { Download, Search } from 'lucide-react'

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered'] as const
type Status = typeof STATUSES[number]

interface OrderItem { name: string; quantity: number; price: number }
interface ShippingAddress { name: string; address: string; city: string; postalCode: string; country: string }
interface Order {
  _id: string
  customerEmail: string
  items: OrderItem[]
  totalAmount: number
  status: string
  createdAt: string
  shippingAddress: ShippingAddress
  stripePaymentIntentId: string
}

function OrderRow({
  order,
  selected,
  onSelect,
  onOpen,
}: {
  order: Order
  selected: boolean
  onSelect: (id: string, v: boolean) => void
  onOpen: (o: Order) => void
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-[rgba(240,168,48,0.03)] transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(order._id, !!v)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell
        className="font-mono text-xs cursor-pointer"
        style={{ color: '#e8f0ef' }}
        onClick={() => onOpen(order)}
      >
        {order._id.slice(-8)}
      </TableCell>
      <TableCell className="text-sm" style={{ color: '#4a6066' }} onClick={() => onOpen(order)}>
        {order.customerEmail}
      </TableCell>
      <TableCell onClick={() => onOpen(order)}>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(240,168,48,0.1)', color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}
        >
          {order.items.length}
        </span>
      </TableCell>
      <TableCell className="font-semibold text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }} onClick={() => onOpen(order)}>
        {(order.totalAmount / 100).toFixed(0)} CZK
      </TableCell>
      <TableCell onClick={() => onOpen(order)}>
        <StatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-xs" style={{ color: '#4a6066' }} onClick={() => onOpen(order)}>
        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}

const TIMELINE_STEPS = ['pending', 'paid', 'shipped', 'delivered']

function OrderSheet({ order, onClose, onSave }: { order: Order | null; onClose: () => void; onSave: (id: string, status: string) => Promise<void> }) {
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (order) setStatus(order.status)
  }, [order])

  const handleSave = async () => {
    if (!order) return
    setSaving(true)
    await onSave(order._id, status)
    setSaving(false)
  }

  const currentStep = TIMELINE_STEPS.indexOf(status)

  return (
    <Sheet open={!!order} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        className="w-full sm:max-w-xl overflow-y-auto"
        style={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}
      >
        {order && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
                Order #{order._id.slice(-8)}
              </SheetTitle>
              <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                {new Date(order.createdAt).toLocaleString('en-US')}
              </p>
            </SheetHeader>

            {/* Timeline */}
            <div className="flex items-center gap-1 mb-6">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <div
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: i <= currentStep ? 'rgba(240,168,48,0.15)' : 'rgba(255,255,255,0.05)',
                      color:      i <= currentStep ? '#f0a830' : '#4a6066',
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    {step}
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className="h-px w-4"
                      style={{ background: i < currentStep ? '#f0a830' : 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Status update */}
            <div className="flex items-center gap-2 mb-6">
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-40 text-xs" style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', color: '#e8f0ef' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                  {['pending','paid','shipped','delivered'].map((s) => (
                    <SelectItem key={s} value={s} style={{ color: '#e8f0ef' }}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={saving || status === order.status}
                onClick={handleSave}
                style={{ background: 'rgba(240,168,48,0.15)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', fontFamily: 'var(--font-dm-mono)' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#e8f0ef' }}>{item.name} × {item.quantity}</span>
                    <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
                      {(item.price * item.quantity / 100).toFixed(0)} CZK
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t font-semibold" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#4a6066' }}>Total</span>
                <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
                  {(order.totalAmount / 100).toFixed(0)} CZK
                </span>
              </div>
            </div>

            {/* Customer */}
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Customer</p>
              <p className="text-sm" style={{ color: '#e8f0ef' }}>{order.customerEmail}</p>
              {order.shippingAddress?.name && (
                <p className="text-xs mt-1" style={{ color: '#4a6066' }}>
                  {order.shippingAddress.name}, {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </p>
              )}
            </div>

            {/* Stripe */}
            {order.stripePaymentIntentId && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Payment</p>
                <p className="text-xs break-all" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                  {order.stripePaymentIntentId}
                </p>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function OrdersClient() {
  const [status,   setStatus]  = useState<Status>('all')
  const [search,   setSearch]  = useState('')
  const [orders,   setOrders]  = useState<Order[]>([])
  const [total,    setTotal]   = useState(0)
  const [page,     setPage]    = useState(1)
  const [loading,  setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail,   setDetail]  = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status, page: String(page), limit: '20',
      ...(search ? { search } : {}),
    })
    const res = await fetch(`/api/admin/orders?${params}`)
    if (res.ok) {
      const data = await res.json()
      setOrders(data.orders)
      setTotal(data.total)
    }
    setLoading(false)
  }, [status, page, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast.success('Order updated')
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status: newStatus } : o))
      if (detail?._id === id) setDetail((d) => d ? { ...d, status: newStatus } : d)
    } else {
      toast.error('Failed to update order')
    }
  }

  const toggleSelect = (id: string, v: boolean) => {
    setSelected((prev) => { const s = new Set(prev); v ? s.add(id) : s.delete(id); return s })
  }

  const bulkShip = async () => {
    for (const id of selected) await updateStatus(id, 'shipped')
    setSelected(new Set())
  }

  const exportCSV = () => {
    const params = new URLSearchParams({ status, ...(search ? { search } : {}) })
    window.open(`/api/admin/orders/export?${params}`, '_blank')
  }

  const pages = Math.ceil(total / 20)

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as Status); setPage(1) }}>
          <TabsList style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            {STATUSES.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="text-xs capitalize"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6066' }} />
          <Input
            placeholder="Search email or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 text-sm h-9"
            style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)' }}
          />
        </div>

        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <Button size="sm" onClick={bulkShip}
              style={{ background: 'rgba(136,68,204,0.15)', color: '#8844cc', border: '0.5px solid rgba(136,68,204,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Mark {selected.size} as Shipped
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportCSV}
            style={{ background: 'transparent', border: '0.5px solid rgba(240,168,48,0.2)', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
            <Download size={13} className="mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded border overflow-hidden" style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === orders.length && orders.length > 0}
                  onCheckedChange={(v) => {
                    if (v) setSelected(new Set(orders.map((o) => o._id)))
                    else setSelected(new Set())
                  }}
                />
              </TableHead>
              {['Order ID','Customer','Items','Total','Status','Date'].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wider" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm" style={{ color: '#4a6066' }}>
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <OrderRow
                  key={o._id}
                  order={o}
                  selected={selected.has(o._id)}
                  onSelect={toggleSelect}
                  onOpen={setDetail}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            {total} total · page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              style={{ border: '0.5px solid rgba(240,168,48,0.2)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
              style={{ border: '0.5px solid rgba(240,168,48,0.2)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Next
            </Button>
          </div>
        </div>
      )}

      <OrderSheet
        order={detail}
        onClose={() => setDetail(null)}
        onSave={updateStatus}
      />
    </div>
  )
}
