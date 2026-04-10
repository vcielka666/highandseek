// Load env FIRST — must happen before any DB module is imported
import { config } from 'dotenv'
config({ path: '.env.local' })

// DB modules as dynamic imports inside main() so MONGODB_URL is set before they load
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const TOPICS = [
  {
    slug:          'zaklady-pestovania',
    title:         '🌱 Základy pěstování',
    description:   'Základní principy pěstování konopí — médium, voda, světlo, živiny a životní cyklus rostliny.',
    titleEn:       '🌱 Growing Basics',
    descriptionEn: 'Core principles of cannabis cultivation — medium, water, light, nutrients and the plant life cycle.',
    icon:          '🌱',
    difficulty:    'beginner' as const,
    order:         1,
    contextCs:     'Základy pěstování konopí: životní cyklus (klíčení, semenáč, vegetace, kvetení, sklizeň), výběr média (zemina, coco, hydroponika), základy zálivky, pH, EC, základní živiny (NPK), světelné cykly (18/6 veg, 12/12 flower).',
    contextEn:     'Cannabis cultivation basics: life cycle (germination, seedling, vegetation, flowering, harvest), medium selection (soil, coco, hydroponics), watering fundamentals, pH, EC, basic nutrients (NPK), light cycles (18/6 veg, 12/12 flower).',
  },
  {
    slug:          'voda-zivy-medium',
    title:         '💧 Voda, živiny & médium',
    description:   'Hloubkový pohled na zálivkové systémy, živinové roztoky, pH management a typy pěstebních médií.',
    titleEn:       '💧 Water, Nutrients & Medium',
    descriptionEn: 'Deep dive into watering systems, nutrient solutions, pH management and growing medium types.',
    icon:          '💧',
    difficulty:    'intermediate' as const,
    order:         2,
    contextCs:     'Zálivkové systémy (ruční, kapkový, Blumat, DWC, NFT), pH (5.5–6.5 hydro, 6.0–7.0 zemina), EC management, NPK poměry v různých fázích, living soil mikrobiologie, kompostové čaje, coco coir specifika, minerální vs organické živiny.',
    contextEn:     'Watering systems (hand, drip, Blumat, DWC, NFT), pH ranges (5.5–6.5 hydro, 6.0–7.0 soil), EC management, NPK ratios per growth stage, living soil microbiology, compost teas, coco coir specifics, mineral vs organic nutrients.',
  },
  {
    slug:          'svetlo-prostredie',
    title:         '💡 Světlo & prostředí',
    description:   'Světelné spektrum, PPFD, DLI, VPD, teplota, vlhkost a ventilace pro optimální růst.',
    titleEn:       '💡 Light & Environment',
    descriptionEn: 'Light spectrum, PPFD, DLI, VPD, temperature, humidity and ventilation for optimal growth.',
    icon:          '💡',
    difficulty:    'intermediate' as const,
    order:         3,
    contextCs:     'Typy světel (HPS, LED, CMH/LEC, fluorescenty), světelné spektrum (modrá 400-500nm veg, červená 600-700nm flower), PPFD a DLI výpočty, VPD (Vapor Pressure Deficit), teplota (18–28°C), relativní vlhkost dle fáze, CO2 suplementace, ventilace a cirkulace vzduchu.',
    contextEn:     'Light types (HPS, LED, CMH/LEC, fluorescents), light spectrum (blue 400-500nm veg, red 600-700nm flower), PPFD and DLI calculations, VPD (Vapor Pressure Deficit), temperature ranges (18–28°C), relative humidity per stage, CO2 supplementation, ventilation and air circulation.',
  },
  {
    slug:          'techniky-pestovania',
    title:         '✂️ Techniky pěstování',
    description:   'LST, topping, FIM, SCROG, ScrOG, defoliace, super cropping a další advanced techniky tvarování rostliny.',
    titleEn:       '✂️ Growing Techniques',
    descriptionEn: 'LST, topping, FIM, SCROG, defoliation, super cropping and other advanced plant training techniques.',
    icon:          '✂️',
    difficulty:    'advanced' as const,
    order:         4,
    contextCs:     'Low Stress Training (LST), High Stress Training (topping, FIM, super cropping), SCROG (Screen of Green), SoG (Sea of Green), lollipopping, defoliace (timing a technika), manifolding, mainlining, schwazzing, revegetace, autoflowering vs photoperiod management.',
    contextEn:     'Low Stress Training (LST), High Stress Training (topping, FIM, super cropping), SCROG (Screen of Green), SoG (Sea of Green), lollipopping, defoliation (timing and technique), manifolding, mainlining, schwazzing, re-vegetation, autoflowering vs photoperiod management.',
  },
  {
    slug:          'genetika-breeding',
    title:         '🧬 Genetika & breeding',
    description:   'Kmenová genetika, fenotypy, křížení, stabilizace, terpény, kanabinoidy a výběr plemenných rodičů.',
    titleEn:       '🧬 Genetics & Breeding',
    descriptionEn: 'Strain genetics, phenotypes, breeding, stabilization, terpenes, cannabinoids and parent selection.',
    icon:          '🧬',
    difficulty:    'advanced' as const,
    order:         5,
    contextCs:   'Sativa vs Indica vs Ruderalis genetika, fenotypy a genotypy, hybridizace (F1, F2, backcross, IBL), stabilizace linie, kanabinoidy (THC, CBD, CBG, CBN, THCV), terpény (myrcen, limonen, linalool, beta-karyofylen, pinen), trichomy (čiré, zakalené, jantarové), výběr plemenných rodičů, seed bank vs clone only.',
    contextEn:   'Sativa vs Indica vs Ruderalis genetics, phenotypes and genotypes, hybridization (F1, F2, backcross, IBL), line stabilization, cannabinoids (THC, CBD, CBG, CBN, THCV), terpenes (myrcene, limonene, linalool, beta-caryophyllene, pinene), trichomes (clear, cloudy, amber), selecting breeding parents, seed bank vs clone only.',
  },
]

