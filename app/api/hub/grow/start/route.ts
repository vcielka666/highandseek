import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import Strain from '@/lib/db/models/Strain'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { spendCredits } from '@/lib/credits'
import { calculateAttributes, estimateYield, generateGuide, type GrowAttributes } from '@/lib/grow/attributes'

const LIGHT_IMAGES: Record<string, string> = {
  led: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046794/light-led_o3w4p6.png',
  hps: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046794/light-hps_atpeyj.png',
  cmh: '',
  cfl: '',
}

const POT_IMAGES: Record<string, string> = {
  small:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046945/pot-small_lr05r7.png',
  medium: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046946/pot-medium_cmrorl.png',
  large:  'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046949/pot-large_upcfrg.png',
}

const MEDIUM_IMAGES: Record<string, string> = {
  living_soil: 'https://res.cloudinary.com/dbrbbjlp0/image/upload/v1775046962/medium-soil_zbyoum.png',
  coco:        '',
  hydro:       '',
}

const SetupSchema = z.object({
  tentSize:          z.enum(['60x60', '80x80', '100x100', '120x120', '150x150']),
  lightType:         z.enum(['led', 'hps', 'cmh', 'cfl']),
  lightWatts:        z.number().int().min(1).max(2000),
  lightBrand:        z.string().default(''),
  medium:            z.enum(['living_soil', 'coco', 'hydro']),
  potSize:           z.enum(['small', 'medium', 'large']),
  watering:          z.enum(['manual', 'blumat', 'drip']),
  nutrients:         z.enum(['organic', 'mineral', 'none']),
  hasExhaustFan:     z.boolean().default(false),
  exhaustCFM:        z.number().min(0).default(0),
  hasCirculationFan: z.boolean().default(false),
  hasCarbonFilter:   z.boolean().default(false),
  hasPHMeter:        z.boolean().default(false),
  hasECMeter:        z.boolean().default(false),
  hasHygrometer:     z.boolean().default(false),
})

const CustomStrainSchema = z.object({
  name:          z.string().min(1).max(60),
  type:          z.enum(['indica', 'sativa', 'hybrid']),
  floweringTime: z.number().int().min(42).max(120),
  difficulty:    z.enum(['easy', 'medium', 'hard']).default('medium'),
})

const StartSchema = z.object({
  strainSlug:          z.string().min(1).optional(),
  customStrain:        CustomStrainSchema.optional(),
  setup:               SetupSchema,
  dayDurationSeconds:  z.number().int().min(60).max(86400).default(86400),
}).refine(d => d.strainSlug || d.customStrain, {
  message: 'Either strainSlug or customStrain is required',
})

const GROW_COST_CREDITS       = 3
const CUSTOM_STRAIN_COST      = 5

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = StartSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  }
  const { strainSlug, customStrain, setup, dayDurationSeconds } = parsed.data

  await connectDB()

  // Check no active grow
  const existingActive = await VirtualGrow.findOne({ userId: session.user.id, status: 'active' })
  if (existingActive) {
    return NextResponse.json({ error: 'You already have an active grow' }, { status: 409 })
  }

  // Check credits — first grow is free (realtime only)
  const user = await User.findById(session.user.id).select('growsCompleted credits').lean<{
    growsCompleted: number; credits: number
  }>()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // First grow is free regardless of speed (no customStrain)
  const isFree = user.growsCompleted === 0 && !customStrain

  // Custom strain costs 5 credits on top of grow cost
  const totalCost = (isFree ? 0 : GROW_COST_CREDITS) + (customStrain ? CUSTOM_STRAIN_COST : 0)
  if (totalCost > 0 && user.credits < totalCost) {
    return NextResponse.json({
      error: `Insufficient credits (need ${totalCost})`,
      needed: totalCost,
      have: user.credits,
    }, { status: 402 })
  }

  // Resolve strain data
  let strainData: { slug: string; name: string; type: 'indica' | 'sativa' | 'hybrid'; floweringTime: number }

  if (customStrain) {
    // Deduct credits for custom strain
    await spendCredits(session.user.id, CUSTOM_STRAIN_COST, 'custom_strain_grow')
    if (!isFree) {
      await spendCredits(session.user.id, GROW_COST_CREDITS, 'virtual_grow_start')
    }
    strainData = {
      slug:          `custom-${Date.now()}`,
      name:          customStrain.name,
      type:          customStrain.type,
      floweringTime: customStrain.floweringTime,
    }
  } else {
    const strain = await Strain.findOne({ slug: strainSlug, isActive: true }).lean<{
      slug: string; name: string; type: 'indica' | 'sativa' | 'hybrid'; floweringTime: number
    }>()
    if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 })
    if (!isFree) {
      await spendCredits(session.user.id, GROW_COST_CREDITS, 'virtual_grow_start')
    }
    strainData = strain
  }

  // Build full setup with image URLs
  const fullSetup = {
    ...setup,
    lightImageUrl:  LIGHT_IMAGES[setup.lightType] ?? '',
    potImageUrl:    POT_IMAGES[setup.potSize]     ?? '',
    mediumImageUrl: MEDIUM_IMAGES[setup.medium]   ?? '',
  }

  const environment = {
    temperature: 24,
    humidity:    60,
    ph:          6.5,
    ec:          1.4,
    lightHours:  18,
  }

  const initialAttributes = calculateAttributes(fullSetup, environment, 'seedling', 70)
  const yieldProjection   = estimateYield(fullSetup, strainData.type)

  // Generate initial warnings for any out-of-range attributes
  const initialWarnings: Array<{ attribute: string; message: string; guide: string; severity: 'warning' | 'critical'; triggeredAt: Date; resolvedAt: null }> = []
  for (const [key, attr] of Object.entries(initialAttributes) as [keyof GrowAttributes, (typeof initialAttributes)[keyof GrowAttributes]][]) {
    if (attr.status === 'optimal') continue
    const guide = generateGuide(key, attr.status, attr.value, fullSetup, 'seedling')
    initialWarnings.push({
      attribute:   key,
      message:     guide.split('\n')[0] ?? `${key} out of range`,
      guide,
      severity:    attr.status,
      triggeredAt: new Date(),
      resolvedAt:  null,
    })
  }

  const grow = await VirtualGrow.create({
    userId:        session.user.id,
    strainSlug:    strainData.slug,
    strainName:    strainData.name,
    strainType:    strainData.type,
    floweringTime: strainData.floweringTime || 63,
    setup:         fullSetup,
    dayDurationSeconds,
    timeMode:       dayDurationSeconds >= 86400 ? 'realtime' : 'accelerated',
    isAccelerated:  dayDurationSeconds < 86400,
    // Full perks only at realtime (24h/day). NFT cert requires realtime.
    isPerkEligible: dayDurationSeconds >= 86400,
    environment,
    attributes:    initialAttributes,
    warnings:      initialWarnings,
    yieldProjection,
    creditsSpent:  totalCost,
    lastAdvanced:  new Date(0), // allow immediate first advance
  })

  await awardXP(session.user.id, 'GROW_STARTED')

  return NextResponse.json({ grow }, { status: 201 })
}
