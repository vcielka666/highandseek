'use client'

import { useState, Suspense } from 'react'
import ShopNavbar from '@/components/shop/ShopNavbar'
import FilterSidebar from '@/components/shop/FilterSidebar'
import CartDrawer from '@/components/shop/CartDrawer'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
      <ShopNavbar onOpenFilter={() => setFilterOpen(true)} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Suspense fallback={null}>
          <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
        </Suspense>

        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <CartDrawer />
    </div>
  )
}
