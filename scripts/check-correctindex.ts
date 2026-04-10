import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const { connectDB } = await import('../lib/db/connect')
  const mongoose = await import('mongoose')
  await connectDB()

  const result = await mongoose.default.connection.db!
    .collection('academyquestions')
    .aggregate([
      { $group: { _id: '$correctIndex', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray()

  console.log('\nCurrent correctIndex distribution:')
  console.log(JSON.stringify(result, null, 2))

  const total = result.reduce((s, r) => s + r.count, 0)
  console.log(`\nTotal questions: ${total}`)
  for (const r of result) {
    console.log(`  index ${r._id}: ${r.count} (${Math.round(r.count / total * 100)}%)`)
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
