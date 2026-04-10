import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const { connectDB } = await import('../lib/db/connect')
  const { default: AcademyQuestion } = await import('../lib/db/models/AcademyQuestion')
  await connectDB()
  const total = await AcademyQuestion.countDocuments({})
  console.log('Total questions in DB:', total)
  const sample = await AcademyQuestion.findOne({}).lean()
  console.log('Sample doc fields:', sample ? Object.keys(sample) : 'none')
  if (sample) console.log('Sample language field:', (sample as Record<string, unknown>).language)
  const byLang = await AcademyQuestion.aggregate([
    { $group: { _id: '$language', count: { $sum: 1 } } },
  ])
  console.log('By language:', byLang)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
