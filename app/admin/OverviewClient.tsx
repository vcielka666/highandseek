'use client'

import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MetricCard from '@/components/admin/MetricCard'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface OverviewData {
  metrics: {
    revenueThisMonth:  number
    revenueChange:     string | null
    ordersToday:       number
    ordersYesterday:   number
    usersThisWeek:     number
    usersLastWeek:     number
  }
  revenueChart:     { date: string; revenue: number }[]
  recentOrders:     Record<string, unknown>[]
  recentUsers:      Record<string, unknown>[]
  lowStockProducts: Record<string, unknown>[]
  anthropic: {
    requestsThisMonth: number
    estimatedCost:     string
    dailyUsage:        { date: string; count: number }[]
  }
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 12 },
  labelStyle:   { color: '#4a6066' },
  itemStyle:    { color: '#f0a830' },
}

export default function OverviewClient({ data }: { data: OverviewData }) {
  const { metrics, revenueChart, recentOrders, recentUsers, lowStockProducts, anthropic } = data

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue this month"
          value={`${(metrics.revenueThisMonth / 100).toFixed(0)} CZK`}
          change={metrics.revenueChange}
          sub="vs last month"
        />
        <MetricCard
          label="Orders today"
          value={metrics.ordersToday}
          sub={`${metrics.ordersYesterday} yesterday`}
          accent="teal"
        />
        <MetricCard
          label="New users this week"
          value={metrics.usersThisWeek}
          sub={`${metrics.usersLastWeek} last week`}
          accent="magenta"
        />
        <MetricCard
          label="Active Grows"
          value="—"
          sub="Coming soon"
        />
      </div>

      {/* Revenue chart */}
      <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
            Revenue — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueChart.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: '#4a6066' }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f0a830" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f0a830" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6066', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/100).toFixed(0)}`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${(Number(v)/100).toFixed(0)} CZK`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#00d4c8" strokeWidth={1.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent orders + users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Recent Orders
            </CardTitle>
            <Link href="/admin/orders" className="text-xs" style={{ color: '#4a6066' }}>View all →</Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#4a6066' }}>No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => {
                  const id    = String(o._id)
                  const email = String(o.customerEmail)
                  const amt   = Number(o.totalAmount)
                  const stat  = String(o.status)
                  const items = (o.items as unknown[])?.length ?? 0
                  const date  = o.createdAt ? formatDistanceToNow(new Date(String(o.createdAt)), { addSuffix: true }) : ''
                  return (
                    <div key={id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div>
                        <span className="text-xs" style={{ fontFamily: 'var(--font-dm-mono)', color: '#e8f0ef' }}>
                          {id.slice(-8)}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: '#4a6066' }}>{email} · {items} item{items !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <StatusBadge status={stat} />
                        <span className="text-xs" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>
                          {fmt(amt / 100)} CZK
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Recent Registrations
            </CardTitle>
            <Link href="/admin/users" className="text-xs" style={{ color: '#4a6066' }}>View all →</Link>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#4a6066' }}>No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => {
                  const id   = String(u._id)
                  const name = String(u.username ?? '')
                  const email = String(u.email ?? '')
                  const date = u.createdAt ? formatDistanceToNow(new Date(String(u.createdAt)), { addSuffix: true }) : ''
                  const initials = name.slice(0, 2).toUpperCase() || '??'
                  return (
                    <div key={id} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                        style={{ background: 'rgba(240,168,48,0.1)', color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#e8f0ef' }}>{name}</p>
                        <p className="text-xs truncate" style={{ color: '#4a6066' }}>{email}</p>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{date}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock + Anthropic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock */}
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(204,0,170,0.2)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)' }}>
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm py-2" style={{ color: '#4a6066' }}>All products well stocked</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => {
                  const slug  = String(p.slug)
                  const name  = String(p.name)
                  const stock = Number(p.stock)
                  return (
                    <div
                      key={slug}
                      className="flex items-center justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: stock === 0 ? 'rgba(204,0,170,0.15)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-sm" style={{ color: '#e8f0ef' }}>{name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: stock === 0 ? '#cc00aa' : '#f0a830', fontFamily: 'var(--font-dm-mono)' }}
                        >
                          {stock === 0 ? 'OUT' : stock}
                        </span>
                        <Link
                          href={`/admin/products/${slug}`}
                          className="text-xs"
                          style={{ color: '#4a6066' }}
                        >
                          Edit →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anthropic API */}
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Anthropic API — This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 mb-3">
              <div>
                <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Requests</p>
                <p className="text-xl font-semibold" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                  {anthropic.requestsThisMonth}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Est. Cost</p>
                <p className="text-xl font-semibold" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                  ${anthropic.estimatedCost}
                </p>
              </div>
            </div>
            {anthropic.dailyUsage.length === 0 ? (
              <p className="text-xs" style={{ color: '#4a6066' }}>No usage this week</p>
            ) : (
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={anthropic.dailyUsage}>
                  <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Requests']} />
                  <Bar dataKey="count" fill="#f0a830" opacity={0.7} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
