import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import Strain from '@/lib/db/models/Strain'
import User from '@/lib/db/models/User'
import { awardXP } from '@/lib/xp'
import { calculateAttributes, estimateYield, generateGuide, getWarningCode, type GrowAttributes } from '@/lib/grow/attributes'

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
  plantCount:        z.number().int().min(1).max(4).default(1),
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
  cloneStrainSlug:     z.string().min(1).optional(),   // use a clone from cloneBank
  setup:               SetupSchema,
  dayDurationSeconds:  z.number().int().min(60).max(86400).default(86400),
}).refine(d => d.strainSlug || d.customStrain || d.cloneStrainSlug, {
  message: 'Either strainSlug, customStrain or cloneStrainSlug is required',
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = StartSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  }
  const { strainSlug, customStrain, cloneStrainSlug, setup, dayDurationSeconds } = parsed.data

  await connectDB()

  const [user, activeGrowCount] = await Promise.all([
    User.findById(session.user.id).select('growsCompleted credits cloneBank').lean<{
      growsCompleted: number
      credits: number
      cloneBank: Array<{ strainSlug: string; strainName: string; strainType: 'indica'|'sativa'|'hybrid'; floweringTime: number }>
    }>(),
    VirtualGrow.countDocuments({ userId: session.user.id, status: 'active' }),
  ])
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Free if no active grow — costs 2 credits only when starting a second concurrent grow
  const CONCURRENT_GROW_COST = 2
  const hasActiveGrow = activeGrowCount > 0
  if (hasActiveGrow) {
    if ((user.credits ?? 0) < CONCURRENT_GROW_COST) {
      return NextResponse.json({ error: 'Not enough credits', required: CONCURRENT_GROW_COST, current: user.credits ?? 0 }, { status: 402 })
    }
    await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -CONCURRENT_GROW_COST } })
  }
  // Resolve strain data
  let strainData: { slug: string; name: string; type: 'indica' | 'sativa' | 'hybrid'; floweringTime: number }
  let isClone = false

  if (cloneStrainSlug) {
    const clone = user?.cloneBank?.find(c => c.strainSlug === cloneStrainSlug)
    if (!clone) return NextResponse.json({ error: 'Clone not found in your bank' }, { status: 404 })
    strainData = { slug: clone.strainSlug, name: clone.strainName, type: clone.strainType, floweringTime: clone.floweringTime }
    isClone = true
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { cloneBank: { strainSlug: cloneStrainSlug } },
    })
  } else if (customStrain) {
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
  const initialWarnings: Array<{ attribute: string; message: string; guide: string; code: string; triggerValue: number; severity: 'warning' | 'critical'; triggeredAt: Date; resolvedAt: null }> = []
  for (const [key, attr] of Object.entries(initialAttributes) as [keyof GrowAttributes, (typeof initialAttributes)[keyof GrowAttributes]][]) {
    if (attr.status === 'optimal') continue
    const guide = generateGuide(key, attr.status, attr.value, fullSetup, 'seedling')
    initialWarnings.push({
      attribute:    key,
      message:      guide.split('\n')[0] ?? `${key} out of range`,
      guide,
      code:         getWarningCode(key, attr.status, attr.value, fullSetup, 'seedling'),
      triggerValue: attr.value,
      severity:     attr.status,
      triggeredAt:  new Date(),
      resolvedAt:   null,
    })
  }

  const grow = await VirtualGrow.create({
    userId:        session.user.id,
    strainSlug:    strainData.slug,
    strainName:    strainData.name,
    strainType:    strainData.type,
    floweringTime: strainData.floweringTime || 63,
    isClone,
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
    creditsSpent:  0,
    lastAdvanced:  new Date(Date.now() - dayDurationSeconds * 1000), // allow exactly 1 day on first load
  })

  await awardXP(session.user.id, 'GROW_STARTED')

  return NextResponse.json({ grow }, { status: 201 })
}
