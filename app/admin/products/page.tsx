import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ProductsClient from './ProductsClient'
import { Button } from '@/components/ui/button'

export default function AdminProductsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage catalogue, stock, and availability"
        actions={
          <Link href="/admin/products/new">
            <Button
              size="sm"
              style={{ background: 'rgba(240,168,48,0.15)', color: '#f0a830', border: '0.5px solid rgba(240,168,48,0.3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12 }}
            >
              + Add Product
            </Button>
          </Link>
        }
      />
      <ProductsClient />
    </div>
  )
}
