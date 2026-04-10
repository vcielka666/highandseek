import { notFound, redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Product from '@/lib/db/models/Product'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import EditProductClient from './EditProductClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export default async function EditProductPage({ params }: Props) {
  const { slug } = await params
  await connectDB()

  const product = await Product.findOne({ slug }).lean()
  if (!product) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Edit Product" description={slug} />
      <EditProductClient product={JSON.parse(JSON.stringify(product))} />
    </div>
  )
}
