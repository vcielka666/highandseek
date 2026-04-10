'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input }    from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge  from '@/components/admin/StatusBadge'
import { Pencil, Copy, Trash2, Search } from 'lucide-react'

interface Product {
  _id:         string
  slug:        string
  name:        string
  category:    string
  stock:       number
  price:       number
  isAvailable: boolean
  isFeatured:  boolean
  images:      string[]
  createdAt:   string
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return (
    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(204,0,170,0.12)', color: '#cc00aa', fontFamily: 'var(--font-dm-mono)' }}>
      Out of stock
    </span>
  )
  if (stock < 5) return (
    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(240,168,48,0.12)', color: '#f0a830', fontFamily: 'var(--font-dm-mono)' }}>
      {stock}
    </span>
  )
  return (
    <span className="text-xs" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{stock}</span>
  )
}

function InlineStockEdit({ product, onSave }: { product: Product; onSave: (slug: string, stock: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(product.stock))

  const save = async () => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0) { setEditing(false); setVal(String(product.stock)); return }
    await onSave(product.slug, n)
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        type="number"
        value={val}
        autoFocus
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 h-7 text-xs text-center"
        style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.3)', color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}
      />
    )
  }

  return (
    <span className="cursor-pointer" onClick={() => setEditing(true)}>
      <StockBadge stock={product.stock} />
    </span>
  )
}

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      ...(search   ? { search }   : {}),
      ...(category !== 'all' ? { category } : {}),
    })
    const res = await fetch(`/api/admin/products?${params}`)
    if (res.ok) {
      const data = await res.json()
      setProducts(data.products)
    }
    setLoading(false)
  }, [search, category])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateStock = async (slug: string, stock: number) => {
    const res = await fetch(`/api/admin/products/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    })
    if (res.ok) {
      toast.success('Stock updated')
      setProducts((prev) => prev.map((p) => p.slug === slug ? { ...p, stock } : p))
    } else {
      toast.error('Failed to update stock')
    }
  }

  const toggleAvailable = async (slug: string, isAvailable: boolean) => {
    const res = await fetch(`/api/admin/products/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    })
    if (res.ok) {
      toast.success(isAvailable ? 'Product visible' : 'Product hidden')
      setProducts((prev) => prev.map((p) => p.slug === slug ? { ...p, isAvailable } : p))
    } else {
      toast.error('Failed to update product')
    }
  }

  const deleteProduct = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/admin/products/${deleteTarget.slug}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      setProducts((prev) => prev.filter((p) => p.slug !== deleteTarget.slug))
      setDeleteTarget(null)
    } else {
      toast.error('Failed to delete product')
    }
    setDeleting(false)
  }

  const duplicateProduct = async (p: Product) => {
    const res = await fetch(`/api/admin/products/${p.slug}`)
    if (!res.ok) return
    const { product } = await res.json()
    const newSlug = `${product.slug}-copy-${Date.now()}`
    const createRes = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, _id: undefined, slug: newSlug, name: `${product.name} (Copy)`, isAvailable: false }),
    })
    if (createRes.ok) {
      toast.success('Product duplicated')
      fetchProducts()
    } else {
      toast.error('Failed to duplicate product')
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6066' }} />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm h-9"
            style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}
          />
        </div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-36 text-sm h-9" style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
            {['all','seed','clone','flower','merch'].map((c) => (
              <SelectItem key={c} value={c} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded border overflow-hidden" style={{ border: '0.5px solid rgba(240,168,48,0.12)', background: '#0a0d10' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {['','Name','Category','Stock','Price','Status','Actions'].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wider" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm" style={{ color: '#4a6066' }}>
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p._id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <TableCell>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                        style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#4a6066', fontSize: 10 }}>—</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${p.slug}`} className="font-semibold text-sm hover:underline" style={{ color: '#e8f0ef' }}>
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.category} />
                  </TableCell>
                  <TableCell>
                    <InlineStockEdit product={p} onSave={updateStock} />
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: '#e8f0ef', fontFamily: 'var(--font-dm-mono)' }}>
                    {(p.price / 100).toFixed(0)} CZK
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleAvailable(p.slug, !p.isAvailable)}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{
                        background: p.isAvailable ? 'rgba(0,212,200,0.1)' : 'rgba(74,96,102,0.15)',
                        color:      p.isAvailable ? '#00d4c8' : '#4a6066',
                        border:     `0.5px solid ${p.isAvailable ? 'rgba(0,212,200,0.2)' : 'rgba(74,96,102,0.2)'}`,
                        fontFamily: 'var(--font-dm-mono)',
                      }}
                    >
                      {p.isAvailable ? 'Available' : 'Hidden'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/products/${p.slug}`}>
                        <Button size="icon" variant="ghost" className="h-7 w-7" style={{ color: '#4a6066' }}>
                          <Pencil size={13} />
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" className="h-7 w-7" style={{ color: '#4a6066' }} onClick={() => duplicateProduct(p)}>
                        <Copy size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-[#cc00aa]" style={{ color: '#4a6066' }} onClick={() => setDeleteTarget(p)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent style={{ background: '#0a0d10', border: '0.5px solid rgba(204,0,170,0.2)', color: '#e8f0ef' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)' }}>Delete Product</DialogTitle>
            <DialogDescription style={{ color: '#4a6066' }}>
              Delete <strong style={{ color: '#e8f0ef' }}>{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}
              style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              Cancel
            </Button>
            <Button disabled={deleting} onClick={deleteProduct}
              style={{ background: 'rgba(204,0,170,0.15)', color: '#cc00aa', border: '0.5px solid rgba(204,0,170,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
