import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import CreditEvent from '@/lib/db/models/CreditEvent'

// Credit packages — live definition is in app/hub/credits/page.tsx (PACKAGES const)
// 1 credit = 25 CZK
export const CREDIT_PACKAGES = [
  { id: 'starter',  label: 'Starter',  czk: 125,  credits: 5  },
  { id: 'standard', label: 'Standard', czk: 375,  credits: 15 },
  { id: 'premium',  label: 'Premium',  czk: 1250, credits: 50 },
] as const

export const CREDIT_COSTS = {
  UNLOCK_PREMIUM_STRAIN: 50,
  EXTENDED_AI_CHAT:      20,
  RARE_STRAIN_AVATAR:    100,
  SHOP_DISCOUNT_VOUCHER: 150,
  SEEKERS_HUNT_ACCESS:   200,
  NFT_CERTIFICATE_MINT:  75,
  QUIZ_RETRY_2ND:        25,
  QUIZ_RETRY_3RD_PLUS:   50,
  MARKETPLACE_POST:      2,
  MARKETPLACE_EXTEND:    10,
  MARKETPLACE_BOOST:     5,
  AVATAR_BG_TEMPLATE:    3,
  AVATAR_BG_CUSTOM:      6,
} as const

export async function awardCredits(userId: string, amount: number, reason: string): Promise<number> {
  await connectDB()
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { returnDocument: 'after' },
  )
  if (!user) throw new Error('User not found')
  await CreditEvent.create({ userId, type: 'earned', amount, reason })
  return user.credits
}

export async function spendCredits(userId: string, amount: number, reason: string): Promise<number> {
  await connectDB()
  const user = await User.findById(userId).select('credits')
  if (!user) throw new Error('User not found')
  if (user.credits < amount) throw new Error('Insufficient credits')
  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: -amount } },
    { returnDocument: 'after' },
  )
  await CreditEvent.create({ userId, type: 'spent', amount, reason })
  return updated!.credits
}
