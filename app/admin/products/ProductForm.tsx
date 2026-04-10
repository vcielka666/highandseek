'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch }   from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { X, Plus, Trash2 } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'

const productSchema = z.object({
  name:             z.string().min(1, 'Required'),
  slug:             z.string().min(1).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  category:         z.enum(['seed', 'clone', 'flower', 'merch']),
  description:      z.string().min(1, 'Required'),
  shortDescription: z.string().max(100, 'Max 100 chars'),
  price:            z.coerce.number().min(0),
  stock:            z.coerce.number().int().min(0),
  isAvailable:      z.boolean(),
  isFeatured:       z.boolean(),
  tags:             z.array(z.string()),
  images:           z.array(z.string()),
  variants:         z.array(z.object({ label: z.string(), price: z.coerce.number().min(0) })),
  strain: z.object({
    type:          z.enum(['indica', 'sativa', 'hybrid', '']),
    genetics:      z.string(),
    origin:        z.enum(['usa', 'european', 'landrace', '']),
    floweringTime: z.coerce.number().nullable(),
    yield:         z.enum(['low', 'medium', 'high', '']),
    difficulty:    z.enum(['easy', 'medium', 'hard', '']),
    seedType:      z.enum(['feminized', 'autoflower', 'regular', '']),
    climate:       z.enum(['indoor', 'outdoor', 'both', '']),
    terpenes:      z.string(),
    thc:           z.string(),
    cbd:           z.string(),
    cbn:           z.string(),
  }),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>
  slug?: string      // if editing
  onDelete?: () => void
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const CARD_STYLE = { background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.12)' }
const INPUT_STYLE = { background: '#050508', border: '0.5px solid rgba(240,168,48,0.15)', color: '#e8f0ef', fontFamily: 'var(--font-dm-sans)' }
const LABEL_STYLE = { color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }

export default function ProductForm({ initialValues, slug: editSlug, onDelete }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: standardSchemaResolver(productSchema) as Resolver<ProductFormValues, any>,
    defaultValues: {
      name:             initialValues?.name ?? '',
      slug:             initialValues?.slug ?? '',
      category:         initialValues?.category ?? 'seed',
      description:      initialValues?.description ?? '',
      shortDescription: initialValues?.shortDescription ?? '',
      price:            initialValues?.price ?? 0,
      stock:            initialValues?.stock ?? 0,
      isAvailable:      initialValues?.isAvailable ?? true,
      isFeatured:       initialValues?.isFeatured ?? false,
      tags:             initialValues?.tags ?? [],
      images:           initialValues?.images ?? [],
      variants:         initialValues?.variants ?? [],
      strain: {
        type:          (initialValues?.strain?.type ?? '') as '',
        genetics:      initialValues?.strain?.genetics ?? '',
        origin:        (initialValues?.strain?.origin ?? '') as '',
        floweringTime: initialValues?.strain?.floweringTime ?? null,
        yield:         (initialValues?.strain?.yield ?? '') as '',
        difficulty:    (initialValues?.strain?.difficulty ?? '') as '',
        seedType:      (initialValues?.strain?.seedType ?? '') as '',
        climate:       (initialValues?.strain?.climate ?? '') as '',
        terpenes:      initialValues?.strain?.terpenes ?? '',
        thc:           initialValues?.strain?.thc ?? '',
        cbd:           initialValues?.strain?.cbd ?? '',
        cbn:           initialValues?.strain?.cbn ?? '',
      },
    },
  })

  const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: 'variants',
  })

  const category = form.watch('category')
  const shortDesc = form.watch('shortDescription')

  const autoSlug = () => {
    const name = form.getValues('name')
    form.setValue('slug', slugify(name))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    const tags = form.getValues('tags')
    if (!tags.includes(t)) form.setValue('tags', [...tags, t])
    setTagInput('')
  }

  const removeTag = (t: string) => {
    form.setValue('tags', form.getValues('tags').filter((x) => x !== t))
  }

  const submit = async (values: ProductFormValues, asDraft = false) => {
    setSaving(true)
    // tags and images are managed via setValue (not <FormField>) — read live state explicitly.
    // variants are managed via useFieldArray so values.variants is reliable.
    const payload = {
      ...values,
      tags:     form.getValues('tags'),
      images:   form.getValues('images'),
      isAvailable: asDraft ? false : values.isAvailable,
    }

    // Convert empty strings to null for strain fields
    const strain = { ...payload.strain }
    ;(['type','origin','yield','difficulty','seedType','climate'] as const).forEach((k) => {
      if (strain[k] === '') (strain as Record<string, unknown>)[k] = null
    })
    payload.strain = strain as typeof payload.strain

    const url    = editSlug ? `/api/admin/products/${editSlug}` : '/api/admin/products'
    const method = editSlug ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      toast.success(editSlug ? 'Product saved' : 'Product created')
      router.refresh()
      router.push('/admin/products')
    } else {
      const err = await res.json()
      toast.error(JSON.stringify(err?.error ?? err) ?? 'Failed to save product')
    }
    setSaving(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => submit(v))} className="space-y-5">

        {/* Basic Info */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>Name</FormLabel>
                  <FormControl>
                    <Input {...field} onBlur={() => { field.onBlur(); if (!editSlug) autoSlug() }} style={INPUT_STYLE} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>Slug</FormLabel>
                  <FormControl><Input {...field} style={INPUT_STYLE} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger style={{ ...INPUT_STYLE }}><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                      {['seed','clone','flower','merch'].map((c) => (
                        <SelectItem key={c} value={c} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>Base Price (CZK) — leave 0 if using variants</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} style={INPUT_STYLE} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stock" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>Stock</FormLabel>
                  <FormControl><Input type="number" {...field} style={INPUT_STYLE} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="shortDescription" render={({ field }) => (
              <FormItem>
                <FormLabel style={LABEL_STYLE}>
                  Short Description
                  <span style={{ marginLeft: 8, color: shortDesc.length > 90 ? '#cc00aa' : '#4a6066' }}>
                    {shortDesc.length}/100
                  </span>
                </FormLabel>
                <FormControl><Textarea {...field} rows={2} style={INPUT_STYLE} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel style={LABEL_STYLE}>Full Description</FormLabel>
                <FormControl><Textarea {...field} rows={5} style={INPUT_STYLE} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-6">
              <FormField control={form.control} name="isAvailable" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel style={{ ...LABEL_STYLE, marginBottom: 0 }}>Available</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel style={{ ...LABEL_STYLE, marginBottom: 0 }}>Featured</FormLabel>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Strain Details */}
        {category !== 'merch' && (
          <Card style={CARD_STYLE}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Strain Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'strain.type' as const,       label: 'Type',       opts: ['','indica','sativa','hybrid'] },
                  { name: 'strain.origin' as const,     label: 'Origin',     opts: ['','usa','european','landrace'] },
                  { name: 'strain.yield' as const,      label: 'Yield',      opts: ['','low','medium','high'] },
                  { name: 'strain.difficulty' as const, label: 'Difficulty', opts: ['','easy','medium','hard'] },
                  { name: 'strain.climate' as const,    label: 'Climate',    opts: ['','indoor','outdoor','both'] },
                ].map(({ name, label, opts }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>{label}</FormLabel>
                      <Select value={field.value as string ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger style={{ ...INPUT_STYLE }}><SelectValue placeholder="—" /></SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                          {opts.map((o) => (
                            <SelectItem key={o || '__none'} value={o} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>
                              {o || '—'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                ))}

                {category !== 'clone' && category !== 'flower' && (
                  <FormField control={form.control} name="strain.seedType" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Seed Type</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger style={{ ...INPUT_STYLE }}><SelectValue placeholder="—" /></SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ background: '#0a0d10', border: '0.5px solid rgba(240,168,48,0.2)' }}>
                          {['','feminized','autoflower','regular'].map((o) => (
                            <SelectItem key={o || '__none'} value={o} style={{ color: '#e8f0ef', textTransform: 'capitalize' }}>{o || '—'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="strain.genetics" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Genetics</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. OG Kush × Gelato" style={INPUT_STYLE} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="strain.floweringTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Flowering Time (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} style={INPUT_STYLE} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Terpene checkboxes */}
              <div>
                <div style={LABEL_STYLE} className="mb-2">Terpene Profile</div>
                <div className="flex flex-wrap gap-2">
                  {['myrcene','caryophyllene','limonene','terpinolene','ocimene','linalool'].map((terp) => {
                    const selected = (form.watch('strain.terpenes') || '').split(',').map((t) => t.trim()).filter(Boolean).includes(terp)
                    return (
                      <button
                        key={terp}
                        type="button"
                        onClick={() => {
                          const current = (form.getValues('strain.terpenes') || '').split(',').map((t) => t.trim()).filter(Boolean)
                          const next = selected ? current.filter((t) => t !== terp) : [...current, terp]
                          form.setValue('strain.terpenes', next.join(','))
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '4px',
                          border: `0.5px solid rgba(240,168,48,${selected ? '0.5' : '0.15'})`,
                          background: selected ? 'rgba(240,168,48,0.15)' : 'transparent',
                          color: selected ? '#f0a830' : '#4a6066',
                          fontFamily: 'var(--font-dm-mono)',
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.15s',
                        }}
                      >
                        {terp}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* THC / CBD / CBN */}
              <div className="grid grid-cols-3 gap-4">
                {(['thc', 'cbd', 'cbn'] as const).map((field) => (
                  <FormField key={field} control={form.control} name={`strain.${field}`} render={({ field: f }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>{field.toUpperCase()} %</FormLabel>
                      <FormControl>
                        <Input {...f} placeholder="e.g. 22-26%" style={INPUT_STYLE} />
                      </FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              images={form.watch('images') ?? []}
              onChange={(urls) => form.setValue('images', urls)}
            />
          </CardContent>
        </Card>

        {/* Pricing Variants */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Pricing Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
              Define package options (e.g. 5g / 10g for flower, 1 seed / 10 seeds). Prices in CZK. Leave empty to use base price.
            </p>

            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Flower presets', variants: [{ label: '3g', price: 450 }, { label: '5g', price: 700 }, { label: '10g', price: 1300 }] },
                { label: 'Seed presets', variants: [{ label: '1 seed', price: 200 }, { label: '5 seeds', price: 900 }, { label: '10 seeds', price: 1600 }] },
              ].map(({ label, variants }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => replaceVariants(variants)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '0.5px solid rgba(240,168,48,0.2)',
                    background: 'rgba(240,168,48,0.06)',
                    color: '#f0a830',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Variant rows */}
            {variantFields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Input
                  {...form.register(`variants.${i}.label`)}
                  placeholder="Label (e.g. 5g)"
                  style={{ ...INPUT_STYLE, flex: 1 }}
                />
                <Input
                  type="number"
                  {...form.register(`variants.${i}.price`, { valueAsNumber: true })}
                  placeholder="Price (CZK)"
                  style={{ ...INPUT_STYLE, width: '130px' }}
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  style={{ color: '#cc00aa', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => appendVariant({ label: '', price: 0 })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '4px',
                border: '0.5px solid rgba(240,168,48,0.2)',
                background: 'transparent',
                color: '#4a6066',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} /> Add variant
            </button>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 11, marginBottom: '12px' }}>
              Highlighted on the product page. Click to toggle — saves as tags automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'Bio Organic',   emoji: '🌿', color: '#00b450',  border: 'rgba(0,180,80,0.3)',    bg: 'rgba(0,180,80,0.15)'    },
                { key: 'High THC',      emoji: '🔥', color: '#cc00aa',  border: 'rgba(204,0,170,0.3)',   bg: 'rgba(204,0,170,0.15)'   },
                { key: 'CBD Rich',      emoji: '💚', color: '#00d4c8',  border: 'rgba(0,212,200,0.3)',   bg: 'rgba(0,212,200,0.15)'   },
                { key: 'Lab Tested',    emoji: '🔬', color: '#8844cc',  border: 'rgba(136,68,204,0.3)',  bg: 'rgba(136,68,204,0.15)'  },
                { key: 'Award Winner',  emoji: '🏆', color: '#f0a830',  border: 'rgba(240,168,48,0.3)',  bg: 'rgba(240,168,48,0.15)'  },
                { key: 'Indoor Grown',  emoji: '🏠', color: '#007a74',  border: 'rgba(0,212,200,0.25)',  bg: 'rgba(0,212,200,0.1)'    },
                { key: 'Outdoor Grown', emoji: '☀️', color: '#8a5e1a',  border: 'rgba(240,168,48,0.25)', bg: 'rgba(240,168,48,0.1)'   },
                { key: 'Limited Batch', emoji: '✨', color: '#cc00aa',  border: 'rgba(204,0,170,0.25)',  bg: 'rgba(204,0,170,0.1)'    },
              ] as const).map(({ key, emoji, color, border, bg }) => {
                const tags = form.watch('tags')
                const active = tags.map((t) => t.toLowerCase()).includes(key.toLowerCase())
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const current = form.getValues('tags')
                      const next = active
                        ? current.filter((t) => t.toLowerCase() !== key.toLowerCase())
                        : [...current, key]
                      form.setValue('tags', next)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '4px',
                      border: `0.5px solid ${active ? border : 'rgba(255,255,255,0.08)'}`,
                      background: active ? bg : 'transparent',
                      color: active ? color : '#4a6066',
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{emoji}</span> {key}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card style={CARD_STYLE}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: '#f0a830', fontFamily: 'var(--font-orbitron)' }}>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="type + Enter to add"
                className="text-sm"
                style={INPUT_STYLE}
              />
              <Button type="button" onClick={addTag} size="sm"
                style={{ background: 'rgba(240,168,48,0.1)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.2)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('tags').map((t) => (
                <div key={t} className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(240,168,48,0.08)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.15)', fontFamily: 'var(--font-dm-mono)' }}>
                  {t}
                  <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}
            style={{ background: 'rgba(240,168,48,0.15)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" disabled={saving}
            onClick={() => form.handleSubmit((v) => submit(v, true))()}
            style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
            Save as Draft
          </Button>
          {onDelete && (
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(true)}
              style={{ color: '#cc00aa', fontFamily: 'var(--font-dm-mono)', fontSize: 12, marginLeft: 'auto' }}>
              Delete
            </Button>
          )}
        </div>
      </form>

      {onDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent style={{ background: '#0a0d10', border: '0.5px solid rgba(204,0,170,0.2)', color: '#e8f0ef' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#cc00aa', fontFamily: 'var(--font-orbitron)' }}>Delete Product</DialogTitle>
              <DialogDescription style={{ color: '#4a6066' }}>This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}
                style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: '#4a6066', background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
                Cancel
              </Button>
              <Button onClick={() => { setDeleteOpen(false); onDelete() }}
                style={{ background: 'rgba(204,0,170,0.15)', color: '#cc00aa', border: '0.5px solid rgba(204,0,170,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Form>
  )
}
