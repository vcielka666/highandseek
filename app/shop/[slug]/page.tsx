import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import type { ProductDTO } from '@/types/shop'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params

  await connectDB()

  const raw = await Product.findOne({ slug, isAvailable: true }).lean()
  if (!raw) notFound()

  const relatedRaw = await Product.find({
    slug: { $ne: slug },
    isAvailable: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: (raw as any).category,
  }).limit(3).lean()

  const product = JSON.parse(JSON.stringify(raw)) as ProductDTO
  const related = JSON.parse(JSON.stringify(relatedRaw)) as ProductDTO[]

  return <ProductDetailClient product={product} related={related} />
}
