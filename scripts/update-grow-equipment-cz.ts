/**
 * Merges Czech shop scrape data into grow-equipment.json.
 * Updates isGenerated products with real CZK prices and images,
 * then appends new CZ-sourced products.
 *
 * Run: pnpm tsx scripts/update-grow-equipment-cz.ts
 */

import fs from 'fs'
import path from 'path'

interface Prices {
  czk: number
  usd: number | null
  eur: number | null
}

interface Product {
  name: string
  slug?: string
  brand: string
  description: string
  specs: Record<string, unknown>
  imageUrl: string
  images: string[]
  prices: Prices
  category: string
  lightType?: string | null
  compatibleMedia: string[]
  sourceUrl: string
  isGenerated: boolean
}

interface CzProduct {
  name: string
  brand: string
  prices: { czk: number; usd: number; eur: number }
  imageUrl: string
  category: string
  sourceUrl: string
  specs: Record<string, unknown>
  lightType?: string
  compatibleMedia?: string[]
}

interface CzData {
  products: CzProduct[]
  priceUpdatesForExisting: Record<string, {
    czk?: number
    imageUrl?: string
    sourceUrl?: string
  }>
}

interface GrowEquipmentData {
  scrapedAt: string
  totalProducts: number
  failedUrls: string[]
  products: Product[]
}

const ROOT = process.cwd()
const mainPath = path.join(ROOT, 'data', 'grow-equipment.json')
const czPath   = path.join(ROOT, 'data', 'grow-equipment-cz.json')

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·•µ]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function recalcPrices(czk: number): Prices {
  return {
    czk: Math.round(czk),
    usd: Math.round((czk / 23) * 100) / 100,
    eur: Math.round((czk / 25) * 100) / 100,
  }
}

/** Best-effort compatible media based on category */
function defaultMedia(category: string): string[] {
  if (category.startsWith('nutrients_mineral')) return ['coco', 'hydro']
  if (category === 'nutrients_organic') return ['soil']
  if (category === 'medium_soil') return ['soil']
  if (category === 'medium_coco') return ['coco']
  if (category === 'medium_hydro') return ['hydro']
  if (category === 'watering_blumat') return ['soil', 'coco']
  if (category === 'watering_drip') return ['coco', 'soil']
  if (category.startsWith('fabric_') || category === 'airpot' || category === 'plastic_pot') return ['soil', 'coco']
  return ['soil', 'coco', 'hydro']
}

function lightTypeFromCategory(category: string, specs: Record<string, unknown>): string | null {
  if (category === 'light_led') return 'led'
  if (category === 'light_hps') return 'hps'
  if (category === 'light_cmh') return 'cmh'
  if (category === 'light_cfl') return 'cfl'
  if (category === 'light_t5') return 't5'
  if (specs.lampType) {
    const lt = String(specs.lampType).toLowerCase()
    if (lt.includes('hps')) return 'hps'
    if (lt.includes('cmh') || lt.includes('lec')) return 'cmh'
  }
  return null
}

function generateDescription(p: CzProduct): string {
  const cat = p.category
  const brand = p.brand
  const name = p.name
  if (cat.startsWith('light_led')) {
    const w = p.specs?.watts ? `${p.specs.watts}W ` : ''
    const eff = p.specs?.efficiency ? `, efficiency ${p.specs.efficiency}` : ''
    return `The ${name} is a ${w}LED grow light from ${brand} designed for indoor cannabis cultivation. It delivers full-spectrum light optimised for all growth stages from seedling to late flower${eff}. A popular choice in Czech grow shops for its performance-to-price ratio.`
  }
  if (cat === 'light_hps') {
    return `The ${name} is an HPS lamp from ${brand} for use in digital and magnetic ballast setups. It provides high-intensity light in the orange-red spectrum ideal for the flowering phase. A reliable and affordable lamp widely available through Czech grow shops.`
  }
  if (cat === 'light_cmh') {
    return `The ${name} is a ceramic metal halide (CMH/LEC) product from ${brand} providing a full-spectrum light closely replicating natural sunlight including UV. CMH is prized for enhancing terpene production and quality over standard HPS. Widely used in premium soil and living-soil grows across Central Europe.`
  }
  if (cat === 'exhaust_fan') {
    const d = p.specs?.diameter ? `${p.specs.diameter} ` : ''
    return `The ${name} is a ${d}inline duct fan from ${brand} designed for tent and room exhaust ventilation. It provides reliable airflow for maintaining negative pressure and temperature control in indoor gardens. Sold through major Czech grow shop distributors.`
  }
  if (cat === 'circulation_fan') {
    return `The ${name} is a clip fan from ${brand} providing gentle circulation airflow within grow tents. It mounts directly onto tent poles and strengthens plant stems while preventing hot spots in the canopy. A standard accessory found in every Czech grow shop.`
  }
  if (cat === 'carbon_filter') {
    return `The ${name} is a carbon odour filter from ${brand} for grow room exhaust systems. Packed with activated carbon, it completely neutralises grow room odours before air is expelled. Standard equipment in Czech indoor grows paired with a matching inline fan.`
  }
  if (cat === 'medium_soil') {
    const vol = p.specs?.volume ? ` (${p.specs.volume})` : ''
    return `${name}${vol} is a growing substrate from ${brand} suitable for indoor plant cultivation. Formulated for optimal drainage, aeration, and nutrient retention across all growth stages. One of the most popular soil products sold in Czech grow shops.`
  }
  if (cat === 'medium_coco') {
    const vol = p.specs?.volume ? ` (${p.specs.volume})` : ''
    return `${name}${vol} is a coco coir substrate from ${brand} providing excellent aeration and drainage for mineral or organic nutrient programmes. Pre-buffered to prevent early calcium and magnesium lockout. Widely available in Czech grow shops.`
  }
  if (cat === 'fabric_pot') {
    const vol = p.specs?.volumeLiters ? ` ${p.specs.volumeLiters}L` : ''
    return `The ${name} is a${vol} fabric pot from ${brand} promoting root air-pruning for a dense, fibrous root system. Breathable fabric prevents root circling and improves drainage compared to standard plastic pots. A common sight in Czech indoor growing setups.`
  }
  if (cat === 'ph_meter') {
    return `The ${name} is a pH measurement instrument from ${brand} for monitoring nutrient solution acidity. Essential for any feeding programme in soil, coco, or hydro to prevent nutrient lockout. Stocked in all major Czech grow shops.`
  }
  if (cat === 'ec_meter') {
    return `The ${name} is an EC/TDS conductivity meter from ${brand} for measuring nutrient solution strength. Ensures plants receive the correct feed concentration at every watering. A standard tool across Czech indoor grow operations.`
  }
  if (cat === 'thermohygrometer') {
    return `The ${name} is a temperature and humidity monitor from ${brand} for grow room environmental tracking. Keeping temperature and humidity within optimal ranges is essential for healthy growth and avoiding mould. Stocked in Czech grow shops as a basic grow room accessory.`
  }
  if (cat.startsWith('nutrients_')) {
    const vol = p.specs?.volume ? ` ${p.specs.volume}` : ''
    return `${name}${vol} is a plant nutrient from ${brand} formulated for indoor growing. It provides essential macro and micro elements to support healthy growth and flowering. Available from major Czech and European grow shop distributors.`
  }
  return `${name} is a grow room product from ${brand}. A quality product for indoor cultivation widely available in Czech grow shops.`
}

