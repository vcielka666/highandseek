/** Serialisable product shape — safe to pass from server → client components */
export interface ProductDTO {
  _id: string
  name: string
  slug: string
  category: 'seed' | 'clone' | 'flower' | 'merch'
  strain: {
    type: 'indica' | 'sativa' | 'hybrid' | null
    genetics: string
    origin: 'usa' | 'european' | 'landrace' | null
    floweringTime: number | null
    yield: 'low' | 'medium' | 'high' | null
    difficulty: 'easy' | 'medium' | 'hard' | null
    seedType: 'feminized' | 'autoflower' | 'regular' | null
    climate: 'indoor' | 'outdoor' | 'both' | null
    terpenes: string
  }
  description: string
  shortDescription: string
  price: number
  stock: number
  images: string[]
  tags: string[]
  isAvailable: boolean
  isFeatured: boolean
  createdAt: string
}

export interface CartItem {
  cartKey: string   // unique per variant: productId for seeds/merch, productId-weight for flowers
  productId: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

export interface ShopFilters {
  category?: string
  type?: string
  seedType?: string[]
  origin?: string[]
  climate?: string[]
  difficulty?: string[]
  yield?: string[]
  priceMax?: number
  q?: string
  sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc'
}
