'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/shop'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (cartKey: string) => void
  updateQty: (cartKey: string, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, qty = 1) => {
        set((state) => {
          // Migrate legacy items that were saved before cartKey existed
          const items = state.items.map((i) =>
            i.cartKey ? i : { ...i, cartKey: i.productId }
          )
          const existing = items.find((i) => i.cartKey === item.cartKey)
          if (existing) {
            return {
              items: items.map((i) =>
                i.cartKey === item.cartKey
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...items, { ...item, quantity: qty }] }
        })
      },

      removeItem: (cartKey) =>
        set((state) => ({ items: state.items.filter((i) => i.cartKey !== cartKey) })),

      updateQty: (cartKey, qty) => {
        if (qty < 1) {
          get().removeItem(cartKey)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'hs-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
