import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  walletAddress: z.string().min(1),
  signature:     z.string().min(1),
  message:       z.string().min(1),
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

  const { walletAddress, signature, message } = parsed.data

  if (!message.startsWith('Connect wallet to High & Seek:')) {
    return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
  }

  try {
    const publicKey    = new PublicKey(walletAddress)
    const messageBytes = Buffer.from(message)
    const sigBytes     = bs58.decode(signature)
    const pubKeyBytes  = publicKey.toBytes()

    const valid = nacl.sign.detached.verify(messageBytes, sigBytes, pubKeyBytes)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  await connectDB()
  await User.findByIdAndUpdate(session.user.id, { walletAddress })

  return NextResponse.json({ ok: true, walletAddress })
}
