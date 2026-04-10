'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button }   from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/admin/StatusBadge'

const TOOLTIP = {
  contentStyle: { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 11 },
  labelStyle:   { color: '#4a6066' },
  itemStyle:    { color: '#f0a830' },
}

interface SystemData {
  collections: { name: string; count: number }[]
  apiCosts: {
    anthropicRequestsThisMonth: number
    anthropicEstimatedCost:     string
    stripeFeesThisMonth:        string
  }
  recentErrors: {
    _id:       string
    message:   string
    route:     string
    severity:  string
    action:    string
    createdAt: string
  }[]
}

export default function SystemClient() {
  const [data,         setData]         = useState<SystemData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing,     setClearing]     = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/system')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const clearErrors = async () => {
    setClearing(true)
    const res = await fetch('/api/admin/system/clear-errors', { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      toast.success(`Deleted ${d.deleted} old error logs`)
      setClearConfirm(false)
      fetchData()
    } else {
      toast.error('Failed to clear errors')
    }
    setClearing(false)
  }

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded" />)}
    </div>
  )

  if (!data) return <p style={{ color: '#4a6066' }}>Failed to load system data</p>

  return (
    <div className="space-y-5">
      {/* API Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Anthropic API — This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 mb-3">
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Requests</p>
                <p className="text-2xl font-semibold" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                  {data.apiCosts.anthropicRequestsThisMonth}
                </p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Est. Cost</p>
                <p className="text-2xl font-semibold" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                  ${data.apiCosts.anthropicEstimatedCost}
                </p>
              </div>
            </div>
            <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
              Formula: requests × $0.014 avg
            </p>
          </CardContent>
        </Card>

        <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              Stripe Fees — This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold mb-1" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
              ${data.apiCosts.stripeFeesThisMonth}
            </p>
            <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
              Formula: paid orders × 2.9% + €0.30
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MongoDB Collections */}
      <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
            MongoDB — highandseeek_db
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {data.collections.map((c) => (
              <div key={c.name} className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{c.name}</p>
                <p className="text-lg font-semibold mt-0.5" style={{ color: '#e8f0ef', fontFamily: 'var(--font-orbitron)' }}>
                  {c.count.toLocaleString('en-US')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Log */}
      <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
            Error Log (last 50)
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setClearConfirm(true)}
            style={{ border: '0.5px solid rgba(204,0,170,0.2)', color: '#cc00aa', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}
          >
            Clear Old Errors
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentErrors.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#4a6066' }}>No errors logged</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.recentErrors.map((e) => (
                <div key={e._id} className="flex items-start gap-3 py-2 border-b last:border-0 text-xs"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex-shrink-0 mt-0.5">
                    <StatusBadge status={e.severity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ color: '#e8f0ef' }}>{e.message}</p>
                    {e.route && <p className="mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{e.route}</p>}
                  </div>
                  <span className="flex-shrink-0" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                    {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
            App Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { label: 'Environment',       value: process.env.NODE_ENV ?? 'unknown' },
              { label: 'Framework',         value: 'Next.js 16.2.1' },
              { label: 'Database',          value: 'highandseeek_db' },
              { label: 'Seekers',           value: 'Not connected' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.1em' }}>{label}</p>
                <p className="mt-0.5" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear confirm dialog */}
      <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <DialogContent style={{ background: '#0a0d10', border: '0.5px solid rgba(204,0,170,0.2)', color: '#e8f0ef' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
              Clear Old Error Logs
            </DialogTitle>
            <DialogDescription style={{ color: '#4a6066' }}>
              This will delete all error logs older than 30 days. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearConfirm(false)}
              style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Cancel
            </Button>
            <Button disabled={clearing} onClick={clearErrors}
              style={{ background: 'rgba(204,0,170,0.15)', color: '#cc00aa', border: '0.5px solid rgba(204,0,170,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              {clearing ? 'Clearing…' : 'Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
