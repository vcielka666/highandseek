'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import MetricCard   from '@/components/admin/MetricCard'
import { Star, MapPin, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { TourRow, ToursStats } from './page'

interface Props {
  stats:        ToursStats
  initialTours: TourRow[]
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  walking: { bg: 'rgba(136,68,204,0.12)',  text: '#8844cc', border: 'rgba(136,68,204,0.25)' },
  cycling: { bg: 'rgba(0,212,200,0.12)',   text: '#00d4c8', border: 'rgba(0,212,200,0.25)' },
  private: { bg: 'rgba(204,0,170,0.12)',   text: '#cc00aa', border: 'rgba(204,0,170,0.25)' },
  group:   { bg: 'rgba(240,168,48,0.12)',  text: '#f0a830', border: 'rgba(240,168,48,0.25)' },
  event:   { bg: 'rgba(74,96,102,0.2)',    text: '#4a6066', border: 'rgba(74,96,102,0.3)'  },
}

export default function ToursOverviewClient({ stats, initialTours }: Props) {
  const [tours, setTours] = useState<TourRow[]>(initialTours)
  const [toggling, setToggling] = useState<string | null>(null)

  const toggleActive = async (slug: string, current: boolean) => {
    setToggling(slug)
    try {
      const res = await fetch(`/api/admin/tours/${slug}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !current }),
      })
      if (!res.ok) throw new Error('Failed')
      setTours((prev) =>
        prev.map((t) => t.slug === slug ? { ...t, isActive: !current } : t)
      )
      toast.success(`Tour ${!current ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update tour')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Tours"    value={stats.tourCount}     accent="amber" />
        <MetricCard label="Total Bookings" value={stats.bookingCount}  accent="amber" />
        <MetricCard
          label="Revenue This Month"
          value={`€${stats.revenue.toFixed(0)}`}
          accent="amber"
        />
        <MetricCard label="Waitlist"       value={stats.waitlistCount} accent="amber" />
      </div>

      {/* Sub-nav */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/admin/tours/bookings',  label: 'Bookings'  },
          { href: '/admin/tours/spots',     label: 'Spots'     },
          { href: '/admin/tours/analytics', label: 'Analytics' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              background:  'rgba(255,255,255,0.04)',
              color:       '#4a6066',
              border:      '0.5px solid rgba(255,255,255,0.08)',
              fontFamily:  'var(--font-dm-mono)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tours table */}
      <div style={{ overflowX: 'auto' }}>
        <div
          className="rounded border overflow-hidden"
          style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10', minWidth: '640px' }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Title', 'City', 'Category', 'Status', 'Bookings', 'Rating', 'Actions'].map((h) => (
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
              {tours.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-sm"
                    style={{ color: '#4a6066' }}
                  >
                    No tours yet — create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tours.map((tour) => {
                  const catStyle = CATEGORY_COLORS[tour.category] ?? CATEGORY_COLORS.event
                  return (
                    <TableRow
                      key={tour._id}
                      className="transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    >
                      <TableCell style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)' }}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{tour.title}</span>
                          {tour.isFeatured && (
                            <span className="text-xs" style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#4a6066' }}>
                          <MapPin size={11} />
                          {tour.city}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className="text-xs capitalize"
                          style={{
                            background: catStyle.bg,
                            color:      catStyle.text,
                            border:     `0.5px solid ${catStyle.border}`,
                          }}
                        >
                          {tour.category}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {tour.isComingSoon ? (
                          <Badge
                            className="text-xs"
                            style={{
                              background: 'rgba(136,68,204,0.12)',
                              color:      '#8844cc',
                              border:     '0.5px solid rgba(136,68,204,0.25)',
                            }}
                          >
                            Coming Soon
                          </Badge>
                        ) : tour.isActive ? (
                          <Badge
                            className="text-xs"
                            style={{
                              background: 'rgba(74,255,128,0.1)',
                              color:      '#4aff80',
                              border:     '0.5px solid rgba(74,255,128,0.2)',
                            }}
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            className="text-xs"
                            style={{
                              background: 'rgba(74,96,102,0.15)',
                              color:      '#4a6066',
                              border:     '0.5px solid rgba(74,96,102,0.25)',
                            }}
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(240,168,48,0.1)',
                            color:      '#f0a830',
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          {tour.totalBookings}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#4a6066' }}>
                          <Star size={11} style={{ color: '#f0a830' }} />
                          <span style={{ fontFamily: 'var(--font-dm-mono)' }}>
                            {tour.rating > 0 ? tour.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/tours/${tour.slug}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              style={{
                                color:      '#4a6066',
                                fontFamily: 'var(--font-dm-mono)',
                              }}
                            >
                              <Edit2 size={12} className="mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={toggling === tour.slug}
                            onClick={() => toggleActive(tour.slug, tour.isActive)}
                            className="h-7 px-2 text-xs"
                            style={{
                              color:      tour.isActive ? '#4aff80' : '#4a6066',
                              fontFamily: 'var(--font-dm-mono)',
                            }}
                          >
                            {tour.isActive
                              ? <ToggleRight size={14} className="mr-1" />
                              : <ToggleLeft  size={14} className="mr-1" />
                            }
                            {tour.isActive ? 'On' : 'Off'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
