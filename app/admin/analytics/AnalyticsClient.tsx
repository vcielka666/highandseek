'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button }   from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import MetricCard   from '@/components/admin/MetricCard'
import StatusBadge  from '@/components/admin/StatusBadge'

const DAYS_OPTIONS = [
  { label: '7d',    days: 7 },
  { label: '30d',   days: 30 },
  { label: '90d',   days: 90 },
]

const PIE_COLORS = ['#00d4c8', '#f0a830', '#cc00aa', '#8844cc']

const TOOLTIP = {
  contentStyle: { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 11 },
  labelStyle:   { color: '#4a6066' },
}

interface AnalyticsData {
  stats: {
    totalUsers:      number
    totalOrders:     number
    totalRevenue:    number
    avgOrderValue:   number
    periodRevenue:   number
    periodUsers:     number
  }
  revenueOverTime:       { _id: string; revenue: number }[]
  registrationsOverTime: { _id: string; count: number }[]
  ordersOverTime:        { _id: string; count: number }[]
  revenueByCategory:     { _id: string; revenue: number }[]
  topProducts:           { _id: string; name: string; units: number; revenue: number }[]
  topCountries:          { _id: string; orders: number; revenue: number }[]
}

export default function AnalyticsClient() {
  const [days,    setDays]    = useState(30)
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/analytics?days=${days}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  const fmt = (n: number) => `${(n / 100).toFixed(0)}`

  return (
    <div className="space-y-5">
      {/* Date range selector */}
      <div className="flex justify-end gap-2">
        {DAYS_OPTIONS.map(({ label, days: d }) => (
          <Button
            key={d}
            size="sm"
            onClick={() => setDays(d)}
            style={{
              background:  days === d ? 'rgba(240,168,48,0.15)' : 'transparent',
              color:       days === d ? '#f0a830' : '#4a6066',
              border:      `0.5px solid ${days === d ? 'rgba(240,168,48,0.3)' : 'rgba(255,255,255,0.08)'}`,
              fontFamily:  'var(--font-dm-mono)',
              fontSize:    11,
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Top stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Users (all)" value={data.stats.totalUsers.toLocaleString('en-US')} />
            <MetricCard label="Total Revenue"     value={`${fmt(data.stats.totalRevenue)} CZK`} />
            <MetricCard label="Total Orders"      value={data.stats.totalOrders.toLocaleString('en-US')} accent="teal" />
            <MetricCard label="Avg Order Value"   value={`${fmt(data.stats.avgOrderValue)} CZK`} accent="magenta" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label={`Revenue (${days}d)`}   value={`${fmt(data.stats.periodRevenue)} CZK`} />
            <MetricCard label={`New Users (${days}d)`} value={data.stats.periodUsers.toLocaleString('en-US')} accent="teal" />
          </div>
        </>
      )}

      {/* Charts grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue over time */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueOverTime.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.revenueOverTime.map((d) => ({ date: d._id, revenue: d.revenue / 100 }))}>
                    <defs>
                      <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f0a830" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f0a830" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP} itemStyle={{ color: '#f0a830' }} formatter={(v) => [`${v} CZK`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#f0a830" strokeWidth={1.5} fill="url(#revG)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Registrations */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#00d4c8', fontFamily: 'var(--font-orbitron)' }}>Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {data.registrationsOverTime.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.registrationsOverTime.map((d) => ({ date: d._id, count: d.count }))}>
                    <defs>
                      <linearGradient id="regG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00d4c8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00d4c8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP} itemStyle={{ color: '#00d4c8' }} formatter={(v) => [v, 'Users']} />
                    <Area type="monotone" dataKey="count" stroke="#00d4c8" strokeWidth={1.5} fill="url(#regG)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders per day */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)' }}>Orders / Day</CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordersOverTime.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.ordersOverTime.map((d) => ({ date: d._id, count: d.count }))}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP} itemStyle={{ color: '#cc00aa' }} formatter={(v) => [v, 'Orders']} />
                    <Bar dataKey="count" fill="#cc00aa" opacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue by category */}
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8844cc', fontFamily: 'var(--font-orbitron)' }}>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByCategory.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.revenueByCategory.map((d) => ({ name: d._id, value: d.revenue / 100 }))}
                      cx="50%" cy="50%" outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {data.revenueByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP} formatter={(v) => [`${Number(v).toFixed(0)} CZK`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top products + countries */}
      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-sm py-4" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.topProducts.map((p, i) => (
                    <div key={p._id} className="flex items-center gap-3 py-1.5 border-b last:border-0 text-xs"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', width: 16 }}>#{i + 1}</span>
                      <span className="flex-1 truncate" style={{ color: '#e8f0ef' }}>{p.name}</span>
                      <span style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{p.units} sold</span>
                      <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>{fmt(p.revenue)} CZK</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCountries.length === 0 ? (
                <p className="text-sm py-4" style={{ color: '#4a6066' }}>No data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.topCountries.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#e8f0ef' }}>{c._id || 'Unknown'}</span>
                      <div className="flex gap-4">
                        <span style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{c.orders} orders</span>
                        <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>{fmt(c.revenue)} CZK</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
