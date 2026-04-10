/**
 * One-time migration: products saved before the price bug fix had their price
 * multiplied by 100 on save (Math.round(price * 100)). This script divides
 * all product prices by 100 to restore the intended CZK value.
 *
 * Usage: pnpm tsx scripts/fix-product-prices.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URL = process.env.MONGODB_URL
if (!MONGODB_URL) {
  console.error('MONGODB_URL not set in environment')
  process.exit(1)
}

async function main() {
  await mongoose.connect(MONGODB_URL!)

  const ProductSchema = new mongoose.Schema({}, { strict: false })
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

  const products = await Product.find({})
  console.log(`Found ${products.length} products`)

  let updated = 0
  for (const p of products) {
    const oldPrice = p.price
    const newPrice = Math.round((oldPrice / 100) * 100) / 100  // divide by 100, keep 2dp
    await Product.updateOne({ _id: p._id }, { $set: { price: newPrice } })
    console.log(`  ${p.name}: ${oldPrice} → ${newPrice} Kč`)
    updated++
  }

  console.log(`\n✓ Updated ${updated} products. Re-enter CZK prices in admin as needed.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
