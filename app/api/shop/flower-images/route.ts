import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    let products = await Product.find({ isAvailable: true, category: 'flower' })
      .select('images')
      .limit(12)
      .lean() as { images?: string[] }[]
    if (products.length === 0) {
      products = await Product.find({ isAvailable: true })
        .select('images')
        .limit(12)
        .lean() as { images?: string[] }[]
    }
    const urls = products.flatMap(p => p.images ?? []).filter(Boolean) as string[]
    return NextResponse.json(urls)
  } catch (err) {
    console.error('[flower-images]', err)
    return NextResponse.json([])
  }
}
