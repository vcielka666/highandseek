import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ProductForm from '../ProductForm'

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="New Product" description="Add a new product to the catalogue" />
      <ProductForm />
    </div>
  )
}
