import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

// Load env manually since this is a script
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
}

const VALID_CATEGORIES = [
  'light_led', 'light_hps', 'light_cmh', 'light_cfl', 'light_t5',
  'exhaust_fan', 'circulation_fan', 'carbon_filter',
  'medium_soil', 'medium_coco', 'medium_hydro',
  'fabric_pot', 'plastic_pot', 'airpot',
  'watering_blumat', 'watering_drip', 'watering_manual',
  'nutrients_organic', 'nutrients_mineral',
  'ph_meter', 'ec_meter',
  'thermohygrometer', 'timer',
  'lst_tools', 'other',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·•]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function main() {
  const mongoUrl = process.env.MONGODB_URL
  if (!mongoUrl) {
    console.error('❌  MONGODB_URL not set in .env.local')
    process.exit(1)
  }

  const dataPath = path.join(process.cwd(), 'data', 'grow-equipment.json')
  if (!fs.existsSync(dataPath)) {
    console.error('❌  data/grow-equipment.json not found')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const products: Record<string, unknown>[] = raw.products

  console.log(`\n📦  Loaded ${products.length} products from grow-equipment.json`)

  await mongoose.connect(mongoUrl)
  console.log('✅  Connected to MongoDB\n')

  // Define inline schema to avoid import issues in tsx
  const GrowEquipmentSchema = new mongoose.Schema({
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand:           { type: String, default: '' },
    description:     { type: String, required: true },
    specs:           { type: mongoose.Schema.Types.Mixed, default: {} },
    imageUrl:        { type: String, default: '' },
    images:          [{ type: String }],
    prices: {
      czk:           { type: Number, required: true, min: 0 },
      usd:           { type: Number, default: null },
      eur:           { type: Number, default: null },
    },
    category:        { type: String, enum: VALID_CATEGORIES, required: true },
    lightType:       { type: String, default: null },
    compatibleMedia: [{ type: String }],
    sourceUrl:       { type: String, default: '' },
    isGenerated:     { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
  }, { timestamps: true })

  const GrowEquipment = mongoose.models.GrowEquipment ||
    mongoose.model('GrowEquipment', GrowEquipmentSchema)

  // Clear existing collection
  const deleted = await GrowEquipment.deleteMany({})
  console.log(`🗑️   Cleared ${deleted.deletedCount} existing documents`)

  // Resolve slug conflicts by appending a counter
  const usedSlugs = new Set<string>()

  const docs = products.map((p) => {
    const baseSlug = slugify(String(p.name))
    let slug = baseSlug
    let counter = 2
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`
    }
    usedSlugs.add(slug)

    const prices = p.prices as { czk?: number; usd?: number; eur?: number }
    if (!prices?.czk) {
      console.warn(`  ⚠️  Missing CZK price for "${p.name}", defaulting to 0`)
    }

    return {
      name:            p.name,
      slug,
      brand:           p.brand ?? '',
      description:     p.description,
      specs:           p.specs ?? {},
      imageUrl:        p.imageUrl ?? '',
      images:          (p.images as string[]) ?? [],
      prices: {
        czk:           prices?.czk ?? 0,
        usd:           prices?.usd ?? null,
        eur:           prices?.eur ?? null,
      },
      category:        p.category,
      lightType:       (p.lightType as string) ?? null,
      compatibleMedia: (p.compatibleMedia as string[]) ?? [],
      sourceUrl:       p.sourceUrl ?? '',
      isGenerated:     Boolean(p.isGenerated),
      isActive:        true,
    }
  })

  // Insert in batches of 20
  let inserted = 0
  const batchSize = 20
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize)
    await GrowEquipment.insertMany(batch)
    inserted += batch.length
    process.stdout.write(`  ✓  ${inserted}/${docs.length} inserted\r`)
  }

  console.log(`\n\n✅  Seeded ${inserted} products`)

  // Summary by category
  const categoryCounts: Record<string, number> = {}
  for (const doc of docs) {
    const cat = String(doc.category)
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }

  const totalGenerated = docs.filter(d => d.isGenerated).length
  const totalReal = docs.length - totalGenerated

  console.log('\n📊  Category breakdown:')
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(`    ${cat.padEnd(22)} ${count}`)
  }

  console.log(`\n📈  Summary:`)
  console.log(`    Total products:    ${docs.length}`)
  console.log(`    Real (scraped):    ${totalReal}`)
  console.log(`    Generated/placeholder: ${totalGenerated}`)
  console.log(`\nSeeded ${docs.length} products across ${Object.keys(categoryCounts).length} categories`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