// ── Main ─────────────────────────────────────────────────────────────────────

const main = JSON.parse(fs.readFileSync(mainPath, 'utf-8')) as GrowEquipmentData
const cz   = JSON.parse(fs.readFileSync(czPath,   'utf-8')) as CzData

let updatedCount = 0
let notFoundCount = 0

// ── 1. Apply price/image updates to existing products ─────────────────────────
const updates = cz.priceUpdatesForExisting
for (const product of main.products) {
  const update = updates[product.name]
  if (!update) continue

  if (update.czk !== undefined) {
    const prices = recalcPrices(update.czk)
    product.prices = prices
  }
  if (update.imageUrl !== undefined && update.imageUrl !== '') {
    product.imageUrl = update.imageUrl
    if (!product.images.includes(update.imageUrl)) {
      product.images = [update.imageUrl, ...product.images.filter(Boolean)]
    }
  }
  if (update.sourceUrl !== undefined) {
    product.sourceUrl = update.sourceUrl
  }
  product.isGenerated = false
  updatedCount++
}

// Check which expected updates were not found
for (const name of Object.keys(updates)) {
  if (!main.products.find(p => p.name === name)) {
    console.warn(`  ⚠️  Update target not found: "${name}"`)
    notFoundCount++
  }
}

// ── 2. Build set of existing slugs for dedup ──────────────────────────────────
const existingSlugs = new Set(main.products.map(p => slugify(p.name)))
const existingNames = new Set(main.products.map(p => p.name.toLowerCase().trim()))

// ── 3. Add new CZ products ────────────────────────────────────────────────────
let addedCount = 0
const newProducts: Product[] = []

for (const czp of cz.products) {
  // Skip if same name already exists (case-insensitive)
  if (existingNames.has(czp.name.toLowerCase().trim())) {
    console.log(`  ⏭   Already exists: "${czp.name}"`)
    continue
  }

  const prices = recalcPrices(czp.prices.czk)
  const lightType = czp.lightType ?? lightTypeFromCategory(czp.category, czp.specs)
  const compatibleMedia = czp.compatibleMedia ?? defaultMedia(czp.category)
  const description = generateDescription(czp)

  const product: Product = {
    name:           czp.name,
    brand:          czp.brand,
    description,
    specs:          czp.specs ?? {},
    imageUrl:       czp.imageUrl ?? '',
    images:         czp.imageUrl ? [czp.imageUrl] : [],
    prices,
    category:       czp.category,
    lightType:      lightType ?? null,
    compatibleMedia,
    sourceUrl:      czp.sourceUrl,
    isGenerated:    false,
  }

  newProducts.push(product)
  existingNames.add(czp.name.toLowerCase().trim())
  addedCount++
}

main.products.push(...newProducts)
main.totalProducts = main.products.length
main.scrapedAt = new Date().toISOString()

// ── 4. Save updated JSON ──────────────────────────────────────────────────────
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2))

// ── 5. Print summary ──────────────────────────────────────────────────────────
const totalGenerated = main.products.filter(p => p.isGenerated).length
const totalReal = main.products.length - totalGenerated
const withImages = main.products.filter(p => p.imageUrl && p.imageUrl.startsWith('http')).length
const withCzk = main.products.filter(p => p.prices.czk > 0).length

console.log('\n✅  grow-equipment.json updated\n')
console.log(`   Updated existing:   ${updatedCount} products (isGenerated → false)`)
console.log(`   Update not found:   ${notFoundCount}`)
console.log(`   New products added: ${addedCount}`)
console.log(`\n📊  New totals:`)
console.log(`   Total products:     ${main.products.length}`)
console.log(`   Real/scraped:       ${totalReal}`)
console.log(`   Generated/est.:     ${totalGenerated}`)
console.log(`   With images:        ${withImages}`)
console.log(`   With CZK prices:    ${withCzk}`)
