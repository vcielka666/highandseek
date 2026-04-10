import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } },
    )
    if (!res.ok) throw new Error('CoinGecko error')
    const data = await res.json() as { solana?: { usd?: number } }
    const price = data?.solana?.usd
    if (!price) throw new Error('Price missing')
    return NextResponse.json({ sol_usd: price })
  } catch {
    return NextResponse.json({ sol_usd: 0, error: 'price unavailable' })
  }
}
