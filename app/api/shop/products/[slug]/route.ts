import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import type { ProductDTO } from '@/types/shop'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await connectDB()

    const product = await Product.findOne({ slug, isAvailable: true }).lean<ProductDTO>()
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Related: same category + type, exclude self
    const related = await Product.find({
      slug: { $ne: slug },
      isAvailable: true,
      $or: [
        { category: product.category },
        { 'strain.type': product.strain.type },
      ],
    })
      .limit(3)
      .lean<ProductDTO[]>()

    return NextResponse.json({ product, related })
  } catch (err) {
    console.error('[GET /api/shop/products/[slug]]', err)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
