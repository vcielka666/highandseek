import mongoose from 'mongoose'
import { connectDB } from '../lib/db/connect'
import Product from '../lib/db/models/Product'

const JACKHERER_IMG = '/strains/jackherer.png'
const CHERRYGASM_IMG = '/strains/cherrygasm.jpeg'
const FLOWER_IMG = '/strains/ODB.png'

const products = [
  // ── GENETICS (seeds) ──────────────────────────────────────────────
  {
    name: 'O.D.B (Old Dirty Biker)',
    slug: 'odb',
    category: 'seed',
    strain: {
      type: 'hybrid',
      genetics: 'UK Exodus Cheese × Biker Kush',
      origin: 'european',
      floweringTime: 66,
      yield: 'high',
      difficulty: 'easy',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'The ODB aka Cheesy Rider was created by popular demand from our customers. We took a legendary Cheese cut and crossed it with our go-to stud, the Biker Kush V1 to create this indica-dominant hybrid cannabis strain.\n\nGrows vigorously with a branchy structure similar to skunk strains. The OG in the genetics helps ODB produce tight, dense buds with a lot of trichome coverage.\n\nThis is a particularly pungent strain, a cheesy hybrid with all the power of OG — this is one for the cheese freaks!',
    shortDescription: 'aka Cheesy Rider. UK Exodus Cheese × Biker Kush — pungent, dense, OG-powered.',
    price: 80,
    stock: 25,
    images: [JACKHERER_IMG],
    tags: ['european', 'cheese', 'hybrid', 'feminized', 'high-yield', 'pungent'],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Jack Herer',
    slug: 'jack-herer',
    category: 'seed',
    strain: {
      type: 'hybrid',
      genetics: 'Haze × (Northern Lights #5 × Shiva Skunk)',
      origin: 'european',
      floweringTime: 77,
      yield: 'high',
      difficulty: 'medium',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Jack Herer® is a perfectly balanced 50/50 hybrid — officially recognised as one of the few medicinal cannabis strains in the Netherlands. Try it once and you\'ll probably never want to smoke anything else. The effect is long-lasting and felt in both the mind and the body: a high-energy cerebral high underlaid by a breathtaking body buzz.\n\nThe majority of phenotypes show distinct sativa growth behaviour coupled with indica resin production. Buds are among the biggest you\'ll ever see — calyxes stack at multiple points, forming enormous structures. Carefully cultivated buds glisten with a thick layer of THC-rich trichomes so dense that under a microscope, the bud appears composed more of resin glands than plant tissue.\n\nReady to harvest in 10–12 weeks. Develops a complex aroma once dried: sharp, savoury hashish tones blended with Afghan and fruity skunk notes. A multiple harvest festival winner worldwide.',
    shortDescription: 'Balanced hybrid. Medicinal recognition, massive trichomes, hashish & skunk aroma.',
    price: 42,
    stock: 30,
    images: [JACKHERER_IMG],
    tags: ['european', 'hybrid', 'cup-winner', 'feminized', 'high-yield', 'medicinal'],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Cherrygasm',
    slug: 'cherrygasm',
    category: 'seed',
    strain: {
      type: 'indica',
      genetics: 'Cherry Pie × OG Kush',
      origin: 'usa',
      floweringTime: 58,
      yield: 'high',
      difficulty: 'easy',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Cherrygasm lives up to the name — dense, frosted colas with a deep cherry and dark berry terpene profile that hits you before you even open the jar. A Cherry Pie × OG Kush cross that inherited the best of both worlds: the OG\'s structural compactness and resin output, the Cherry Pie\'s unmistakable sweet-sour fruit punch. Short 58-day flower time, beginner-tolerant, and a standout performer in coco or light soil mix. Expect vivid purple hues on cool nights and an extremely sticky trim.',
    shortDescription: 'Cherry & dark berry bombs. Dense OG structure, 58-day finish.',
    price: 52,
    stock: 18,
    images: [CHERRYGASM_IMG],
    tags: ['usa-genetics', 'cherry', 'purple', 'fast-finish', 'feminized'],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Dosidos',
    slug: 'dosidos',
    category: 'seed',
    strain: {
      type: 'indica',
      genetics: 'Girl Scout Cookies × Face Off OG',
      origin: 'usa',
      floweringTime: 63,
      yield: 'medium',
      difficulty: 'medium',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Dosidos is a powerhouse GSC cross that punches well above its weight class. Earthy, floral, and pungent — the terpene profile is complex and unmistakable. Dense buds covered in a thick trichome layer that makes harvest a satisfying mess. Responds well to topping and LST. Not the easiest strain for beginners but the yield quality and bag appeal make the extra attention worthwhile.',
    shortDescription: 'GSC × Face Off OG. Earthy & floral, trichome-heavy, worth the effort.',
    price: 50,
    stock: 20,
    images: [JACKHERER_IMG],
    tags: ['usa-genetics', 'gsc', 'indica', 'feminized'],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Milky Dreams',
    slug: 'milky-dreams',
    category: 'seed',
    strain: {
      type: 'hybrid',
      genetics: 'Cookies & Cream × Wedding Cake',
      origin: 'usa',
      floweringTime: 62,
      yield: 'high',
      difficulty: 'easy',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Milky Dreams is the ultimate dessert strain — creamy vanilla, sweet dough, and a subtle floral finish. A Cookies & Cream × Wedding Cake cross that stacks colas like a pro and fills the room with an unmistakably sweet fragrance in the final two weeks. Forgiving structure, high trichome output, and a fast-finishing profile that makes it one of the most complete commercial cultivars in the lineup.',
    shortDescription: 'Vanilla & sweet dough terps. Stacking colas, beginner-friendly hybrid.',
    price: 46,
    stock: 35,
    images: [JACKHERER_IMG],
    tags: ['usa-genetics', 'dessert-terps', 'hybrid', 'feminized', 'high-yield'],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Tarte Tarin',
    slug: 'tarte-tarin',
    category: 'seed',
    strain: {
      type: 'hybrid',
      genetics: 'Caramel × Tropicana Cookies',
      origin: 'european',
      floweringTime: 65,
      yield: 'medium',
      difficulty: 'medium',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Inspired by the French upside-down pastry, Tarte Tarin is a European-bred hybrid with a caramelised fruit and citrus terpene profile that stands apart from the typical USA dessert strains. Caramel sweetness layered over tropical citrus, with a warm amber finish. Medium-sized colas with excellent resin coverage. A refined choice for growers who want something unique on their shelf.',
    shortDescription: 'Caramel & tropical citrus. European hybrid with refined, warm terps.',
    price: 44,
    stock: 22,
    images: [JACKHERER_IMG],
    tags: ['european', 'hybrid', 'caramel', 'feminized'],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Velvet Moon',
    slug: 'velvet-moon',
    category: 'seed',
    strain: {
      type: 'indica',
      genetics: 'Purple Punch × Black Cherry Pie',
      origin: 'usa',
      floweringTime: 56,
      yield: 'medium',
      difficulty: 'easy',
      seedType: 'feminized',
      climate: 'indoor',
    },
    description: 'Velvet Moon is a deep purple indica with a terpene profile built around dark grape, black cherry, and a smooth earthy finish. Purple Punch × Black Cherry Pie — two of the best purple producers in USA genetics — combined into a fast-finishing, visually stunning cultivar. The colour expression under cooler temperatures is remarkable. One of the best strains in the lineup for aesthetic and aroma combined.',
    shortDescription: 'Dark grape & cherry. Stunning purple expression, 56-day fast finish.',
    price: 54,
    stock: 15,
    images: [JACKHERER_IMG],
    tags: ['usa-genetics', 'purple', 'indica', 'feminized', 'fast-finish'],
    isAvailable: true,
    isFeatured: true,
  },

  // ── FLOWERS ──────────────────────────────────────────────────────
  {
    name: 'O.D.B (Old Dirty Biker)',
    slug: 'odb-flower',
    category: 'flower',
    strain: {
      type: 'hybrid',
      genetics: 'UK Exodus Cheese × Biker Kush',
      origin: 'european',
      floweringTime: null,
      yield: null,
      difficulty: null,
      seedType: null,
      climate: 'indoor',
    },
    description: 'The ODB aka Cheesy Rider was created by popular demand from our customers. We took a legendary Cheese cut and crossed it with our go-to stud, the Biker Kush V1 to create this indica-dominant hybrid cannabis strain.\n\nGrows vigorously with a branchy structure similar to skunk strains. The OG in the genetics helps ODB produce tight, dense buds with a lot of trichome coverage.\n\nThis is a particularly pungent strain, a cheesy hybrid with all the power of OG — this is one for the cheese freaks!',
    shortDescription: 'aka Cheesy Rider. UK Exodus Cheese × Biker Kush — pungent, dense, OG-powered.',
    price: 16,
    stock: 40,
    images: [FLOWER_IMG],
    tags: ['cbd', 'flower', 'indoor', 'hemp', 'cheese', 'european'],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Jack Herer',
    slug: 'jack-herer-flower',
    category: 'flower',
    strain: {
      type: 'hybrid',
      genetics: 'Haze × (Northern Lights #5 × Shiva Skunk)',
      origin: 'european',
      floweringTime: null,
      yield: null,
      difficulty: null,
      seedType: null,
      climate: 'indoor',
    },
    description: 'Jack Herer® is a perfectly balanced hybrid — officially recognised as one of the few medicinal cannabis strains in the Netherlands. Try it once and you\'ll probably never want to smoke anything else. The effect is long-lasting and felt in both the mind and body: a high-energy cerebral high underlaid by a breathtaking body buzz.\n\nBuds are among the biggest you\'ll encounter — enormous trichome-covered structures that glisten with resin. So dense with resin glands that under a microscope, the bud appears composed more of trichomes than plant tissue. Diamond-dusted appearance maintained in the dried flower.\n\nComplex aroma once dried: sharp, savoury hashish tones blended with Afghan and fruity skunk notes. A multiple harvest festival winner worldwide — the benchmark for balanced hybrid genetics.',
    shortDescription: 'Balanced hybrid. Medicinal recognition, trichome-drenched, sharp hashish & skunk aroma.',
    price: 14,
    stock: 50,
    images: [FLOWER_IMG],
    tags: ['cbd', 'flower', 'indoor', 'hemp', 'hybrid', 'medicinal', 'jack-herer'],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Bubba Slush',
    slug: 'bubba-slush-flower',
    category: 'flower',
    strain: {
      type: 'indica',
      genetics: 'Bubba Kush × Blue Slush',
      origin: 'usa',
      floweringTime: null,
      yield: null,
      difficulty: null,
      seedType: null,
      climate: 'indoor',
    },
    description: 'Bubba Slush CBD flower is the most visually striking in the lineup — frosted light-green buds with hints of blue and a terpene profile that combines the classic Bubba Kush earthiness with a cool berry finish from the Blue Slush parentage. Indoor grown, slow-dried, hand-trimmed. Low THC (<0.2%), high CBD. Sold per 3.5g. Certificate of analysis available.',
    shortDescription: 'Frosted indoor CBD flower. Earthy Bubba × cool berry finish, <0.2% THC.',
    price: 18,
    stock: 30,
    images: [FLOWER_IMG],
    tags: ['cbd', 'flower', 'indoor', 'hemp', 'lab-tested', 'bubba-kush'],
    isAvailable: true,
    isFeatured: false,
  },

  // ── MERCH ─────────────────────────────────────────────────────────
  {
    name: 'H&S Logo Tee',
    slug: 'hs-logo-tee',
    category: 'merch',
    strain: {
      type: null,
      genetics: '',
      origin: null,
      floweringTime: null,
      yield: null,
      difficulty: null,
      seedType: null,
      climate: null,
    },
    description: 'Heavy 300gsm organic cotton tee. Screen-printed with the H&S cannabis leaf mark in teal on a washed black base. Relaxed unisex cut, pre-shrunk. Printed and shipped from within the EU. Sizes: S / M / L / XL / XXL.',
    shortDescription: 'Washed black organic cotton, teal H&S leaf mark, 300gsm.',
    price: 34,
    stock: 100,
    images: [],
    tags: ['merch', 'organic', 'unisex', 'eu-shipping'],
    isAvailable: true,
    isFeatured: false,
  },
]

async function seed() {
  console.log('Connecting to MongoDB...')
  await connectDB()

  console.log('Clearing existing products...')
  await Product.deleteMany({})

  console.log(`Seeding ${products.length} products...`)
  const created = await Product.insertMany(products)

  console.log(`✓ Seeded ${created.length} products:`)
  created.forEach((p) => console.log(`  - ${p.name} (${p.slug}) €${p.price}`))

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
