'use client'

import { useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import ShopNavbar from '@/components/shop/ShopNavbar'
import FilterSidebar from '@/components/shop/FilterSidebar'
import CartDrawer from '@/components/shop/CartDrawer'
import AgeGate from '@/components/shop/AgeGate'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const pathname = usePathname()
  const isCheckout = pathname === '/shop/checkout' || pathname === '/shop/success' || pathname === '/shop/orders' || pathname?.startsWith('/shop/orders/')

  return (
    <AgeGate>
      <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
        <ShopNavbar onOpenFilter={() => setFilterOpen(true)} />

        <div style={{ display: 'flex', flex: 1 }}>
          {!isCheckout && (
            <Suspense fallback={null}>
              <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
            </Suspense>
          )}

          <main style={{ flex: 1, minWidth: 0 }}>
            {children}
          </main>
        </div>

        <CartDrawer />
      </div>
    </AgeGate>
  )
}
