// Patches existing AcademyTopic docs with English titles/descriptions.
// Run this instead of the full seed when questions are already in the DB.
import { config } from 'dotenv'
config({ path: '.env.local' })

const TOPICS = [
  {
    slug:          'zaklady-pestovania',
    titleEn:       '🌱 Growing Basics',
    descriptionEn: 'Core principles of cannabis cultivation — medium, water, light, nutrients and the plant life cycle.',
  },
  {
    slug:          'voda-zivy-medium',
    titleEn:       '💧 Water, Nutrients & Medium',
    descriptionEn: 'Deep dive into watering systems, nutrient solutions, pH management and growing medium types.',
  },
  {
    slug:          'svetlo-prostredie',
    titleEn:       '💡 Light & Environment',
    descriptionEn: 'Light spectrum, PPFD, DLI, VPD, temperature, humidity and ventilation for optimal growth.',
  },
  {
    slug:          'techniky-pestovania',
    titleEn:       '✂️ Growing Techniques',
    descriptionEn: 'LST, topping, FIM, SCROG, defoliation, super cropping and other advanced plant training techniques.',
  },
  {
    slug:          'genetika-breeding',
    titleEn:       '🧬 Genetics & Breeding',
    descriptionEn: 'Strain genetics, phenotypes, breeding, stabilization, terpenes, cannabinoids and parent selection.',
  },
]

async function main() {
  const { connectDB } = await import('../lib/db/connect')
  const { default: AcademyTopic } = await import('../lib/db/models/AcademyTopic')

  await connectDB()
  console.log('Patching academy topic EN fields...\n')

  for (const t of TOPICS) {
    const result = await AcademyTopic.findOneAndUpdate(
      { slug: t.slug },
      { $set: { titleEn: t.titleEn, descriptionEn: t.descriptionEn } },
      { new: true },
    )
    if (result) {
      console.log(`✓ ${t.slug}`)
    } else {
      console.log(`✗ ${t.slug} — not found (run seed-academy.ts first)`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
