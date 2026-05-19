'use client'

import { useState } from 'react'
import { toast }    from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, PlusCircle, ToggleLeft, ToggleRight, Star } from 'lucide-react'

export interface SpotRow {
  _id:       string
  name:      string
  city:      string
  type:      string
  verified:  boolean
  featured:  boolean
  isActive:  boolean
  address:   string
  createdAt: string
}

type SpotType = 'cbd_shop' | 'smoke_friendly' | 'cannabis_club' | 'grow_shop' | 'cafe' | 'event_space'
const SPOT_TYPES: SpotType[] = ['cbd_shop', 'smoke_friendly', 'cannabis_club', 'grow_shop', 'cafe', 'event_space']

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cbd_shop:       { bg: 'rgba(0,212,200,0.1)',   text: '#00d4c8', border: 'rgba(0,212,200,0.2)'  },
  smoke_friendly: { bg: 'rgba(136,68,204,0.1)',  text: '#8844cc', border: 'rgba(136,68,204,0.2)' },
  cannabis_club:  { bg: 'rgba(204,0,170,0.1)',   text: '#cc00aa', border: 'rgba(204,0,170,0.2)'  },
  grow_shop:      { bg: 'rgba(74,255,128,0.1)',  text: '#4aff80', border: 'rgba(74,255,128,0.2)' },
  cafe:           { bg: 'rgba(240,168,48,0.1)',  text: '#f0a830', border: 'rgba(240,168,48,0.2)' },
  event_space:    { bg: 'rgba(74,96,102,0.15)',  text: '#4a6066', border: 'rgba(74,96,102,0.25)' },
}

interface NewSpotForm {
  name:    string
  city:    string
  country: string
  type:    SpotType
  address: string
  lat:     string
  lng:     string
}

const EMPTY_SPOT: NewSpotForm = {
  name:    '',
  city:    '',
  country: 'CZ',
  type:    'cbd_shop',
  address: '',
  lat:     '0',
  lng:     '0',
}

