import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import type { ProductDTO } from '@/types/shop'
import ProductDetailClient from './ProductDetailClient'

type Params = Promise<{ slug: string }>

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params

  await connectDB()

  const raw = await Product.findOne({ slug, isAvailable: true }).lean<ProductDTO>()
  if (!raw) notFound()

  const relatedRaw = await Product.find({
    slug: { $ne: slug },
    isAvailable: true,
    $or: [
      { category: raw.category },
      { 'strain.type': raw.strain.type },
    ],
  }).limit(3).lean<ProductDTO[]>()

  // Serialize
  const product: ProductDTO = {
    ...raw,
    _id: raw._id.toString(),
    createdAt: raw.createdAt ? new Date(raw.createdAt as unknown as Date).toISOString() : '',
  }

  const related: ProductDTO[] = relatedRaw.map((p) => ({
    ...p,
    _id: p._id.toString(),
    createdAt: p.createdAt ? new Date(p.createdAt as unknown as Date).toISOString() : '',
  }))

  return <ProductDetailClient product={product} related={related} />
}
