'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ProductForm from '../ProductForm'

interface EditProductClientProps {
  product: Record<string, unknown>
}

export default function EditProductClient({ product }: EditProductClientProps) {
  const router = useRouter()

  const handleDelete = async () => {
    const res = await fetch(`/api/admin/products/${product.slug}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      router.push('/admin/products')
    } else {
      toast.error('Failed to delete product')
    }
  }

  const strain = product.strain as Record<string, unknown> | undefined

  return (
    <ProductForm
      slug={String(product.slug)}
      initialValues={{
        name:             String(product.name ?? ''),
        slug:             String(product.slug ?? ''),
        category:         (product.category ?? 'seed') as 'seed' | 'clone' | 'flower' | 'merch',
        description:      String(product.description ?? ''),
        shortDescription: String(product.shortDescription ?? ''),
        price:            Number(product.price ?? 0),
        stock:            Number(product.stock ?? 0),
        isAvailable:      Boolean(product.isAvailable),
        isFeatured:       Boolean(product.isFeatured),
        tags:             (product.tags as string[]) ?? [],
        images:           (product.images as string[]) ?? [],
        variants:         (product.variants as { label: string; price: number }[]) ?? [],
        strain: {
          type:          (strain?.type ?? '') as '',
          genetics:      String(strain?.genetics ?? ''),
          origin:        (strain?.origin ?? '') as '',
          floweringTime: strain?.floweringTime != null ? Number(strain.floweringTime) : null,
          yield:         (strain?.yield ?? '') as '',
          difficulty:    (strain?.difficulty ?? '') as '',
          seedType:      (strain?.seedType ?? '') as '',
          climate:       (strain?.climate ?? '') as '',
          terpenes:      String(strain?.terpenes ?? ''),
          thc:           String(strain?.thc ?? ''),
          cbd:           String(strain?.cbd ?? ''),
          cbn:           String(strain?.cbn ?? ''),
        },
      }}
      onDelete={handleDelete}
    />
  )
}
