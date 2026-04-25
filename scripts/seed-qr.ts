import mongoose from 'mongoose'
import { QRRedirect } from '../lib/db/models/QRRedirect'

const DEFAULTS = [
  { slug: 'go',      targetUrl: 'https://highandseek.com',            label: 'Vizitka hlavná' },
  { slug: 'grow',    targetUrl: 'https://highandseek.com/hub/grow',    label: 'Grow Simulator' },
  { slug: 'strains', targetUrl: 'https://highandseek.com/hub/strains', label: 'Strain Universe' },
]

async function main() {
  const url = process.env.MONGODB_URL
  if (!url) throw new Error('MONGODB_URL not set')

  await mongoose.connect(url)
  console.log('Connected to MongoDB')

  for (const entry of DEFAULTS) {
    const exists = await QRRedirect.exists({ slug: entry.slug })
    if (exists) {
      console.log(`  skip: ${entry.slug} (already exists)`)
      continue
    }
    await QRRedirect.create(entry)
    console.log(`  created: ${entry.slug} → ${entry.targetUrl}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
