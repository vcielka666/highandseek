'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label:    string
  value:    string | number
  sub?:     string
  change?:  string | null
  loading?: boolean
  accent?:  'amber' | 'teal' | 'magenta'
}

const ACCENT_COLOR = {
  amber:   '#f0a830',
  teal:    '#00d4c8',
  magenta: '#cc00aa',
}

export default function MetricCard({
  label,
  value,
  sub,
  change,
  loading,
  accent = 'amber',
}: MetricCardProps) {
  const color = ACCENT_COLOR[accent]

  if (loading) {
    return (
      <Card style={{ background: '#0a0d10', border: `0.5px solid rgba(240,168,48,0.12)` }}>
        <CardContent className="pt-5 pb-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  const changeNum = change ? parseFloat(change) : null

  return (
    <Card style={{ background: '#0a0d10', border: `0.5px solid rgba(240,168,48,0.12)` }}>
      <CardContent className="pt-5 pb-4">
        <p
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}
        >
          {label}
        </p>
        <p
          className="text-3xl font-semibold mb-1"
          style={{ color, fontFamily: 'var(--font-orbitron)' }}
        >
          {value}
        </p>
        {(sub || change !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && (
              <span className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}>
                {sub}
              </span>
            )}
            {change !== null && change !== undefined && changeNum !== null && (
              <Badge
                className={cn(
                  'text-xs px-1.5 py-0.5',
                  changeNum >= 0
                    ? 'bg-[rgba(0,212,200,0.12)] text-[#00d4c8] border-[rgba(0,212,200,0.2)]'
                    : 'bg-[rgba(204,0,170,0.12)] text-[#cc00aa] border-[rgba(204,0,170,0.2)]'
                )}
              >
                {changeNum >= 0 ? '+' : ''}{change}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
