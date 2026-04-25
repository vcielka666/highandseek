import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import type { ProductDTO } from '@/types/shop'
import ProductCard from '@/components/shop/ProductCard'
import Link from 'next/link'
import CategorySwitcher from '@/components/shop/CategorySwitcher'
import FlowerGate from '@/components/shop/FlowerGate'
import SortBar from '@/components/shop/SortBar'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const CATEGORY_LABELS: Record<string, string> = {
  seed: 'Genetics',
  flower: 'Flowers',
  merch: 'Merch',
}

function getArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function getString(val: string | string[] | undefined): string | undefined {
  if (!val) return undefined
  return Array.isArray(val) ? val[0] : val
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const rawCategory = getString(params.category)
  if (!rawCategory) redirect('/shop?category=seed')
  const category = rawCategory
  const types      = getArray(params.type)
  const seedTypes  = getArray(params.seedType)
  const origins    = getArray(params.origin)
  const climates   = getArray(params.climate)
  const difficulties = getArray(params.difficulty)
  const yields     = getArray(params.yield)
  const priceMax   = Number(getString(params.priceMax) ?? 2500)
  const sort       = getString(params.sort) ?? 'price_asc'
  const q          = getString(params.q)

  // Server-side flower gate: check HttpOnly cookie — never send flower data to client when locked
  const cookieStore = await cookies()
  const flowerUnlocked = cookieStore.get('flower_access')?.value === 'granted'
  const isFlowerRequest = category === 'flower'

  await connectDB()

  let serialised: ProductDTO[] = []

  // Skip DB query entirely for locked flower requests — no product data in RSC payload
  if (!isFlowerRequest || flowerUnlocked) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isAvailable: true }
    if (category) filter.category = category
    if (types.length)                    filter['strain.type'] = { $in: types }
    if (seedTypes.length)                filter['strain.seedType'] = { $in: seedTypes }
    if (origins.length)                  filter['strain.origin'] = { $in: origins }
    if (climates.length)                 filter['strain.climate'] = { $in: climates }
    if (difficulties.length)             filter['strain.difficulty'] = { $in: difficulties }
    if (yields.length)                   filter['strain.yield'] = { $in: yields }
    if (priceMax < 2500)                 filter.price = { $lte: priceMax }
    if (q)                               filter.name = { $regex: q, $options: 'i' }

    let sortObj: Record<string, 1 | -1> = { price: 1 }
    if (sort === 'price_desc') sortObj = { price: -1 }

    const products = await Product.find(filter).sort(sortObj).lean<ProductDTO[]>()
    // Deep-serialize: strips all Mongoose types (ObjectId, Buffer, etc.) at every level
    serialised = JSON.parse(JSON.stringify(products))
  }

  return (
    <div style={{ padding: '24px 24px 48px' }}>
      {/* Sort bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          {category && <CategorySwitcher current={category} />}
          <span style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '1px',
            color: '#4a6066',
          }}>
            {serialised.length} {serialised.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <SortBar />
      </div>

      {/* Product grid */}
      {category === 'flower' ? (
        <FlowerGate initialUnlocked={flowerUnlocked}>
          {/* Children only rendered (and only present in RSC payload) when server confirms unlock */}
          {flowerUnlocked ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}>
              {serialised.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : null}
        </FlowerGate>
      ) : serialised.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          gap: '16px',
        }}>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '32px', opacity: 0.08 }}>◈</span>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '1px', color: '#4a6066' }}>
            No strains match your filters
          </p>
          <Link
            href={`/shop?category=${category}`}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#00d4c8',
              textDecoration: 'none',
              border: '0.5px solid rgba(0,212,200,0.3)',
              borderRadius: '4px',
              padding: '7px 16px',
            }}
          >
            Reset filters
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {serialised.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
