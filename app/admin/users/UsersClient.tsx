'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input }    from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button }   from '@/components/ui/button'
import StatusBadge  from '@/components/admin/StatusBadge'
import { Search }   from 'lucide-react'

interface User {
  _id:        string
  username:   string
  email:      string
  role:       string
  level:      number
  xp:         number
  credits:    number
  orderCount: number
  createdAt:  string
}

export default function UsersClient() {
  const [users,   setUsers]   = useState<User[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [role,    setRole]    = useState('all')
  const [page,    setPage]    = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: '20',
      ...(search ? { search } : {}),
      ...(role !== 'all' ? { role } : {}),
    })
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    }
    setLoading(false)
  }, [search, role, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const pages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6066' }} />
          <Input
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 text-sm h-9"
            style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}
          />
        </div>
        <Select value={role} onValueChange={(v) => { if (v) { setRole(v); setPage(1) } }}>
          <SelectTrigger className="w-32 text-sm h-9" style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
            {['all','admin','user'].map((r) => (
              <SelectItem key={r} value={r} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded border overflow-hidden" style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {['','Username','Level','XP','Credits','Orders','Role','Joined'].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wider" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-sm" style={{ color: '#4a6066' }}>No users found</TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const initials = (u.username ?? '').slice(0, 2).toUpperCase() || '??'
                return (
                  <TableRow
                    key={u._id}
                    className="cursor-pointer hover:bg-[rgba(240,168,48,0.03)]"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <TableCell>
                      <Link href={`/admin/users/${u._id}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ background: 'rgba(240,168,48,0.1)', color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                          {initials}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${u._id}`}>
                        <p className="text-sm font-medium" style={{ color: '#e8f0ef' }}>{u.username}</p>
                        <p className="text-xs" style={{ color: '#4a6066' }}>{u.email}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>{u.level}</span>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>
                      {(u.xp ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>
                      {(u.credits ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                      {u.orderCount ?? 0}
                    </TableCell>
                    <TableCell><StatusBadge status={u.role} /></TableCell>
                    <TableCell className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
