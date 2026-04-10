/**
 * Restores prices for seeded products that were wrongly divided by 100.
 * Products with price < 1 are seeded products that had their price broken.
 * Usage: pnpm tsx scripts/restore-seeded-prices.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URL = process.env.MONGODB_URL
if (!MONGODB_URL) { console.error('MONGODB_URL not set'); process.exit(1) }

async function main() {
  await mongoose.connect(MONGODB_URL!)
  const Schema = new mongoose.Schema({}, { strict: false })
  const Product = mongoose.models.Product || mongoose.model('Product', Schema)

  const products = await Product.find({ price: { $lt: 1 } })
  console.log(`Found ${products.length} products to restore`)

  for (const p of products) {
    const restored = Math.round(p.price * 100 * 100) / 100
    await Product.updateOne({ _id: p._id }, { $set: { price: restored } })
    console.log(`  ${p.name}: ${p.price} → ${restored} Kč`)
  }

  console.log('Done')
  await mongoose.disconnect()
}

main().catch((err) => { console.error(err); process.exit(1) })
