import mongoose from 'mongoose'
import { connectDB } from '../lib/db/connect'
import Tour from '../lib/db/models/Tour'
import CannabisSpot from '../lib/db/models/CannabisSpot'

const TOUR = {
  title: 'Praha Cannabis Culture Walk',
  slug: 'praha-cannabis-culture-walk',
  city: 'Praha',
  country: 'CZ',
  host: {
    name: 'Jan Novák',
    avatar: '',
    bio: 'Local cannabis culture enthusiast and licensed tour guide. 8 years exploring Praha\'s underground green scene.',
    verified: true,
  },
  description: `Discover Praha's thriving cannabis culture on this immersive 3-hour walking tour through the city's most iconic neighbourhoods. Visit CBD shops, cannabis-friendly cafés, and cultural landmarks — all while learning about Czech cannabis history, regulation, and the local community scene.\n\nYour knowledgeable guide will share insider stories and introduce you to the people shaping Praha's unique relationship with cannabis. Small groups guaranteed (max 8 guests) for an intimate experience.`,
  shortDescription: 'A 3-hour guided walk through Praha\'s cannabis culture — clubs, shops, cafés and hidden gems.',
  duration: 180,
  maxGuests: 8,
  languages: ['EN', 'CS'],
  price: { eur: 35, czk: 850, credits: 500 },
  meetingPoint: {
    address: 'Náměstí Republiky, Praha 1',
    lat: 50.0875,
    lng: 14.4274,
    description: 'Meet at the base of the Municipal House (Obecní dům) steps. Look for your guide holding a green H&S flag.',
  },
  stops: [
    {
      order: 1,
      title: 'Náměstí Republiky — Starting Point',
      description: 'Introduction to Czech cannabis history and the modern regulatory landscape. Brief overview of the walk.',
      lat: 50.0875,
      lng: 14.4274,
      duration: 15,
      type: 'culture' as const,
    },
    {
      order: 2,
      title: 'Zelená Farma CBD Boutique',
      description: 'One of Praha\'s oldest and most respected CBD shops. Sample premium flowers and hear the owner\'s story.',
      lat: 50.0878,
      lng: 14.4209,
      duration: 25,
      type: 'shop' as const,
    },
    {
      order: 3,
      title: 'Hempoint Praha',
      description: 'Flagship hemp store with a curated selection of CBD products, seeds, and accessories.',
      lat: 50.0871,
      lng: 14.4183,
      duration: 20,
      type: 'shop' as const,
    },
    {
      order: 4,
      title: 'Smíchovský Cannabis Social Club',
      description: 'Private cannabis social club — your guide will share the story behind the members-only scene in Czechia.',
      lat: 50.0720,
      lng: 14.4066,
      duration: 30,
      type: 'club' as const,
    },
    {
      order: 5,
      title: 'High Café — Break & Coffee',
      description: 'Cannabis-friendly café with CBD infused drinks and a relaxed atmosphere. 20-min break.',
      lat: 50.0731,
      lng: 14.4101,
      duration: 20,
      type: 'cafe' as const,
    },
    {
      order: 6,
      title: 'Vyšehrad Viewpoint',
      description: 'Panoramic views over the Vltava river. Discussion of Czech counterculture and the role cannabis played in the 1989 revolution era.',
      lat: 50.0641,
      lng: 14.4178,
      duration: 20,
      type: 'viewpoint' as const,
    },
    {
      order: 7,
      title: 'Nusle Cannabis Community Garden',
      description: 'Visit a community hemp garden legally growing CBD cultivars. Meet the growers.',
      lat: 50.0658,
      lng: 14.4267,
      duration: 30,
      type: 'culture' as const,
    },
  ],
  images: [],
  coverImage: '',
  included: [
    'Expert local guide (EN/CS)',
    'CBD tea tasting at High Café',
    'Exclusive access to community garden',
    'H&S culture booklet',
    'XP & badge for Hub members',
  ],
  notIncluded: [
    'Product purchases',
    'Food (besides included café stop)',
    'Transport between districts',
  ],
  requirements: [
    'Must be 18+ (ID required)',
    'Comfortable walking shoes',
    'Approx. 4 km of walking',
    'No prior knowledge needed',
  ],
  category: 'walking' as const,
  rating: 0,
  reviewsCount: 0,
  totalBookings: 0,
  isActive: true,
  isFeatured: true,
  isComingSoon: false,
  availableSpots: 8,
}

