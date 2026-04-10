@AGENTS.md

# High & Seek — Project Context

**Domain:** highandseeek.com (three e's in domain, `highandseeek` in package.json)
**Concept:** Cannabis ecosystem with two pillars — Shop (CBD e-commerce) and Hub (community + AI + gamification). Connected to a sister project called **Seekers** (geocaching/hunt platform) which will be integrated later when this project is complete.

---

## Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Runtime | React | 19.2.4 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Auth | Auth.js / next-auth beta | 5.0.0-beta.30 |
| Database | MongoDB via Mongoose | ^9.3.2 |
| Validation | Zod | ^4 |
| State | Zustand | ^5 |
| Toasts | Sonner | ^2 |
| Payments | Stripe | ^20 |
| Email | Resend | ^6 |
| Media | Cloudinary | ^2 |
| AI | Anthropic SDK | ^0.80 |
| HTTP cache | TanStack Query | ^5 |
| Package manager | **pnpm** (not npm, not yarn) |

**Dev server port:** 3001 (`next dev -p 3001`)

---

## Critical Next.js 16 Conventions

- **Route protection:** uses `proxy.ts` in the project root (NOT `middleware.ts` — that is deprecated in Next.js 16 and will warn)
- Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`
- Tailwind v4 uses CSS-based config via `@theme inline` in `globals.css` — NO `tailwind.config.js`
- Font loading: `next/font/google` for Google fonts, `next/font/local` for local fonts

---

## Environment Variables (`.env.local`)

```
MONGODB_URL=mongodb+srv://...@cluster0.zxa57.mongodb.net/highandseeek_db?...
NEXTAUTH_SECRET=<32-byte base64 string>
AUTH_SECRET=<same or separate value>
```

**Important:**
- Database name is `highandseeek_db` — never use `seekers` or `test` or `admin`
- Auth secret must be a real non-empty value. The config uses `process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET` with `||` (not `??`) to handle empty strings correctly
- MongoDB Atlas Network Access must whitelist your IP (or `0.0.0.0/0` for dev)

---

## Design System

### Colors (CSS custom properties via `@theme inline`)

| Token | Hex | Usage |
|---|---|---|
| `--color-hs-black` | `#050508` | Background |
| `--color-hs-teal` | `#00d4c8` | Shop pillar, primary CTA, teal accents |
| `--color-hs-teal-dim` | `#007a74` | Muted teal |
| `--color-hs-magenta` | `#cc00aa` | Hub pillar, register, secondary CTA |
| `--color-hs-purple` | `#8844cc` | Accent |
| `--color-hs-amber` | `#f0a830` | XP display, badges |
| `--color-hs-amber-dim` | `#8a5e1a` | Muted amber |
| `--color-hs-navy` | `#0a2428` | Deep background |
| `--color-hs-white` | `#e8f0ef` | Primary text |
| `--color-hs-muted` | `#4a6066` | Labels, secondary text, icons |

### Fonts

| Variable | Source | Usage |
|---|---|---|
| `var(--font-cacha)` | `public/fonts/Cacha.otf` (local) | **Emphasis/brand only** — hero title, navbar logo, CTA button labels, pillar titles, auth headings |
| `var(--font-orbitron)` | Google Fonts | Tech/sci-fi headings, usernames, XP display |
| `var(--font-dm-sans)` | Google Fonts | Body text, inputs, paragraphs |
| `var(--font-dm-mono)` | Google Fonts | Labels, tags, mono elements, toasts |

**Rule:** Cacha is the inter-vibe connection font shared with the Seekers project. Use it only for emphasis, never for body text or labels.

### Visual Style
- Dark background `#050508` with subtle scanline overlay (`body::after`)
- Shop = teal (`#00d4c8`), Hub = magenta (`#cc00aa`)
- Animations: `fadeUp`, `glitch`, `gridMove`, `glowPulse` (defined in `globals.css`)
- Borders: `0.5px solid rgba(color, 0.15–0.25)` — always thin/subtle
- Border radius: `4px` for inputs/buttons, `8px` for cards
- Retro perspective SVG grid in HeroGrid (server component, animated)

---

## File Structure

```
app/
  layout.tsx              # Root layout — loads all fonts, wraps with SessionProvider + ToastProvider
  globals.css             # Tailwind v4 import + @theme inline tokens + animations
  page.tsx                # Landing page (assembles layout components)
  shop/page.tsx           # Shop placeholder (public, teal accent)
  hub/page.tsx            # Hub page (protected, uses auth() server-side, magenta accent)
  auth/
    login/page.tsx        # Login form — teal card, sonner toasts, loading overlay
    register/page.tsx     # Register form — magenta card, sonner toasts, loading overlay
  api/
    auth/
      [...nextauth]/route.ts   # Auth.js handlers (GET + POST)
      register/route.ts        # POST /api/auth/register

components/
  layout/
    Navbar.tsx            # Fixed top nav — logo, EN/CS switcher, auth state (client)
    HeroSection.tsx       # Hero — CannabisLeaf SVG, animated title, CTAs (client)
    HeroGrid.tsx          # Retro SVG grid background (server)
    PillarsSection.tsx    # Shop + Hub pillar cards with features (client)
    ForumBridgeSection.tsx # AI forum bridge terminal mockup (client)
    Footer.tsx            # Footer (client)
  providers/
    SessionProvider.tsx   # next-auth/react SessionProvider wrapper (client)
    ToastProvider.tsx     # Sonner Toaster — dark themed, top-center

lib/
  auth/config.ts          # NextAuth config — Credentials provider, JWT callbacks
  db/
    connect.ts            # MongoDB singleton connection (globalThis cache)
    models/User.ts        # Mongoose User schema

stores/
  languageStore.ts        # Zustand + persist — locale only persisted, t derived fresh on hydration

lib/i18n/
  translations.ts         # EN + CS translations object

types/
  next-auth.d.ts          # Module augmentation — Session.user, User, JWT extended types

proxy.ts                  # Route protection (Next.js 16 — NOT middleware.ts)
```

---

## Authentication

- Strategy: **JWT** (no database sessions)
- Provider: **Credentials** (email + password)
- Password hashing: **bcryptjs**, 12 rounds
- Secret: `AUTH_SECRET || NEXTAUTH_SECRET` (handles empty string edge case)
- Protected routes: `/hub/*` → redirected to `/auth/login?callbackUrl=/hub` if unauthenticated

### Session fields (available via `useSession()` and `auth()`)
```typescript
session.user.id        // MongoDB ObjectId as string
session.user.email     // string
session.user.username  // string
session.user.role      // 'user' | 'admin'
session.user.xp        // number (default 0)
session.user.level     // number (default 1)
```

### User model (`lib/db/models/User.ts`)
```typescript
{
  email:        String  // unique, lowercase, trimmed
  passwordHash: String  // bcrypt hash
  username:     String  // unique, trimmed
  role:         'user' | 'admin'  // default: 'user'
  xp:           Number  // default: 0
  level:        Number  // default: 1
  avatar:       String  // default: ''
  timestamps: true
}
```

---

## i18n (Language Switching)

- Locales: `en` (English) and `cs` (Czech) — NOT Slovak
- Client-side only via Zustand (`stores/languageStore.ts`)
- Persisted to localStorage as `hs-language` — **only `locale` is persisted, not `t`**
- `t` (translations object) is always derived fresh from `translations.ts` on rehydration
- Hydration fix: `useLanguage()` returns English until store is rehydrated, preventing SSR mismatch
- All text-rendering components are `'use client'` and import `useLanguage`

---

## UX Conventions

- **Loading states:** Full-screen overlay (`position: fixed, inset: 0`) with spinning SVG + blurred backdrop — page is entirely non-interactive during async operations (`pointerEvents: 'none'`)
- **Toasts:** Sonner, `top-center`, dark-themed matching design system (`#050508` bg, teal border, DM Mono font)
- **Password fields:** Always include eye icon toggle (show/hide). On register, both Password and Confirm Password have independent toggles
- **Error handling:** All errors shown via `toast.error()`, success via `toast.success()` — no inline error text in forms

---

## The Cannabis Leaf Icon (`CannabisLeaf` in HeroSection)

SVG: 80×80 viewBox, 7 straight lines from a single junction point `{x:40, y:50}` to tip coordinates. Line-only, no fill, no bezier curves, `strokeLinecap="butt"` (prevents bright dots at line ends).

```typescript
const tips = [
  { x: 40, y: 4  },  // center up
  { x: 16, y: 14 },  // upper-left
  { x: 64, y: 14 },  // upper-right
  { x: 4,  y: 36 },  // mid-left
  { x: 76, y: 36 },  // mid-right
  { x: 27, y: 63 },  // bottom-left (downward, tight angle)
  { x: 53, y: 63 },  // bottom-right (downward, tight angle)
]
```

---

## Planned Features (Not Yet Built)

### Virtual Grow
A gamified grow simulation within the Hub. Users grow virtual cannabis plants, earn XP for care actions (watering, lighting, nutrients), progress through stages (seed → seedling → veg → flower → harvest). Tied to the XP/level system already in the User model. Will use AI (Anthropic SDK, already installed) for strain personality and grow advice.

### AI Strain Avatars
Each strain has an AI-powered personality (using Anthropic SDK). Users can chat with their strain avatar. XP earned through interactions.

### Seekers Integration
The Seekers project (geocaching/hunt platform, separate Next.js app) will be connected to High & Seek once this project is complete. Shared: Cacha.otf font, color palette (teal/magenta), same MongoDB Atlas cluster (different database: `seekers_db`). The hunt events mentioned in Hub features are Seekers events surfaced inside H&S Hub.

### AI Forum Bridge
Indexes ICMag, Rollitup, Reddit cannabis forums. Users ask questions, get consolidated answers with source links. Already mocked in `ForumBridgeSection.tsx`.

### Shop (E-commerce)
CBD seeds, clones, flowers. Guest checkout supported. Payment via Stripe (already installed) and Crypto. Cloudinary (already installed) for product images.

### Resend / Email
Transactional emails via Resend (already installed) — registration confirmation, order updates, etc.

---

## Seekers Sister Project

- Separate Next.js app (different repo/port)
- Same MongoDB Atlas cluster, different database (`seekers_db`)
- **Never cross-query between `highandseeek_db` and `seekers_db`**
- Shared visual identity: Cacha.otf, teal/magenta palette
- Will be connected via API once both projects are ready

---

## Virtual Grow — Detailed Spec

### Concept
Gamified cannabis grow simulation inside the Hub. User builds a virtual 
grow room, selects strain, performs care actions daily, earns XP and 
H&S Credits at harvest. Realism-based — teaches real cultivation techniques.

### Visual Style
Hybrid ASCII/box-drawing UI chrome (box-drawing chars: ┌┐└┘├┤┬┴┼─│) 
with a live procedural SVG plant in the center panel.
Click any setup component → detail overlay with real product photo 
(Cloudinary) + guidance text.

### Setup Selection — Dependency System
Medium choice gates all other options. Use a dependency tree:

Living Soil:
  - Watering: Blumat / manual drip / hand watering only
  - Nutrients: organic teas, topdress, compost — NO mineral nutrients
  - Container: fabric pot / raised bed / no-till bed
  - Hydro options: DISABLED (tooltip: "Living soil relies on 
    microbial life — hydro systems flush and destroy beneficial 
    bacteria and fungi that make living soil work")
  - Mineral nutrients: DISABLED (tooltip: "Synthetic salts disrupt 
    the soil food web in living soil. Use organic amendments instead")

Coco Coir:
  - Watering: drip timer / manual — frequent (coco dries fast)
  - Nutrients: mineral 2-part or 3-part — required, coco is inert
  - Container: fabric pot / airpot / plastic pot
  - Organic nutrients: DISABLED (tooltip: "Coco is inert — it has 
    no microbial life to break down organic matter. Use mineral 
    nutrients with precise EC/pH")

Hydroponics (DWC/NFT/Flood&Drain):
  - Watering: recirculating system — automated
  - Nutrients: hydro-specific mineral — EC monitored
  - Container: net pot / bucket / tray
  - Soil options: DISABLED
  - Organic nutrients: DISABLED

### Plant Visual — Procedural SVG
Plant SVG changes based on:
  - Day number + growth stage
  - Strain type (Sativa: tall/narrow, Indica: short/dense, 
    Hybrid: mixed)
  - Health % (color saturation, leaf droop)
  - Applied techniques (LST: bent/spread canopy, 
    Defoliation: fewer fan leaves)

Growth stages:
  seedling (day 1-7) → early veg (8-21) → mid veg (22-35) → 
  late veg (36-45) → early flower (F1-14) → mid flower (F15-35) → 
  late flower (F36-harvest) → ready

### Care Actions
  WATER    — frequency depends on medium and container size
  FEED     — nutrients per schedule, disabled for living soil self-sustaining
  LST      — available veg only, changes plant shape visually
  DEFOLIATE — available mid-veg and early flower
  TOPDRESS  — living soil only, organic amendments
  pH CHECK  — all setups, affects nutrient uptake
  HARVEST   — available when trichomes ready (strain flowering time reached)

### Random Events
Triggered by: day, care quality, setup type, RNG weight
Each event: 3 response options → correct (+XP, no yield loss) / 
wrong (-yield) / ignore (progressive damage)

Categories: Pests / Environment stress / Nutrient issues / 
Positive bonuses (exceptional terps, perfect stretch)

### Rewards
  XP per action (watering: 5xp, feeding: 10xp, LST: 20xp, 
  defo: 15xp, correct event response: 50xp)
  H&S Credits at harvest — amount based on yield quality %
  NFT harvest certificate — Solana mint, unique per grow
  Shop discount unlock — credits redeemable for % off

### Funnel
  Virtual strain X completed → "Grow it for real?" → 
  direct link to strain product page in Shop

### MongoDB Model (to be created: lib/db/models/VirtualGrow.ts)
{
  userId: ObjectId (ref: User)
  strainSlug: string
  setup: {
    medium: 'living_soil' | 'coco' | 'hydro' | 'dwc'
    light: string
    tent: string
    watering: string
    nutrients: string
    container: string
  }
  startDate: Date
  currentDay: number
  stage: 'seedling'|'veg'|'flower'|'harvest'|'complete'
  health: number (0-100)
  yieldQuality: number (0-100)
  xpEarned: number
  events: Array<{day, type, response, xpEffect, yieldEffect}>
  actions: Array<{day, type, timestamp}>
  harvestData: { gramsYield, qualityScore, nftMinted, creditsEarned }
  status: 'active' | 'completed' | 'failed'
  timestamps: true
}

### Build Priority
After: auth ✓ → landing ✓ → shop basics → strain AI chat
Virtual Grow is the flagship Hub feature — build as Hub MVP after 
strain profiles exist (strain data needed for flowering times)
```

## Key Decisions & Rules

1. **No `any` in TypeScript** — use proper types or Zod inference
2. **pnpm only** — `npm install` fails due to peer dep conflicts in this project
3. **`proxy.ts` not `middleware.ts`** — Next.js 16 convention
4. **Tailwind v4** — no `tailwind.config.js`, all config in `globals.css` via `@theme inline`
5. **`||` not `??` for AUTH_SECRET** — empty string must be falsy (env vars can be set but empty)
6. **`partialize` in Zustand persist** — only persist `locale`, never the full `t` object, to avoid stale translations after code changes
7. **All layout sections are `'use client'`** — they depend on `useLanguage()` from Zustand
8. **`HeroGrid.tsx` is a server component** — pure SVG, no client state needed
9. **Fonts via CSS variables** — always reference as `fontFamily: 'var(--font-cacha)'` etc, never hardcode font names in component styles
10. **`useSearchParams` requires Suspense** — pattern: inner component reads params, outer default export wraps in `<Suspense>`


## Seekers Integration — Planned, Not Yet Built

Sister project Seekers (seekers-game.com) will be 
integrated in a future sprint. Do NOT build any 
Seekers-specific code in H&S now.

When integration happens:
- Seekers will migrate from Payload CMS to Auth.js v5 
  + Mongoose (full analysis already done)
- Shared MongoDB database: "universe_db"  
- Single user account works across both apps
- Shared: credits, XP, profile, bio, avatar, links
- Seekers uses tRPC, H&S uses REST API routes
- Shared AUTH_SECRET for unified JWT

For now: H&S is fully standalone.
Current Seekers DB: seekers_db (do not touch)