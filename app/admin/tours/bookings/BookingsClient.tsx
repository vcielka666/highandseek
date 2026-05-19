'use client'

import { useState } from 'react'
import { toast }    from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { QrCode } from 'lucide-react'

export interface BookingRow {
  _id:             string
  tourTitle:       string
  guestName:       string
  guestEmail:      string
  telegramContact: string
  date:            string
  guestsCount:     number
  paymentMethod:   string
  amount:          number
  currency:        string
  status:          string
  qrCode:          string
  notes:           string
  createdAt:       string
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
const STATUSES: FilterStatus[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled']
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: 'rgba(240,168,48,0.12)',  text: '#f0a830', border: 'rgba(240,168,48,0.25)'  },
  confirmed: { bg: 'rgba(74,255,128,0.1)',   text: '#4aff80', border: 'rgba(74,255,128,0.2)'   },
  completed: { bg: 'rgba(136,68,204,0.12)',  text: '#8844cc', border: 'rgba(136,68,204,0.25)'  },
  cancelled: { bg: 'rgba(74,96,102,0.15)',   text: '#4a6066', border: 'rgba(74,96,102,0.25)'   },
}

function BookingBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <Badge
      className="text-xs capitalize"
      style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}` }}
    >
      {status}
    </Badge>
  )
}

function BookingDetailSheet({
  booking,
  onClose,
  onStatusChange,
}: {
  booking:        BookingRow | null
  onClose:        () => void
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [newStatus, setNewStatus] = useState<string>('')
  const [saving,    setSaving]    = useState(false)

  const handleConfirm = async () => {
    if (!booking || !newStatus || newStatus === booking.status) return
    setSaving(true)
    await onStatusChange(booking._id, newStatus)
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={!!booking} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto"
        style={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}
      >
        {booking && (
          <>
            <SheetHeader className="mb-5">
              <SheetTitle style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
                Booking Details
              </SheetTitle>
            </SheetHeader>

            {/* Tour & Date */}
            <Section label="Tour">
              <p className="text-sm" style={{ color: '#e8f0ef' }}>{booking.tourTitle}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                {booking.date ? new Date(booking.date).toLocaleDateString('en-GB', { dateStyle: 'full' }) : '—'}
              </p>
            </Section>

            {/* Guest */}
            <Section label="Guest">
              <p className="text-sm" style={{ color: '#e8f0ef' }}>{booking.guestName}</p>
              <p className="text-xs" style={{ color: '#4a6066' }}>{booking.guestEmail}</p>
              {booking.telegramContact && (
                <p className="text-xs mt-0.5" style={{ color: '#4a6066' }}>
                  Telegram: {booking.telegramContact}
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: '#4a6066' }}>
                {booking.guestsCount} guest{booking.guestsCount !== 1 ? 's' : ''}
              </p>
            </Section>

            {/* Payment */}
            <Section label="Payment">
              <p className="text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>
                {booking.amount.toFixed(2)} {booking.currency}
              </p>
              <p className="text-xs" style={{ color: '#4a6066' }}>
                via {booking.paymentMethod}
              </p>
            </Section>

            {/* QR */}
            <Section label="QR Code">
              <div className="flex items-center gap-2">
                <QrCode size={14} style={{ color: '#8844cc' }} />
                <span
                  className="text-xs break-all"
                  style={{ color: '#8844cc', fontFamily: 'var(--font-dm-mono)' }}
                >
                  {booking.qrCode}
                </span>
              </div>
            </Section>

            {/* Notes */}
            {booking.notes && (
              <Section label="Notes">
                <p className="text-sm" style={{ color: '#e8f0ef' }}>{booking.notes}</p>
              </Section>
            )}

            {/* Created */}
            <Section label="Created">
              <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                {booking.createdAt ? formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true }) : '—'}
              </p>
            </Section>

            {/* Status update */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(240,168,48,0.1)' }}>
              <p className="text-xs mb-2" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                UPDATE STATUS
              </p>
              <div className="flex gap-2">
                <Select
                  defaultValue={booking.status}
                  onValueChange={(v) => v && setNewStatus(v)}
                >
                  <SelectTrigger
                    className="flex-1 text-xs h-8"
                    style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', color: '#e8f0ef' }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                    {BOOKING_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} style={{ color: '#e8f0ef' }}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={saving || !newStatus || newStatus === booking.status}
                  onClick={handleConfirm}
                  style={{
                    background: 'rgba(240,168,48,0.15)',
                    color:      '#f0a830',
                    border:     '0.5px solid rgba(240,168,48,0.3)',
                    fontFamily: 'var(--font-dm-mono)',
                  }}
                >
                  {saving ? 'Saving…' : 'Confirm'}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

export default function BookingsClient({ initialBookings }: { initialBookings: BookingRow[] }) {
  const [filter,  setFilter]  = useState<FilterStatus>('all')
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings)
  const [detail,  setDetail]  = useState<BookingRow | null>(null)

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/tours/bookings/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    if (res.ok) {
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status } : b))
      toast.success('Booking updated')
    } else {
      toast.error('Failed to update booking')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
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

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <div
          className="rounded border overflow-hidden"
          style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10', minWidth: '700px' }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['QR', 'Tour', 'Guest', 'Date', 'Guests', 'Method', 'Amount', 'Status', ''].map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs uppercase tracking-wider"
                    style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm" style={{ color: '#4a6066' }}>
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow
                    key={b._id}
                    className="cursor-pointer hover:bg-[rgba(240,168,48,0.02)] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    onClick={() => setDetail(b)}
                  >
                    <TableCell>
                      <span
                        className="text-xs font-mono"
                        style={{ color: '#8844cc', fontFamily: 'var(--font-dm-mono)' }}
                      >
                        {b.qrCode.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate" style={{ color: '#e8f0ef' }}>
                      {b.tourTitle}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p style={{ color: '#e8f0ef' }}>{b.guestName}</p>
                        <p style={{ color: '#4a6066' }}>{b.guestEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                      {b.date ? new Date(b.date).toLocaleDateString('en-GB') : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-center" style={{ color: '#e8f0ef' }}>
                      {b.guestsCount}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{
                          background: 'rgba(136,68,204,0.1)',
                          color:      '#8844cc',
                          fontFamily: 'var(--font-dm-mono)',
                        }}
                      >
                        {b.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-xs font-semibold"
                      style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}
                    >
                      {b.amount.toFixed(0)} {b.currency}
                    </TableCell>
                    <TableCell>
                      <BookingBadge status={b.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); setDetail(b) }}
                        style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BookingDetailSheet
        booking={detail}
        onClose={() => setDetail(null)}
        onStatusChange={updateStatus}
      />
    </div>
  )
}