const SPOTS = [
  {
    name: 'Zelená Farma CBD',
    city: 'Praha',
    country: 'CZ',
    type: 'cbd_shop' as const,
    description: 'Pioneer CBD boutique in the heart of Praha. Premium flowers, oils, and cosmetics. Staff with deep product knowledge.',
    address: 'Dlouhá 28, Praha 1',
    lat: 50.0878,
    lng: 14.4209,
    hours: 'Mon–Sat 10:00–20:00, Sun 12:00–18:00',
    website: 'https://zelenafarmacbd.cz',
    photos: [],
    coverPhoto: '',
    verified: true,
    featured: true,
    isActive: true,
    rating: 4.8,
    reviewsCount: 47,
  },
  {
    name: 'Hempoint Praha',
    city: 'Praha',
    country: 'CZ',
    type: 'cbd_shop' as const,
    description: 'Flagship hemp store in Old Town. Widest selection of CBD strains in Praha, plus seeds and lifestyle accessories.',
    address: 'Celetná 12, Praha 1',
    lat: 50.0871,
    lng: 14.4183,
    hours: 'Mon–Sun 09:00–21:00',
    website: 'https://hempoint.cz',
    photos: [],
    coverPhoto: '',
    verified: true,
    featured: false,
    isActive: true,
    rating: 4.6,
    reviewsCount: 31,
  },
  {
    name: 'High Café',
    city: 'Praha',
    country: 'CZ',
    type: 'cafe' as const,
    description: 'Cannabis-friendly café with CBD-infused drinks, herbal teas, and a relaxed atmosphere. Events on weekends.',
    address: 'Štefánikova 18, Praha 5',
    lat: 50.0731,
    lng: 14.4101,
    hours: 'Tue–Sun 11:00–23:00',
    instagram: '@highcafepraha',
    photos: [],
    coverPhoto: '',
    verified: true,
    featured: true,
    isActive: true,
    rating: 4.5,
    reviewsCount: 28,
  },
  {
    name: 'GreenZone Grow Shop',
    city: 'Praha',
    country: 'CZ',
    type: 'grow_shop' as const,
    description: 'Everything a home grower needs — seeds, substrate, tents, lights, nutrients. Knowledgeable staff. EU shipping.',
    address: 'Sokolská 52, Praha 2',
    lat: 50.0744,
    lng: 14.4378,
    hours: 'Mon–Fri 09:00–18:00, Sat 10:00–16:00',
    website: 'https://greenzonepraha.cz',
    photos: [],
    coverPhoto: '',
    verified: true,
    featured: false,
    isActive: true,
    rating: 4.7,
    reviewsCount: 19,
  },
  {
    name: 'Smíchovský Cannabis Social Club',
    city: 'Praha',
    country: 'CZ',
    type: 'cannabis_club' as const,
    description: 'Private members-only cannabis social club in Smíchov. Monthly events, education nights, and a welcoming community.',
    address: 'Nádražní 22, Praha 5',
    lat: 50.0720,
    lng: 14.4066,
    hours: 'Members only — Fri & Sat evenings',
    instagram: '@smichovcsc',
    photos: [],
    coverPhoto: '',
    verified: true,
    featured: false,
    isActive: true,
    rating: 4.9,
    reviewsCount: 12,
  },
]

async function main() {
  await connectDB()

  // Upsert tour
  await Tour.deleteOne({ slug: TOUR.slug })
  const tour = await Tour.create(TOUR)
  console.log(`✅ Created tour: ${tour.title} (${tour.slug})`)

  // Upsert spots
  let created = 0
  for (const spot of SPOTS) {
    await CannabisSpot.deleteOne({ name: spot.name, city: spot.city })
    await CannabisSpot.create(spot)
    created++
  }
  console.log(`✅ Created ${created} cannabis spots`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
