'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/stores/cartStore'
import { toast } from 'sonner'
import type { ProductDTO } from '@/types/shop'

const EUR_TO_CZK = 25
const EUR_TO_USD = 1.08
function czk(eur: number) { return `${Math.round(eur * EUR_TO_CZK).toLocaleString('cs-CZ')} Kč` }
function usd(eur: number) { return `$${Math.round(eur * EUR_TO_USD)}` }

const BADGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  indica:    { bg: 'rgba(204,0,170,0.15)',  color: '#cc00aa', label: 'INDICA'   },
  sativa:    { bg: 'rgba(0,212,200,0.15)',  color: '#00d4c8', label: 'SATIVA'   },
  hybrid:    { bg: 'rgba(136,68,204,0.15)', color: '#8844cc', label: 'HYBRID'   },
  autoflower:{ bg: 'rgba(240,168,48,0.15)', color: '#f0a830', label: 'AUTO'     },
  clone:     { bg: 'rgba(0,212,200,0.12)',  color: '#007a74', label: 'CLONE'    },
  flower:    { bg: 'rgba(240,168,48,0.1)',  color: '#f0a830', label: 'CBD'      },
  merch:     { bg: 'rgba(255,255,255,0.07)',color: '#e8f0ef', label: 'MERCH'    },
}

function getBadge(product: ProductDTO) {
  if (product.strain.seedType === 'autoflower') return BADGE_COLORS.autoflower
  if (product.strain.type && BADGE_COLORS[product.strain.type]) return BADGE_COLORS[product.strain.type]
  if (BADGE_COLORS[product.category]) return BADGE_COLORS[product.category]
  return null
}

export default function ProductCard({ product }: { product: ProductDTO }) {
  const [hovered, setHovered] = useState(false)
  const [qty, setQty] = useState(1)
  const { addItem, openCart } = useCart()

  const badge = getBadge(product)
  const cardBorderColor = product.category === 'merch'
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(0,212,200,0.15)'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      cartKey: product._id,
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: Math.round(product.price * EUR_TO_CZK / 100), // EUR → test CZK price
      image: product.images[0] ?? '',
    }, qty)
    toast.success(`${product.name} added to cart`)
    openCart()
  }

  return (
    <Link
      href={`/shop/${product.slug}?category=${product.category}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setQty(1) }}
    >
      <div style={{
        background: '#0d0d10',
        border: `0.5px solid ${hovered ? 'rgba(0,212,200,0.4)' : cardBorderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 8px 40px rgba(0,212,200,0.12), 0 0 0 0.5px rgba(0,212,200,0.15)' : 'none',
        cursor: 'pointer',
        position: 'relative',
      }}>
        {/* Product image */}
        <div style={{
          position: 'relative',
          aspectRatio: '1',
          background: product.category === 'flower'
            ? 'linear-gradient(135deg, rgba(0,30,28,1) 0%, rgba(20,0,30,1) 50%, rgba(0,20,25,1) 100%)'
            : 'rgba(0,212,200,0.03)',
        }}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: product.category === 'flower' ? 'contain' : 'cover', padding: product.category === 'flower' ? '12px' : '0' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '180px',
            }}>
              <span style={{ fontSize: '48px', opacity: 0.06, fontFamily: 'var(--font-orbitron)' }}>◈</span>
            </div>
          )}

          {/* Type badge */}
          {badge && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: badge.bg,
              color: badge.color,
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '8px',
              letterSpacing: '1.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '3px',
              border: `0.5px solid ${badge.color}33`,
              backdropFilter: 'blur(4px)',
            }}>
              {badge.label}
            </div>
          )}

          {product.isFeatured && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(240,168,48,0.15)',
              color: '#f0a830',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '8px',
              letterSpacing: '1.5px',
              padding: '3px 8px',
              borderRadius: '3px',
              border: '0.5px solid rgba(240,168,48,0.3)',
              backdropFilter: 'blur(4px)',
            }}>
              ✦ FEATURED
            </div>
          )}

          {/* Quick-add overlay on hover */}
          {hovered && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)',
                padding: '20px 12px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={(e) => e.preventDefault()}
            >
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(Math.max(1, qty - 1)) }}
                style={{ width: '26px', height: '26px', borderRadius: '3px', border: '0.5px solid rgba(0,212,200,0.3)', background: 'rgba(0,212,200,0.1)', color: '#e8f0ef', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >−</button>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#e8f0ef', minWidth: '20px', textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(qty + 1) }}
                style={{ width: '26px', height: '26px', borderRadius: '3px', border: '0.5px solid rgba(0,212,200,0.3)', background: 'rgba(0,212,200,0.1)', color: '#e8f0ef', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >+</button>
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  height: '26px',
                  background: '#00d4c8',
                  color: '#050508',
                  fontFamily: 'var(--font-cacha)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 14px 16px' }}>
          <div style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: '13px',
            fontWeight: 700,
            color: '#e8f0ef',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {product.name}
          </div>

          {product.strain.genetics && (
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              color: '#4a6066',
              letterSpacing: '0.3px',
              marginBottom: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {product.strain.genetics}
            </div>
          )}

          {!product.strain.genetics && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                color: '#4a6066',
              }}>
                {product.shortDescription}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '16px', fontWeight: 700, color: '#00d4c8' }}>
                {czk(product.price)}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '6px' }}>
                {usd(product.price)}
              </span>
            </div>
            {product.strain.floweringTime && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', letterSpacing: '0.5px' }}>
                {product.strain.floweringTime}d
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