export default function SpotsClient({ initialSpots }: { initialSpots: SpotRow[] }) {
  const [spots,      setSpots]      = useState<SpotRow[]>(initialSpots)
  const [showModal,  setShowModal]  = useState(false)
  const [newSpot,    setNewSpot]    = useState<NewSpotForm>(EMPTY_SPOT)
  const [creating,   setCreating]   = useState(false)
  const [actionId,   setActionId]   = useState<string | null>(null)

  const unverified = spots.filter((s) => !s.verified)
  const verified   = spots.filter((s) => s.verified)

  const patch = async (id: string, payload: Record<string, unknown>) => {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/tours/spots/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      setSpots((prev) =>
        prev.map((s) => s._id === id ? { ...s, ...payload } : s)
      )
      toast.success('Spot updated')
    } catch {
      toast.error('Failed to update spot')
    } finally {
      setActionId(null)
    }
  }

  const handleCreate = async () => {
    if (!newSpot.name.trim() || !newSpot.city.trim() || !newSpot.address.trim()) {
      toast.error('Name, city, and address are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/tours/spots', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...newSpot,
          lat: Number(newSpot.lat),
          lng: Number(newSpot.lng),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as { spot: { _id: string; name: string; city: string; type: string; verified: boolean; featured: boolean; isActive: boolean; address: string; createdAt?: string } }
      const created: SpotRow = {
        _id:       String(json.spot._id),
        name:      json.spot.name,
        city:      json.spot.city,
        type:      json.spot.type,
        verified:  json.spot.verified,
        featured:  json.spot.featured,
        isActive:  json.spot.isActive,
        address:   json.spot.address,
        createdAt: json.spot.createdAt ?? '',
      }
      setSpots((prev) => [created, ...prev])
      setNewSpot(EMPTY_SPOT)
      setShowModal(false)
      toast.success('Spot created')
    } catch {
      toast.error('Failed to create spot')
    } finally {
      setCreating(false)
    }
  }

  const inputStyle = {
    background: '#0a0d10',
    border:     '0.5px solid rgba(240,168,48,0.15)',
    color:      '#e8f0ef',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <div className="space-y-5">
      {/* Actions bar */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowModal(true)}
          size="sm"
          style={{
            background: 'rgba(240,168,48,0.15)',
            color:      '#f0a830',
            border:     '0.5px solid rgba(240,168,48,0.3)',
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          <PlusCircle size={13} className="mr-1" /> New Spot
        </Button>
      </div>

      {/* Unverified section */}
      {unverified.length > 0 && (
        <div
          className="rounded p-3 mb-2"
          style={{ background: 'rgba(240,168,48,0.04)', border: '0.5px solid rgba(240,168,48,0.2)' }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}
          >
            Pending Verification ({unverified.length})
          </p>
          <SpotTable
            spots={unverified}
            actionId={actionId}
            onPatch={patch}
            showVerify
          />
        </div>
      )}

      {/* All verified spots */}
      <div>
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}
        >
          Verified Spots ({verified.length})
        </p>
        <SpotTable
          spots={verified}
          actionId={actionId}
          onPatch={patch}
          showVerify={false}
        />
      </div>

      {/* New Spot Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="max-w-md"
          style={{ background: '#06080a', border: '0.5px solid rgba(240,168,48,0.2)', color: '#e8f0ef' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)', fontSize: 14 }}>
              New Cannabis Spot
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {(
              [
                { label: 'Name *',    key: 'name'    as const, placeholder: 'Green Hub' },
                { label: 'City *',    key: 'city'    as const, placeholder: 'Prague' },
                { label: 'Country',   key: 'country' as const, placeholder: 'CZ' },
                { label: 'Address *', key: 'address' as const, placeholder: 'Vinohradská 1, Praha' },
              ] as const
            ).map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                  {label}
                </label>
                <Input
                  value={newSpot[key]}
                  onChange={(e) => setNewSpot((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="text-sm h-9"
                  style={inputStyle}
                />
              </div>
            ))}

            <div>
              <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                Type
              </label>
              <Select
                value={newSpot.type}
                onValueChange={(v) => setNewSpot((p) => ({ ...p, type: v as SpotType }))}
              >
                <SelectTrigger className="text-sm h-9" style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)' }}>
                  {SPOT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} style={{ color: '#e8f0ef' }}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['lat', 'lng'] as const).map((k) => (
                <div key={k}>
                  <label className="text-xs mb-1 block" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
                    {k.toUpperCase()}
                  </label>
                  <Input
                    type="number"
                    value={newSpot[k]}
                    onChange={(e) => setNewSpot((p) => ({ ...p, [k]: e.target.value }))}
                    className="text-sm h-9"
                    style={inputStyle}
                    step="any"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              disabled={creating}
              onClick={handleCreate}
              style={{
                background: 'rgba(240,168,48,0.15)',
                color:      '#f0a830',
                border:     '0.5px solid rgba(240,168,48,0.3)',
                fontFamily: 'var(--font-dm-mono)',
              }}
            >
              {creating ? 'Creating…' : 'Create Spot'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SpotTable({
  spots,
  actionId,
  onPatch,
  showVerify,
}: {
  spots:      SpotRow[]
  actionId:   string | null
  onPatch:    (id: string, payload: Record<string, unknown>) => Promise<void>
  showVerify: boolean
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        className="rounded border overflow-hidden"
        style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10', minWidth: '580px' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {['Name', 'City', 'Type', 'Verified', 'Featured', 'Active', 'Actions'].map((h) => (
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
            {spots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm" style={{ color: '#4a6066' }}>
                  No spots
                </TableCell>
              </TableRow>
            ) : (
              spots.map((s) => {
                const typeStyle = TYPE_COLORS[s.type] ?? TYPE_COLORS.event_space
                const busy = actionId === s._id
                return (
                  <TableRow key={s._id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell>
                      <div className="text-xs">
                        <p style={{ color: '#e8f0ef' }}>{s.name}</p>
                        <p style={{ color: '#4a6066' }}>{s.address}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: '#4a6066' }}>{s.city}</TableCell>
                    <TableCell>
                      <Badge
                        className="text-xs"
                        style={{
                          background: typeStyle.bg,
                          color:      typeStyle.text,
                          border:     `0.5px solid ${typeStyle.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.verified ? (
                        <CheckCircle2 size={14} style={{ color: '#4aff80' }} />
                      ) : (
                        <span className="text-xs" style={{ color: '#4a6066' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.featured ? (
                        <Star size={14} style={{ color: '#f0a830' }} />
                      ) : (
                        <span className="text-xs" style={{ color: '#4a6066' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs"
                        style={{ color: s.isActive ? '#4aff80' : '#4a6066' }}
                      >
                        {s.isActive ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {showVerify && !s.verified && (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => onPatch(s._id, { verified: true })}
                            className="h-6 text-xs px-2"
                            style={{
                              background: 'rgba(74,255,128,0.1)',
                              color:      '#4aff80',
                              border:     '0.5px solid rgba(74,255,128,0.2)',
                              fontFamily: 'var(--font-dm-mono)',
                            }}
                          >
                            Verify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => onPatch(s._id, { featured: !s.featured })}
                          className="h-6 text-xs px-2"
                          style={{
                            color:      '#f0a830',
                            background: 'rgba(240,168,48,0.08)',
                            border:     '0.5px solid rgba(240,168,48,0.15)',
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          <Star size={10} className="mr-0.5" />
                          {s.featured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => onPatch(s._id, { isActive: !s.isActive })}
                          className="h-6 text-xs px-2"
                          variant="ghost"
                          style={{
                            color:      s.isActive ? '#4aff80' : '#4a6066',
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          {s.isActive
                            ? <ToggleRight size={12} className="mr-0.5" />
                            : <ToggleLeft  size={12} className="mr-0.5" />
                          }
                          {s.isActive ? 'On' : 'Off'}
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
  )
}
