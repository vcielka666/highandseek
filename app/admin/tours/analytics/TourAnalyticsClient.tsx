'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import MetricCard   from '@/components/admin/MetricCard'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PopulatedTour { title: string; slug: string }

interface BookingRecord {
  _id:     string
  tourId:  string | PopulatedTour
  status:  string
  payment: { method: string; amount: number; currency: string; status: string }
  createdAt: string
}

function getTourTitle(tourId: string | PopulatedTour): string {
  if (typeof tourId === 'object' && tourId !== null) return tourId.title
  return 'Unknown Tour'
}

interface DayBucket   { date: string; count: number }
interface TourBucket  { tour: string; count: number }
interface MethodSlice { name: string; value: number }
interface StatusSlice { name: string; value: number }

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: {
    background:  '#0a0d10',
    border:      '0.5px solid rgba(240,168,48,0.2)',
    borderRadius: 4,
    fontFamily:  'var(--font-dm-mono)',
    fontSize:    11,
  },
  labelStyle: { color: '#4a6066' },
}

const PIE_METHOD_COLORS = ['#8844cc', '#f0a830', '#00d4c8']
const PIE_STATUS_COLORS: Record<string, string> = {
  pending:   '#f0a830',
  confirmed: '#4aff80',
  completed: '#8844cc',
  cancelled: '#4a6066',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function buildDayBuckets(bookings: BookingRecord[]): DayBucket[] {
  const days = last30Days()
  const counts: Record<string, number> = {}
  days.forEach((d) => { counts[d] = 0 })
  bookings.forEach((b) => {
    const day = b.createdAt.slice(0, 10)
    if (day in counts) counts[day] = (counts[day] ?? 0) + 1
  })
  return days.map((d) => ({ date: d.slice(5), count: counts[d] ?? 0 }))
}

function buildTourBuckets(bookings: BookingRecord[]): TourBucket[] {
  const map: Record<string, number> = {}
  bookings.forEach((b) => {
    const t = getTourTitle(b.tourId)
    map[t] = (map[t] ?? 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tour, count]) => ({ tour, count }))
}

function buildMethodSlices(bookings: BookingRecord[]): MethodSlice[] {
  const map: Record<string, number> = {}
  bookings.forEach((b) => {
    const m = b.payment?.method ?? 'unknown'
    map[m] = (map[m] ?? 0) + 1
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

function buildStatusSlices(bookings: BookingRecord[]): StatusSlice[] {
  const map: Record<string, number> = {}
  bookings.forEach((b) => {
    map[b.status] = (map[b.status] ?? 0) + 1
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TourAnalyticsClient() {
  const [bookings,      setBookings]      = useState<BookingRecord[]>([])
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [bRes, wRes] = await Promise.all([
        fetch('/api/admin/tours/bookings?limit=1000'),
        fetch('/api/admin/tours/waitlist'),
      ])
      if (bRes.ok) {
        const data = (await bRes.json()) as { bookings: BookingRecord[] }
        setBookings(data.bookings ?? [])
      }
      if (wRes.ok) {
        const data = (await wRes.json()) as { count: number }
        setWaitlistCount(data.count ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [])

  const dayBuckets    = buildDayBuckets(bookings)
  const tourBuckets   = buildTourBuckets(bookings)
  const methodSlices  = buildMethodSlices(bookings)
  const statusSlices  = buildStatusSlices(bookings)
  const paidRevenue   = bookings
    .filter((b) => b.payment?.status === 'paid')
    .reduce((sum, b) => sum + (b.payment?.amount ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCard key={i} label="" value="" loading />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Bookings" value={bookings.length}                         accent="amber" />
          <MetricCard label="Revenue (paid)"  value={`€${paidRevenue.toFixed(0)}`}           accent="amber" />
          <MetricCard
            label="Confirmed"
            value={bookings.filter((b) => b.status === 'confirmed').length}
            accent="amber"
          />
          <MetricCard
            label="Waitlist"
            value={waitlistCount !== null ? waitlistCount : '…'}
            accent="amber"
          />
        </div>
      )}

      {/* Waitlist highlight */}
      {!loading && waitlistCount !== null && (
        <div
          className="rounded p-4 flex items-center gap-4"
          style={{ background: 'rgba(240,168,48,0.05)', border: '0.5px solid rgba(240,168,48,0.2)' }}
        >
          <p
            className="text-4xl font-semibold"
            style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}
          >
            {waitlistCount}
          </p>
          <div>
            <p className="text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)' }}>
              People on the tours waitlist
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
              source: tours — from Waitlist model
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bookings over 30 days */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                Bookings — Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayBuckets.every((d) => d.count === 0) ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No bookings yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dayBuckets}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#f0a830' }} formatter={(v) => [v, 'Bookings']} />
                    <Bar dataKey="count" fill="#f0a830" opacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment method breakdown */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8844cc', fontFamily: 'var(--font-orbitron)' }}>
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {methodSlices.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={methodSlices}
                      cx="50%" cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {methodSlices.map((_, i) => (
                        <Cell key={i} fill={PIE_METHOD_COLORS[i % PIE_METHOD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Bookings']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top tours by bookings */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                Top Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tourBuckets.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={tourBuckets} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="tour"
                      tick={{ fill: '#4a6066', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#f0a830' }} formatter={(v) => [v, 'Bookings']} />
                    <Bar dataKey="count" fill="#f0a830" opacity={0.8} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8844cc', fontFamily: 'var(--font-orbitron)' }}>
                Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusSlices.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusSlices}
                      cx="50%" cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {statusSlices.map((slice) => (
                        <Cell
                          key={slice.name}
                          fill={PIE_STATUS_COLORS[slice.name] ?? '#4a6066'}
                        />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Bookings']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
