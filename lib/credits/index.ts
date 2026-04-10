import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import CreditEvent from '@/lib/db/models/CreditEvent'

export const CREDIT_PACKAGES = [
  { id: 'starter',  label: 'Starter',  eur: 5,  credits: 60,  bonus: 10 },
  { id: 'standard', label: 'Standard', eur: 10, credits: 130, bonus: 30 },
  { id: 'premium',  label: 'Premium',  eur: 25, credits: 350, bonus: 100 },
] as const

export const CREDIT_COSTS = {
  UNLOCK_PREMIUM_STRAIN: 50,
  EXTENDED_AI_CHAT:      20,
  RARE_STRAIN_AVATAR:    100,
  SHOP_DISCOUNT_VOUCHER: 150,
  SEEKERS_HUNT_ACCESS:   200,
  NFT_CERTIFICATE_MINT:  75,
} as const

export async function awardCredits(userId: string, amount: number, reason: string): Promise<number> {
  await connectDB()
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { new: true },
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
    { new: true },
  )
  await CreditEvent.create({ userId, type: 'spent', amount, reason })
  return updated!.credits
}
