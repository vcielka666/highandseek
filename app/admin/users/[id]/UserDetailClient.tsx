'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge  from '@/components/admin/StatusBadge'

const CARD_STYLE  = { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }
const INPUT_STYLE = { background: '#050508', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)' }
const LABEL_STYLE = { color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }

type AwardType = 'xp' | 'credits' | null
type SuspendType = 'suspend' | 'unsuspend' | null

interface User   { _id: string; username: string; email: string; role: string; level: number; xp: number; credits: number; createdAt: string; totalXpEarned: number; badges: unknown[]; growsCompleted: number }
interface Order  { _id: string; totalAmount: number; status: string; items: unknown[]; createdAt: string; customerEmail: string }
interface XPEvt  { _id: string; event: string; amount: number; createdAt: string }
interface CrEvt  { _id: string; type: string; amount: number; reason: string; createdAt: string }

const XP_PER_LEVEL = 500

export default function UserDetailClient({
  user:    initialUser,
  orders,
  xpEvents,
  creditEvents,
}: {
  user:         User
  orders:       Order[]
  xpEvents:     XPEvt[]
  creditEvents: CrEvt[]
}) {
  const [user,       setUser]       = useState(initialUser)
  const [awardType,  setAwardType]  = useState<AwardType>(null)
  const [suspendType,setSuspendType]= useState<SuspendType>(null)
  const [amount,     setAmount]     = useState('')
  const [reason,     setReason]     = useState('')
  const [role,       setRole]       = useState(user.role)
  const [roleLoading,setRoleLoading]= useState(false)
  const [submitting, setSubmitting] = useState(false)

  const initials = user.username.slice(0, 2).toUpperCase()
  const xpToNext = XP_PER_LEVEL - (user.xp % XP_PER_LEVEL)
  const xpPct    = ((user.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100

  const saveRole = async () => {
    if (role === user.role) return
    setRoleLoading(true)
    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      toast.success('Role updated')
    } else {
      toast.error('Failed to update role')
    }
    setRoleLoading(false)
  }

  const award = async () => {
    if (!awardType) return
    const n = parseInt(amount, 10)
    if (isNaN(n) || n < 1) { toast.error('Invalid amount'); return }
    if (!reason.trim()) { toast.error('Reason required'); return }
    setSubmitting(true)
    const endpoint = awardType === 'xp' ? 'award-xp' : 'award-credits'
    const res = await fetch(`/api/admin/users/${user._id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: n, reason }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      toast.success(`${n} ${awardType === 'xp' ? 'XP' : 'Credits'} awarded`)
      setAwardType(null); setAmount(''); setReason('')
    } else {
      toast.error('Failed to award')
    }
    setSubmitting(false)
  }

  const doSuspend = async () => {
    if (!suspendType) return
    setSubmitting(true)
    const res = await fetch(`/api/admin/users/${user._id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended: suspendType === 'suspend' }),
    })
    if (res.ok) {
      toast.success(suspendType === 'suspend' ? 'Account suspended' : 'Account unsuspended')
      setSuspendType(null)
    } else {
      toast.error('Failed')
    }
    setSubmitting(false)
  }

  const resetPassword = async () => {
    const res = await fetch(`/api/admin/users/${user._id}/reset-password`, { method: 'POST' })
    if (res.ok) toast.success('Password reset email sent')
    else toast.error('Failed to reset password')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LEFT — profile + actions */}
      <div className="space-y-4">
        {/* Profile card */}
        <Card style={CARD_STYLE}>
          <CardContent className="pt-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3"
                style={{ background: 'rgba(240,168,48,0.12)', color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                {initials}
              </div>
              <p className="text-base font-semibold" style={{ color: '#e8f0ef' }}>{user.username}</p>
              <p className="text-xs" style={{ color: '#4a6066' }}>{user.email}</p>
              <StatusBadge status={user.role} />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                  <span style={{ color: '#f0a830' }}>Level {user.level}</span>
                  <span style={{ color: '#4a6066' }}>{xpToNext} XP to next</span>
                </div>
                <Progress value={xpPct} className="h-1.5" style={{ background: 'rgba(240,168,48,0.1)' }} />
              </div>
              {[
                { label: 'Total XP',    value: user.totalXpEarned?.toLocaleString() ?? '0' },
                { label: 'Credits',     value: user.credits?.toLocaleString() ?? '0' },
                { label: 'Grows',       value: user.growsCompleted ?? 0 },
                { label: 'Badges',      value: user.badges?.length ?? 0 },
                { label: 'Joined',      value: formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{label}</span>
                  <span style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions card */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="text-xs h-8 flex-1" style={{ ...INPUT_STYLE }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                  {['user','admin'].map((r) => (
                    <SelectItem key={r} value={r} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={role === user.role || roleLoading} onClick={saveRole}
                style={{ background: 'rgba(240,168,48,0.1)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                Save
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Award XP',      action: () => setAwardType('xp') },
                { label: 'Award Credits', action: () => setAwardType('credits') },
                { label: 'Reset Password',action: resetPassword },
                { label: 'Suspend',       action: () => setSuspendType('suspend') },
              ].map(({ label, action }) => (
                <Button key={label} variant="outline" size="sm" onClick={action}
                  style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.08)', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                  {label}
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-1" style={LABEL_STYLE}>Seekers Integration</p>
              <p className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}>Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — tabs */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="xp">
          <TabsList style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }}>
            {['xp','orders','credits','badges'].map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                {t === 'xp' ? 'XP History' : t === 'credits' ? 'Credits' : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="xp" className="mt-4">
            <Card style={CARD_STYLE}>
              <CardContent className="pt-4">
                {xpEvents.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: '#4a6066' }}>No XP events yet</p>
                ) : (
                  <div className="space-y-2">
                    {xpEvents.map((e) => (
                      <div key={e._id} className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ color: '#e8f0ef' }}>{e.event}</span>
                          <span className="ml-2" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                            {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <span style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: 12 }}>+{e.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card style={CARD_STYLE}>
              <CardContent className="pt-4">
                {orders.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: '#4a6066' }}>No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o._id} className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>{o._id.slice(-8)}</span>
                          <span className="ml-2" style={{ color: '#4a6066' }}>{(o.items as unknown[]).length} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>{(o.totalAmount / 100).toFixed(0)} CZK</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="mt-4">
            <Card style={CARD_STYLE}>
              <CardContent className="pt-4">
                <p className="text-3xl font-semibold mb-4" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>
                  {user.credits?.toLocaleString() ?? '0'}
                  <span className="text-sm font-normal ml-2" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>credits</span>
                </p>
                {creditEvents.length === 0 ? (
                  <p className="text-sm py-2 text-center" style={{ color: '#4a6066' }}>No credit events yet</p>
                ) : (
                  <div className="space-y-2">
                    {creditEvents.map((e) => (
                      <div key={e._id} className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ color: e.type === 'earned' ? '#00d4c8' : '#cc00aa' }}>{e.type}</span>
                          <span className="ml-2" style={{ color: '#4a6066' }}>{e.reason}</span>
                        </div>
                        <span style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
                          {e.type === 'earned' ? '+' : '-'}{e.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <Card style={CARD_STYLE}>
              <CardContent className="pt-4">
                {(!user.badges || user.badges.length === 0) ? (
                  <p className="text-sm py-4 text-center" style={{ color: '#4a6066' }}>No badges yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {(user.badges as Array<{ badgeId: string; earnedAt: string }>).map((b) => (
                      <div key={b.badgeId} className="text-center p-3 rounded" style={{ background: 'rgba(240,168,48,0.06)', border: '0.5px solid rgba(240,168,48,0.1)' }}>
                        <p className="text-xs font-medium" style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>{b.badgeId}</p>
                        <p className="text-xs mt-1" style={{ color: '#4a6066' }}>
                          {formatDistanceToNow(new Date(b.earnedAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Award dialog */}
      <Dialog open={!!awardType} onOpenChange={(v) => { if (!v) setAwardType(null) }}>
        <DialogContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)', color: '#e8f0ef' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
              Award {awardType === 'xp' ? 'XP' : 'Credits'}
            </DialogTitle>
            <DialogDescription style={{ color: '#4a6066' }}>
              Manually award to {user.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block mb-1" style={LABEL_STYLE}>Amount</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" style={INPUT_STYLE} />
            </div>
            <div>
              <label className="block mb-1" style={LABEL_STYLE}>Reason</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Community contribution" style={INPUT_STYLE} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardType(null)}
              style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={award}
              style={{ background: 'rgba(240,168,48,0.15)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              {submitting ? 'Awarding…' : 'Award'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirm */}
      <Dialog open={!!suspendType} onOpenChange={(v) => { if (!v) setSuspendType(null) }}>
        <DialogContent style={{ background: '#0a0d10', border: '0.5px solid rgba(204,0,170,0.2)', color: '#e8f0ef' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
              {suspendType === 'suspend' ? 'Suspend Account' : 'Unsuspend Account'}
            </DialogTitle>
            <DialogDescription style={{ color: '#4a6066' }}>
              {suspendType === 'suspend'
                ? `${user.username} will lose access to H&S.`
                : `${user.username} will regain access to H&S.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendType(null)}
              style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={doSuspend}
              style={{ background: 'rgba(204,0,170,0.15)', color: '#cc00aa', border: '0.5px solid rgba(204,0,170,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              {submitting ? '…' : (suspendType === 'suspend' ? 'Suspend' : 'Unsuspend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
