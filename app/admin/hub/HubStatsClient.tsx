'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import MetricCard from '@/components/admin/MetricCard'

const TOOLTIP = {
  contentStyle: { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 11 },
  labelStyle:   { color: '#4a6066' },
  itemStyle:    { color: '#f0a830' },
}

interface HubData {
  metrics: {
    totalXpAllTime:    number
    forumThisMonth:    number
    forumAllTime:      number
    avgForumPerDay:    string
    estimatedCost:     string
  }
  xpPerDay:         { _id: string; xp: number }[]
  forumPerDay:      { _id: string; count: number }[]
  recentQuestions:  { _id: string; question: string; createdAt: string; helpful: boolean | null }[]
  badges:           { badgeId: string; count: number; percentOfUsers: string }[]
}

export default function HubStatsClient() {
  const [data,    setData]    = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/hub')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)}
      </div>
      <Skeleton className="h-48 w-full rounded" />
    </div>
  )

  if (!data) return <p style={{ color: '#4a6066' }}>Failed to load hub stats</p>

  const xpChart     = data.xpPerDay.map((d)    => ({ date: d._id, xp: d.xp }))
  const forumChart  = data.forumPerDay.map((d)  => ({ date: d._id, count: d.count }))

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total XP Awarded" value={data.metrics.totalXpAllTime.toLocaleString('en-US')} />
        <MetricCard label="Forum This Month"  value={data.metrics.forumThisMonth} accent="teal" />
        <MetricCard label="Forum All Time"    value={data.metrics.forumAllTime} accent="magenta" />
        <MetricCard label="Est. AI Cost (mo)" value={`$${data.metrics.estimatedCost}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              XP Awarded — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {xpChart.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={xpChart}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f0a830" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f0a830" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP} formatter={(v) => [Number(v).toLocaleString('en-US'), 'XP']} />
                  <Area type="monotone" dataKey="xp" stroke="#f0a830" strokeWidth={1.5} fill="url(#xpGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#00d4c8', fontFamily: 'var(--font-orbitron)' }}>
              Forum Questions — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forumChart.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: '#4a6066' }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={forumChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a6066', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP} formatter={(v) => [v, 'Questions']} />
                  <Bar dataKey="count" fill="#00d4c8" opacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent questions + badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Recent Forum Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentQuestions.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#4a6066' }}>No questions yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentQuestions.map((q) => (
                  <div key={q._id} className="py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs line-clamp-2" style={{ color: '#e8f0ef' }}>{q.question}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                      {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                      {q.helpful !== null && (
                        <span className="ml-2" style={{ color: q.helpful ? '#00d4c8' : '#cc00aa' }}>
                          {q.helpful ? '✓ helpful' : '✗ not helpful'}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.badges.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#4a6066' }}>No badges awarded yet</p>
            ) : (
              <div className="space-y-2">
                {data.badges.slice(0, 10).map((b) => (
                  <div key={b.badgeId} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>{b.badgeId}</span>
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>{b.count}</span>
                      <span style={{ color: '#4a6066' }}>{b.percentOfUsers}% of users</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