interface QuestionData {
  phase: 1 | 2 | 3
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  isTimed: boolean
  timeLimit: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface BatchSpec {
  phase: 1 | 2 | 3
  count: number
  options: number
  difficulty: 'easy' | 'medium' | 'hard'
  timed: boolean
}

const BATCHES: BatchSpec[] = [
  { phase: 1, count: 10, options: 4, difficulty: 'easy',   timed: false },
  { phase: 1, count: 10, options: 4, difficulty: 'easy',   timed: false },
  { phase: 2, count: 10, options: 5, difficulty: 'medium', timed: false },
  { phase: 2, count: 10, options: 5, difficulty: 'medium', timed: false },
  { phase: 3, count: 10, options: 6, difficulty: 'hard',   timed: true  },
  { phase: 3, count: 10, options: 6, difficulty: 'hard',   timed: true  },
]

async function generateBatch(
  topic: typeof TOPICS[0],
  lang: 'cs' | 'en',
  batch: BatchSpec,
): Promise<QuestionData[]> {
  const isCs = lang === 'cs'
  const context = isCs ? topic.contextCs : topic.contextEn
  const exampleOptions = Array.from({ length: batch.options }, (_, i) => `"Option ${i + 1}"`).join(', ')

  const prompt = isCs
    ? `Vygeneruj ${batch.count} kvízových otázek (fáze ${batch.phase}) pro téma: "${topic.title}"

Kontext: ${context}

Požadavky:
- Přesně ${batch.count} otázek
- Každá otázka má ${batch.options} možností odpovědí
- Obtížnost: "${batch.difficulty}"
- isTimed: ${batch.timed}, timeLimit: 20
- Stručné vysvětlení (1–2 věty) po zodpovězení
- VŽDY v ČEŠTINĚ (ne slovensky!)
- correctIndex je 0-based index správné odpovědi

Vrať POUZE JSON array, žádný markdown:
[{"phase":${batch.phase},"question":"...","options":[${exampleOptions}],"correctIndex":0,"explanation":"...","isTimed":${batch.timed},"timeLimit":20,"difficulty":"${batch.difficulty}"}]`
    : `Generate ${batch.count} quiz questions (phase ${batch.phase}) for topic: "${topic.title}"

Context: ${context}

Requirements:
- Exactly ${batch.count} questions
- Each question has ${batch.options} answer options
- Difficulty: "${batch.difficulty}"
- isTimed: ${batch.timed}, timeLimit: 20
- Brief explanation (1–2 sentences) shown after answering
- ALL in English
- correctIndex is the 0-based index of the correct answer

Return ONLY a JSON array, no markdown:
[{"phase":${batch.phase},"question":"...","options":[${exampleOptions}],"correctIndex":0,"explanation":"...","isTimed":${batch.timed},"timeLimit":20,"difficulty":"${batch.difficulty}"}]`

  const system = isCs
    ? 'Jsi expert na pěstování konopí. Vracíš POUZE validní JSON array bez markdown.'
    : 'You are a cannabis cultivation expert. Return ONLY a valid JSON array, no markdown.'

  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip markdown fences and any text before the first '[' or after the last ']'
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start === -1 || end === -1) {
      console.log(`    ⚠ Attempt ${attempt}: no JSON array found, retrying...`)
      await new Promise(r => setTimeout(r, 1000))
      continue
    }
    const extracted = text.slice(start, end + 1)
    try {
      return JSON.parse(extracted) as QuestionData[]
    } catch (e) {
      console.log(`    ⚠ Attempt ${attempt}: JSON parse failed, retrying...`)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error(`Failed to get valid JSON after 3 attempts (phase ${batch.phase}, ${lang})`)
}

async function generateQuestions(topic: typeof TOPICS[0], lang: 'cs' | 'en'): Promise<QuestionData[]> {
  console.log(`  Generating ${lang.toUpperCase()} questions for: ${topic.title}`)
  const all: QuestionData[] = []
  for (const batch of BATCHES) {
    const questions = await generateBatch(topic, lang, batch)
    all.push(...questions)
    console.log(`    ✓ Phase ${batch.phase}: ${questions.length} questions`)
    await new Promise(r => setTimeout(r, 500))
  }
  console.log(`    ✓ Total ${lang.toUpperCase()}: ${all.length} questions`)
  return all
}

async function main() {
  // Dynamic imports ensure MONGODB_URL is loaded before connect.ts evaluates
  const { connectDB } = await import('../lib/db/connect')
  const { default: AcademyTopic } = await import('../lib/db/models/AcademyTopic')
  const { default: AcademyQuestion } = await import('../lib/db/models/AcademyQuestion')

  console.log('🌱 Seeding Grow Academy...\n')
  await connectDB()

  for (const topic of TOPICS) {
    console.log(`\n📚 Processing topic: ${topic.slug}`)

    // Upsert topic
    await AcademyTopic.findOneAndUpdate(
      { slug: topic.slug },
      {
        slug:          topic.slug,
        title:         topic.title,
        description:   topic.description,
        titleEn:       topic.titleEn,
        descriptionEn: topic.descriptionEn,
        icon:          topic.icon,
        difficulty:    topic.difficulty,
        order:         topic.order,
        xpAvailable:   450,
        isActive:      true,
      },
      { upsert: true, new: true },
    )
    console.log(`  ✓ Topic upserted`)

    // Delete existing questions for this topic (fresh seed)
    const deleted = await AcademyQuestion.deleteMany({ topicSlug: topic.slug })
    console.log(`  ✓ Cleared ${deleted.deletedCount} existing questions`)

    // Generate CS and EN questions
    const [csQuestions, enQuestions] = await Promise.all([
      generateQuestions(topic, 'cs'),
      generateQuestions(topic, 'en'),
    ])

    const toDocs = (questions: QuestionData[], lang: 'cs' | 'en') =>
      questions.map(q => ({
        topicSlug:    topic.slug,
        phase:        q.phase,
        question:     q.question,
        options:      q.options,
        correctIndex: q.correctIndex,
        explanation:  q.explanation,
        isTimed:      q.isTimed ?? (q.phase === 3),
        timeLimit:    q.timeLimit ?? 20,
        difficulty:   q.difficulty,
        language:     lang,
        isActive:     true,
      }))

    const allDocs = [...toDocs(csQuestions, 'cs'), ...toDocs(enQuestions, 'en')]
    await AcademyQuestion.insertMany(allDocs)

    // Update topic totalQuestions (per language, so ÷ 2)
    await AcademyTopic.findOneAndUpdate(
      { slug: topic.slug },
      { totalQuestions: csQuestions.length },
    )

    console.log(`  ✓ Saved ${allDocs.length} questions total (${csQuestions.length} CS + ${enQuestions.length} EN)`)
    console.log(`  Waiting 2 seconds before next topic...`)
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n✅ Academy seeding complete!')
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
