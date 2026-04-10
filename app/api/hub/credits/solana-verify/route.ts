import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { Connection } from '@solana/web3.js'
import { connectDB } from '@/lib/db/connect'
import { awardCredits } from '@/lib/credits/index'
import SolanaPayment from '@/lib/db/models/SolanaPayment'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VALID_PACKAGES = [5, 15, 30, 50] as const

const BodySchema = z.object({
  signature: z.string().min(1),
  credits:   z.number().refine(v => (VALID_PACKAGES as readonly number[]).includes(v), {
    message: 'Invalid credit package',
  }),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const { signature, credits } = parsed.data

  await connectDB()

  // Idempotency check
  const existing = await SolanaPayment.findOne({ signature })
  if (existing) {
    return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 })
  }

  // Fetch SOL price
  let solPrice = 0
  try {
    const priceRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=czk',
      { next: { revalidate: 60 } },
    )
    const priceData = await priceRes.json() as { solana?: { czk?: number } }
    solPrice = priceData?.solana?.czk ?? 0
  } catch {
    return NextResponse.json({ error: 'Cannot verify SOL price' }, { status: 503 })
  }

  if (solPrice === 0) {
    return NextResponse.json({ error: 'Cannot verify SOL price' }, { status: 503 })
  }

  // Verify transaction on Solana
  const connection = new Connection(
    process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  )

  try {
    const tx = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 })

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 400 })
    }
    if (tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 })
    }

    const treasuryAddress = process.env.SOLANA_TREASURY_ADDRESS ?? ''
    const expectedSol = (credits * 25) / solPrice // 1 credit = 25 CZK, solPrice is CZK/SOL
    const expectedLamports = Math.floor(expectedSol * 1_000_000_000 * 0.98) // 2% slippage

    // Check that the treasury received at least expectedLamports
    const accountKeys = tx.transaction.message.getAccountKeys?.()
    const accounts = accountKeys
      ? Array.from({ length: accountKeys.length }, (_, i) => accountKeys.get(i)?.toBase58() ?? '')
      : []

    const treasuryIndex = accounts.indexOf(treasuryAddress)
    if (treasuryIndex === -1) {
      return NextResponse.json({ error: 'Treasury not found in transaction' }, { status: 400 })
    }

    const preBalance  = tx.meta?.preBalances[treasuryIndex]  ?? 0
    const postBalance = tx.meta?.postBalances[treasuryIndex] ?? 0
    const received    = postBalance - preBalance

    if (received < expectedLamports) {
      return NextResponse.json({ error: 'Insufficient SOL amount in transaction' }, { status: 400 })
    }

    // Save and award
    await SolanaPayment.create({ signature, userId: session.user.id, credits })
    await awardCredits(session.user.id, credits, `Credit purchase via Solana tx:${signature}`)

    return NextResponse.json({ ok: true, credits })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Insufficient credits')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[credits/solana-verify]', err)
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 })
  }
}
