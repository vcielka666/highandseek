'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/stores/cartStore'
import { toast } from 'sonner'
import ProductCard from '@/components/shop/ProductCard'
import type { ProductDTO } from '@/types/shop'

const STAT_ICONS: Record<string, string> = {
  floweringTime: '⏱',
  origin:        '📍',
  climate:       '🏔',
  difficulty:    '⚡',
  yield:         '💪',
  seedType:      '🌱',
}

const ORIGIN_LABELS: Record<string, string> = {
  usa: 'USA Genetics', european: 'European', landrace: 'Landrace',
}

const CLIMATE_LABELS: Record<string, string> = {
  indoor: 'Indoor', outdoor: 'Outdoor', both: 'Indoor / Outdoor',
}

const FLOWER_WEIGHTS = [
  { label: '5g',  price: 800  },
  { label: '10g', price: 1500 },
  { label: '25g', price: 3600 },
]

export default function ProductDetailClient({
  product,
  related,
}: {
  product: ProductDTO
  related: ProductDTO[]
}) {
  const isFlower = product.category === 'flower'
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [flowerWeight, setFlowerWeight] = useState(0)
  const { addItem, openCart } = useCart()

  const images = product.images.length > 0 ? product.images : ['']

  function handleAddToCart() {
    if (isFlower) {
      const option = FLOWER_WEIGHTS[flowerWeight]
      addItem({
        productId: product._id,
        slug: product.slug,
        name: `${product.name} ${option.label}`,
        price: option.price,
        image: product.images[0] ?? '',
      }, 1)
      toast.success(`${product.name} ${option.label} added to cart`)
    } else {
      addItem({
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? '',
      }, qty)
      toast.success(`${product.name} added to cart`)
    }
    openCart()
  }

  const categoryLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1) + 's'
  const typeLabel = product.strain.type
    ? product.strain.type.charAt(0).toUpperCase() + product.strain.type.slice(1)
    : null

  const stats = [
    product.strain.floweringTime && { key: 'floweringTime', label: 'Flowering', value: `${product.strain.floweringTime} days` },
    product.strain.origin        && { key: 'origin',        label: 'Origin',    value: ORIGIN_LABELS[product.strain.origin] ?? product.strain.origin },
    product.strain.climate       && { key: 'climate',       label: 'Climate',   value: CLIMATE_LABELS[product.strain.climate] ?? product.strain.climate },
    product.strain.difficulty    && { key: 'difficulty',    label: 'Difficulty',value: product.strain.difficulty.charAt(0).toUpperCase() + product.strain.difficulty.slice(1) },
    product.strain.yield         && { key: 'yield',         label: 'Yield',     value: product.strain.yield.charAt(0).toUpperCase() + product.strain.yield.slice(1) },
    product.strain.seedType      && { key: 'seedType',      label: 'Type',      value: product.strain.seedType.charAt(0).toUpperCase() + product.strain.seedType.slice(1) },
  ].filter(Boolean) as { key: string; label: string; value: string }[]

  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {([
          { label: 'Shop', href: '/shop' },
          { label: categoryLabel, href: `/shop?category=${product.category}` },
          ...(typeLabel ? [{ label: typeLabel, href: `/shop?category=${product.category}&type=${product.strain.type}` }] : []),
          { label: product.name, href: null },
        ] as { label: string; href: string | null }[]).map((crumb, i, arr) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {crumb.href ? (
              <Link href={crumb.href} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#4a6066', textDecoration: 'none' }}
                className="hover:text-[#00d4c8] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#00d4c8' }}>
                {crumb.label}
              </span>
            )}
            {i < arr.length - 1 && (
              <span style={{ color: '#4a6066', fontSize: '10px' }}>›</span>
            )}
          </span>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '40px', alignItems: 'start' }}
        className="max-lg:grid-cols-1">

        {/* LEFT: Image gallery */}
        <div>
          <div style={{
            aspectRatio: '1',
            borderRadius: '8px',
            background: isFlower
              ? 'linear-gradient(135deg, rgba(0,30,28,1) 0%, rgba(20,0,30,1) 50%, rgba(0,20,25,1) 100%)'
              : 'rgba(0,212,200,0.03)',
            border: `0.5px solid ${isFlower ? 'rgba(204,0,170,0.2)' : 'rgba(0,212,200,0.15)'}`,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '12px',
          }}>
            {images[activeImage] ? (
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                style={{ objectFit: isFlower ? 'contain' : 'cover', padding: isFlower ? '20px' : '0' }}
                priority
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '72px', opacity: 0.05, fontFamily: 'var(--font-orbitron)' }}>◈</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    border: `0.5px solid ${activeImage === i ? '#00d4c8' : 'rgba(0,212,200,0.15)'}`,
                    background: 'rgba(0,212,200,0.03)',
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {img && <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product info */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 700,
            color: '#e8f0ef',
            marginBottom: '6px',
            lineHeight: 1.1,
          }}>
            {product.name}
          </h1>

          {product.strain.genetics && (
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              color: '#4a6066',
              letterSpacing: '0.5px',
              marginBottom: '16px',
            }}>
              {product.strain.genetics}
            </div>
          )}

          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            color: 'rgba(232,240,239,0.7)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}>
            {product.shortDescription}
          </p>

          {/* Strain stats */}
          {stats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {stats.map(({ key, label, value }) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(0,212,200,0.05)',
                  border: '0.5px solid rgba(0,212,200,0.15)',
                  borderRadius: '4px',
                  padding: '5px 10px',
                }}>
                  <span style={{ fontSize: '11px' }}>{STAT_ICONS[key]}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', color: '#4a6066', textTransform: 'uppercase' }}>
                    {label}:
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#e8f0ef' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Price / Weight selector */}
          {isFlower ? (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {FLOWER_WEIGHTS.map((opt, i) => {
                  const active = flowerWeight === i
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setFlowerWeight(i)}
                      style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '12px 8px',
                        borderRadius: '6px',
                        border: `0.5px solid ${active ? 'rgba(240,168,48,0.6)' : 'rgba(240,168,48,0.15)'}`,
                        background: active ? 'rgba(240,168,48,0.12)' : 'rgba(240,168,48,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: active ? '#f0a830' : '#7a6030', marginBottom: '4px' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.5px', color: active ? '#f0a830' : '#4a6066' }}>
                        {opt.price.toLocaleString()} CZK
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{
                  width: '100%',
                  height: '46px',
                  background: product.stock === 0 ? 'rgba(0,212,200,0.3)' : '#00d4c8',
                  color: '#050508',
                  fontFamily: 'var(--font-cacha)',
                  fontSize: '14px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                className="hover:bg-[#00f5e8] hover:shadow-[0_0_20px_rgba(0,212,200,0.4)]"
              >
                {product.stock === 0 ? 'Out of Stock' : `Add ${FLOWER_WEIGHTS[flowerWeight].label} — ${FLOWER_WEIGHTS[flowerWeight].price.toLocaleString()} CZK`}
              </button>
            </div>
          ) : (
            <>
              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '32px', fontWeight: 700, color: '#00d4c8' }}>
                  €{product.price}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066', letterSpacing: '0.5px' }}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              {/* Qty + Add to cart */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '0.5px solid rgba(0,212,200,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{ width: '36px', height: '46px', background: 'rgba(0,212,200,0.05)', border: 'none', color: '#e8f0ef', cursor: 'pointer', fontSize: '16px', transition: 'background 0.15s' }}
                    className="hover:bg-[rgba(0,212,200,0.12)]"
                  >−</button>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: '#e8f0ef', width: '40px', textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{ width: '36px', height: '46px', background: 'rgba(0,212,200,0.05)', border: 'none', color: '#e8f0ef', cursor: 'pointer', fontSize: '16px', transition: 'background 0.15s' }}
                    className="hover:bg-[rgba(0,212,200,0.12)]"
                  >+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  style={{
                    flex: 1,
                    height: '46px',
                    background: product.stock === 0 ? 'rgba(0,212,200,0.3)' : '#00d4c8',
                    color: '#050508',
                    fontFamily: 'var(--font-cacha)',
                    fontSize: '14px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="hover:bg-[#00f5e8] hover:shadow-[0_0_20px_rgba(0,212,200,0.4)]"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </>
          )}

          {/* Virtual grow chip — only for seeds/clones */}
          {!isFlower && product.category !== 'merch' && (
            <Link
              href="/hub"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '0.5px solid rgba(240,168,48,0.3)',
                background: 'rgba(240,168,48,0.07)',
                marginBottom: '28px',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              className="hover:bg-[rgba(240,168,48,0.14)] hover:border-[rgba(240,168,48,0.5)]"
            >
              <span style={{ fontSize: '11px' }}>🌱</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.5px', color: '#f0a830', textTransform: 'uppercase' }}>
                Grow it virtually →
              </span>
            </Link>
          )}

          {/* Separator */}
          <div style={{ height: '0.5px', background: 'rgba(0,212,200,0.1)', marginBottom: '24px' }} />

          {/* Full description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {product.description.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                color: 'rgba(232,240,239,0.65)',
                lineHeight: 1.8,
                margin: 0,
              }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Related strains */}
      {related.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <div style={{ height: '0.5px', background: 'rgba(0,212,200,0.08)', marginBottom: '32px' }} />
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#4a6066',
            marginBottom: '20px',
          }}>
            Related strains
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
