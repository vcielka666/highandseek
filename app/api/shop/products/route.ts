import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import type { ProductDTO } from '@/types/shop'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const category  = searchParams.get('category')
    const type      = searchParams.get('type')
    const seedType  = searchParams.getAll('seedType')
    const origin    = searchParams.getAll('origin')
    const climate   = searchParams.getAll('climate')
    const difficulty = searchParams.getAll('difficulty')
    const yieldVal  = searchParams.getAll('yield')
    const priceMax  = searchParams.get('priceMax')
    const q         = searchParams.get('q')
    const sort      = searchParams.get('sort') ?? 'featured'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isAvailable: true }

    if (category && category !== 'all') filter.category = category
    if (type && type !== 'all')         filter['strain.type'] = type
    if (seedType.length)                filter['strain.seedType'] = { $in: seedType }
    if (origin.length)                  filter['strain.origin'] = { $in: origin }
    if (climate.length)                 filter['strain.climate'] = { $in: climate }
    if (difficulty.length)              filter['strain.difficulty'] = { $in: difficulty }
    if (yieldVal.length)                filter['strain.yield'] = { $in: yieldVal }
    if (priceMax)                       filter.price = { $lte: Number(priceMax) }
    if (q)                              filter.$text = { $search: q }

    let sortObj: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1 }
    if (sort === 'newest')    sortObj = { createdAt: -1 }
    if (sort === 'price_asc') sortObj = { price: 1 }
    if (sort === 'price_desc') sortObj = { price: -1 }

    const products = await Product.find(filter).sort(sortObj).lean<ProductDTO[]>()

    return NextResponse.json({ products, total: products.length })
  } catch (err) {
    console.error('[GET /api/shop/products]', err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
