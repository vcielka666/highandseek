'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

type Stats = {
  total: number
  converted: number
  conversionRate: number
  perDay: Array<{ date: string; count: number }>
  deviceBreak: Array<{ device: string; count: number }>
  countryBreak: Array<{ country: string; count: number }>
  recent: Array<{ timestamp: string; device: string; country: string; converted: boolean }>
}

const DEVICE_COLORS: Record<string, string> = {
  ios:     '#00d4c8',
  android: '#8844cc',
  desktop: '#f0a830',
  other:   '#4a6066',
}

export default function QRStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/qr/${slug}/stats`)
      .then(r => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  const metricStyle = (color: string): React.CSSProperties => ({
    background: 'rgba(6,8,10,0.8)',
    border: `0.5px solid ${color}33`,
    borderRadius: '8px',
    padding: '20px 24px',
    textAlign: 'center',
  })

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px' }}>
      {/* Back + header */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/admin/qr" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textDecoration: 'none' }}>
          ← Späť na QR zoznam
        </Link>
        <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', color: '#f0a830', letterSpacing: '2px', margin: '8px 0 0' }}>
          QR / {slug.toUpperCase()}
        </h1>
      </div>

      {loading && <div style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }}>Načítavam...</div>}

      {stats && (
        <>
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '32px' }} className="max-sm:grid-cols-1">
            <div style={metricStyle('#f0a830')}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '36px', color: '#f0a830', fontWeight: 700 }}>{stats.total}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginTop: '6px' }}>Celkové scany</div>
            </div>
            <div style={metricStyle('#00d4c8')}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '36px', color: '#00d4c8', fontWeight: 700 }}>{stats.converted}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginTop: '6px' }}>Konverzie</div>
            </div>
            <div style={metricStyle('#cc00aa')}>
              <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '36px', color: '#cc00aa', fontWeight: 700 }}>{stats.conversionRate}%</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginTop: '6px' }}>Konverzný rate</div>
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '32px' }} className="max-md:grid-cols-1">
            {/* Scans per day */}
            <div style={{ background: 'rgba(6,8,10,0.8)', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '16px' }}>
                Scany posledných 30 dní
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats.perDay}>
                  <defs>
                    <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0a830" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f0a830" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#4a6066', fontSize: 9, fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#4a6066', fontSize: 9, fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }} />
                  <Area type="monotone" dataKey="count" stroke="#f0a830" fill="url(#scanGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Device breakdown */}
            <div style={{ background: 'rgba(6,8,10,0.8)', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '16px' }}>
                Zariadenia
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.deviceBreak} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={70} labelLine={false}>
                    {stats.deviceBreak.map((entry, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[entry.device] ?? '#4a6066'} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#e8f0ef' }}>{v}</span>} />
                  <Tooltip contentStyle={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.2)', borderRadius: '4px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent scans */}
          <div style={{ background: 'rgba(6,8,10,0.8)', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(240,168,48,0.1)', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066' }}>
              Posledné scany
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Čas', 'Zariadenie', 'Krajina', 'Konverzia'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066', textAlign: 'left', borderBottom: '0.5px solid rgba(240,168,48,0.07)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((s, i) => (
                  <tr key={i} className="hover:bg-[rgba(240,168,48,0.02)]">
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066', borderBottom: '0.5px solid rgba(240,168,48,0.05)' }}>
                      {new Date(s.timestamp).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: DEVICE_COLORS[s.device] ?? '#4a6066', borderBottom: '0.5px solid rgba(240,168,48,0.05)' }}>
                      {s.device}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef', borderBottom: '0.5px solid rgba(240,168,48,0.05)' }}>
                      {s.country || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '0.5px solid rgba(240,168,48,0.05)' }}>
                      {s.converted
                        ? <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#00d4c8', background: 'rgba(0,212,200,0.1)', borderRadius: '3px', padding: '2px 7px' }}>✓ reg</span>
                        : <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recent.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
                Žiadne scany zatiaľ.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
