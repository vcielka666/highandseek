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
TELEGRAM_BOT_TOKEN=   # from @BotFather — create bot, then /token
TELEGRAM_CHAT_ID=     # your personal chat ID — message @userinfobot to get it
MYSTERY_BOX_PASSWORD_HASH=  # bcrypt hash — generate with: pnpm tsx scripts/generate-mystery-hash.ts YOUR_PASSWORD
```

**Important:**
- Database name is `highandseeek_db` — never use `seekers` or `test` or `admin`
- Auth secret must be a real non-empty value. The config uses `process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET` with `||` (not `??`) to handle empty strings correctly
- MongoDB Atlas Network Access must whitelist your IP (or `0.0.0.0/0` for dev)
- `MYSTERY_BOX_PASSWORD_HASH` is a bcrypt hash — **never store the plaintext password**. The password is verified server-side only via `POST /api/mystery/verify`. No password or hash is ever sent to the client.

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

### Grow Simulator
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

## Grow Simulator — Detailed Spec

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
Grow Simulator is the flagship Hub feature — build as Hub MVP after
strain profiles exist (strain data needed for flowering times)
```

## Key Decisions & Rules

1. **No `any` in TypeScript** — use proper types or Zod inference
0. **ALL user-facing text must go through the i18n system** — every string rendered to the UI must have an EN and CS translation in `lib/i18n/translations.ts`. Never hardcode text directly in components. Use `useLanguage()` on client components and `getServerT()` on server components. Locales: `en` (English) and `cs` (Czech). No Slovak — the project uses Czech as the "local" language, not Slovak. Violating this rule means a feature is not complete.
2. **pnpm only** — `npm install` fails due to peer dep conflicts in this project
3. **`proxy.ts` not `middleware.ts`** — Next.js 16 convention
4. **Tailwind v4** — no `tailwind.config.js`, all config in `globals.css` via `@theme inline`
5. **`||` not `??` for AUTH_SECRET** — empty string must be falsy (env vars can be set but empty)
6. **`partialize` in Zustand persist** — only persist `locale`, never the full `t` object, to avoid stale translations after code changes
7. **All layout sections are `'use client'`** — they depend on `useLanguage()` from Zustand
8. **`HeroGrid.tsx` is a server component** — pure SVG, no client state needed
9. **Fonts via CSS variables** — always reference as `fontFamily: 'var(--font-cacha)'` etc, never hardcode font names in component styles
10. **`useSearchParams` requires Suspense** — pattern: inner component reads params, outer default export wraps in `<Suspense>`
11. **shadcn/ui is installed** — components in `components/ui/`. Uses Tailwind v4 CSS variable bridge via `@import "shadcn/tailwind.css"` in globals.css. Override shadcn colors by setting inline `style` props, not Tailwind classes (shadcn's oklch tokens conflict with HS design tokens).
12. **Admin accent = amber** — `/admin/*` uses `#f0a830` as primary color. Never use teal or magenta as primary in admin.

---

## Admin Panel

### Access
- Route: `/admin/*`
- Role: `admin` only — checked server-side in `proxy.ts` AND in `app/admin/layout.tsx`
- Redirect non-admin users to `/hub`
- Redirect unauthenticated users to `/auth/login?callbackUrl=/admin`

### Make Admin Script
```bash
pnpm tsx scripts/make-admin.ts user@example.com
```
File: `scripts/make-admin.ts` — sets `role: 'admin'` for the given email using direct MongoDB update.

### Admin Routes

| Page       | Path                     | Data Source |
|------------|--------------------------|-------------|
| Overview   | `/admin`                 | Server component — direct DB queries |
| Orders     | `/admin/orders`          | Client — `/api/admin/orders` |
| Order Edit | `/admin/orders` (Sheet)  | Client — `/api/admin/orders/[id]` |
| Products   | `/admin/products`        | Client — `/api/admin/products` |
| New Product| `/admin/products/new`    | Client form |
| Edit Product| `/admin/products/[slug]`| Server + client |
| Users      | `/admin/users`           | Client — `/api/admin/users` |
| User Detail| `/admin/users/[id]`     | Server component — direct DB queries |
| Hub Stats  | `/admin/hub`             | Client — `/api/admin/hub` |
| Analytics  | `/admin/analytics`       | Client — `/api/admin/analytics` |
| System     | `/admin/system`          | Client — `/api/admin/system` |

### API Routes (all require admin role)

```
GET  /api/admin/orders               paginated, filterable
PATCH /api/admin/orders/[id]         { status }
GET  /api/admin/orders/export        CSV download
GET  /api/admin/products             list, filterable
POST /api/admin/products             create
GET  /api/admin/products/[slug]      single
PATCH /api/admin/products/[slug]     update
DELETE /api/admin/products/[slug]    delete
GET  /api/admin/users                paginated, filterable
GET  /api/admin/users/[id]           with orders/xp/credits
PATCH /api/admin/users/[id]          { role }
POST /api/admin/users/[id]/award-xp        { amount, reason }
POST /api/admin/users/[id]/award-credits   { amount, reason }
POST /api/admin/users/[id]/suspend         { suspended: bool }
POST /api/admin/users/[id]/reset-password  sends Resend email
GET  /api/admin/overview             dashboard metrics
GET  /api/admin/analytics            revenue/reg/orders charts
GET  /api/admin/hub                  XP/forum stats
GET  /api/admin/system               DB counts, error log
POST /api/admin/system/clear-errors  deletes errors >30 days
```

### ErrorLog Model
File: `lib/db/models/ErrorLog.ts`
Fields: `message`, `stack`, `route`, `userId`, `severity` (low/medium/high), `action` (audit string), `createdAt`
Usage: log all destructive admin actions (status changes, suspensions, password resets, XP/credit awards).

### Admin UI Architecture
- Sidebar: `app/admin/AdminSidebar.tsx` — client component, 240px desktop / 48px mobile icon-only
- Shared components in `components/admin/`: `MetricCard`, `StatusBadge`, `AdminPageHeader`
- Charts: Recharts — dark themed, transparent background, amber/teal/magenta lines
- All admin pages use inline `style` props for H&S design tokens (not Tailwind classes) to avoid shadcn token conflicts

### Dependencies Added
- `recharts` — all charts
- `react-hook-form` + `@hookform/resolvers` — product form
- `date-fns` — relative time formatting
- `lucide-react` — icons
- `shadcn/ui` components: card, badge, input, textarea, select, tabs, progress, skeleton, dialog, sheet, table, separator, scroll-area, button, label, switch, form, dropdown-menu, avatar, tooltip, checkbox


## Telegram Notification System

File: `lib/notifications/telegram.ts`

**Functions:**
- `sendTelegramMessage(text)` — sends HTML-formatted message to the owner's Telegram. Always wrapped in try/catch, never throws, logs failures to ErrorLog
- `formatOrderInquiry({ telegramContact, items, subtotal })` — formats a "want to consult before buying" inquiry in Slovak
- `formatOrderConfirmation(order)` — formats a confirmed paid order notification in Slovak

**Triggers:**
1. `POST /api/shop/cart/inquiry` — customer sends pre-purchase inquiry from checkout sidebar. Rate-limited to 3/IP/hour. Logged to ErrorLog severity='low'. No auth required
2. Stripe webhook `payment_intent.succeeded` — auto-fires `formatOrderConfirmation` after order is saved to MongoDB

**Telegram contact flow:**
- Checkout form has optional "Telegram kontakt" field (amber-styled, under Contact section)
- On "Place Order": `PATCH /api/shop/checkout` updates the Stripe PaymentIntent metadata with `telegramContact`
- Webhook reads `metadata.telegramContact` → saves to `Order.telegramContact`
- Quick Contact section in order summary sidebar lets users send an inquiry WITHOUT paying first (separate `/api/shop/cart/inquiry` endpoint)

**Key rule:** Telegram failure must NEVER fail the webhook or block any user-facing flow.

---

## AI Strain Avatar System

### Models

**`lib/db/models/Strain.ts`**
```
slug, name, type (indica|sativa|hybrid), genetics, floweringTime, difficulty
personality: { archetype, tone[], catchphrase, favoriteAction, hatedAction,
               topics[], forbiddenTopics[], systemPrompt, customSystemPrompt }
visuals: { avatarLevels[{ level, imageUrl, animationClass }],
           idleAnimation, happyAnimation, sadAnimation }
stats: { totalChats, totalMessages, helpfulVotes, unhelpfulVotes }
shopProductSlug, isActive, isComingSoon
```

**`lib/db/models/AvatarState.ts`** (per user per strain)
```
userId, strainSlug
level (1-10), xp, xpToNextLevel
needs: { hydration, nutrients, energy, happiness (0-100), lastUpdated }
status: thriving|happy|neutral|sad|wilting
cooldowns: { water, feed, light, flush } (Date or null)
careHistory[{ action, timestamp, xpEarned }]
chatCount, lastChatAt, lastCareAt
Unique index: { userId, strainSlug }
```

**`lib/db/models/StrainChat.ts`**
```
userId, strainSlug
messages[{ role: user|assistant, content, timestamp }]
xpEarned
```

### Decay System (`lib/avatar/decay.ts`)
- `calculateCurrentNeeds(stored)` — pure, time-based decay, NO DB save
  - hydration: -1/h, nutrients: -0.5/h, energy: -0.75/h, happiness: -0.5/h (-2/h if no chat 48h+)
- `calculateStatus(needs)` → thriving(80+) | happy(60+) | neutral(40+) | sad(20+) | wilting
- `calculateXpMultiplier(status)` → 1.5|1.2|1.0|0.7|0.3
- `AVATAR_LEVELS` — 10 levels: Seedling(0)→Cutting(50)→...→Legendary(2500)
- `CARE_COOLDOWNS_MS` — water:8h, feed:24h, light:12h, flush:72h

### Care Actions Effects
- water: hydration +40, energy +5
- feed: nutrients +40, energy +5
- light: energy +40, happiness +5
- flush: hydration +20, nutrients -20
- hatedAction: happiness -15 extra
- favouriteAction: happiness +10 extra

### API Routes
```
GET  /api/hub/strains                       All active strains + user states
GET  /api/hub/strains/[slug]                Single strain + user state
POST /api/hub/strains/[slug]/care           { action: water|feed|light|flush }
POST /api/hub/strains/[slug]/chat           { message } → Claude Haiku response
GET  /api/hub/strains/[slug]/chat/history   Last 20 messages
GET/POST /api/admin/strains                 Admin strain list
GET/PATCH /api/admin/strains/[slug]         Admin strain detail
POST /api/admin/strains/[slug]/test-chat    Test personality (no DB save, no XP)
```

### Seed Script
`pnpm tsx scripts/seed-strains.ts` — seeds 7 strain personalities (cherrygasm, jack-herer, odb, dosidos, milky-dreams, tarte-tarin, velvet-moon)

### XP Events Added
```
STRAIN_FIRST_CHAT: 20, STRAIN_CHAT_MESSAGE: 15 (× multiplier)
STRAIN_CARE_WATER: 5, STRAIN_CARE_FEED: 10, STRAIN_CARE_LIGHT: 5, STRAIN_CARE_FLUSH: 5
STRAIN_AVATAR_LEVEL_UP: 50, STRAIN_CHAT_SESSION_LONG: 30
```

---

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

---

## Grow Equipment Database

Model: `lib/db/models/GrowEquipment.ts`  
Data: `data/grow-equipment.json` (82 products)  
Seed: `pnpm tsx scripts/seed-grow-equipment.ts`

### Model fields
- `name` — String (required)
- `slug` — String (unique, auto-generated from name)
- `brand` — String
- `description` — String (2–3 sentences, English)
- `specs` — Mixed (product-type specific: watts/coverage for lights, CFM/dB for fans, NPK for nutrients, etc.)
- `imageUrl` — String (main image, empty string if unavailable)
- `images` — [String] (all product images)
- `prices.czk` — Number (required, primary)
- `prices.usd` — Number (secondary)
- `prices.eur` — Number (optional)
- `category` — String enum: `light_led | light_hps | light_cmh | light_cfl | light_t5 | exhaust_fan | circulation_fan | carbon_filter | medium_soil | medium_coco | medium_hydro | fabric_pot | plastic_pot | airpot | watering_blumat | watering_drip | watering_manual | nutrients_organic | nutrients_mineral | ph_meter | ec_meter | thermohygrometer | timer | lst_tools | other`
- `lightType` — String enum (lights only): `led | hps | cmh | cfl | t5`
- `compatibleMedia` — [String] e.g. `['soil', 'coco', 'hydro']`
- `sourceUrl` — String
- `isGenerated` — Boolean (true = price/data is estimated, not scraped — needs manual review)
- `isActive` — Boolean (default true)

### Grow Simulator dependency resolution
Medium choice → filter `compatibleMedia`:
- living_soil → `compatibleMedia` includes 'soil', exclude `nutrients_mineral` where `compatibleMedia` is coco/hydro-only
- coco → `compatibleMedia` includes 'coco', exclude `nutrients_organic` where `compatibleMedia` is soil-only
- hydro/dwc → `compatibleMedia` includes 'hydro', exclude soil/coco products

### Data status (as of 2026-04-01)
- 22 products have real scraped prices (Mars Hydro LEDs, AC Infinity fans, Plagron A&B, Bluelab meters)
- 60 products are `isGenerated: true` — prices estimated, images missing
- See `data/grow-equipment-report.md` for full breakdown

---

## Grow Simulator — Implementation Status

**Built. Route: `/hub/grow`**

### Files
| File | Purpose |
|------|---------|
| `lib/db/models/VirtualGrow.ts` | MongoDB model |
| `lib/grow/tentLayout.ts` | SVG coordinate system — TENT_LAYOUT, EQUIP_IMGS, helpers (single source of truth) |
| `lib/grow/attributes.ts` | RPG attribute calculation (pure functions) |
| `lib/grow/simulation.ts` | Day advancement, stage transitions, action effects |
| `lib/grow/PlantSVG.tsx` | Procedural SVG plant component |
| `app/hub/grow/page.tsx` | Entry — active grow card or strain picker |
| `app/hub/grow/setup/page.tsx` | 6-step setup wizard (client) |
| `app/hub/grow/[id]/page.tsx` | Active grow view — tent visual + attributes + actions |
| `app/hub/grow/[id]/journal/new/page.tsx` | Journal entry form (with EXIF strip) |
| `app/hub/grow/[id]/harvest/page.tsx` | Harvest report (server component) |

### API Routes
```
GET  /api/hub/grow                  Active grow for current user
POST /api/hub/grow/start            { strainSlug, setup, timeMode }
POST /api/hub/grow/action           { type: water|feed|lst|defoliate|ph_check|top|flush }
POST /api/hub/grow/advance-day      Rate-limited: 24h realtime / 2.4h accelerated
POST /api/hub/grow/journal          multipart/form-data — EXIF stripped via sharp().rotate()
POST /api/hub/grow/harvest          Only when stage=harvest
GET  /api/hub/grow/history          Completed/failed grows, paginated
```

### VirtualGrow Model Key Fields
```typescript
userId, strainSlug, strainName, strainType, floweringTime
setup: { tentSize, lightType, lightWatts, medium, potSize, watering, nutrients,
         hasExhaustFan, exhaustCFM, hasCirculationFan, hasCarbonFilter,
         hasPHMeter, hasECMeter, hasHygrometer }
timeMode: 'realtime' | 'accelerated'
stage: 'seedling' | 'veg' | 'flower' | 'late_flower' | 'harvest' | 'complete' | 'failed'
health: number (0-100)
attributes: { temperature, humidity, light, ventilation, nutrients, watering }
  each: { value, optimal: { min, max }, status: 'optimal'|'warning'|'critical' }
warnings: [{ attribute, message, guide, severity, triggeredAt, resolvedAt }]
actions: [{ type, timestamp, xpEarned, effect }]
journalEntries: [{ day, stage, photoUrl, temperature, humidity, ph, ec, notes, mood, xpEarned }]
harvestData: { gramsYield, qualityScore, creditsEarned, completedAt }
status: 'active' | 'completed' | 'failed' | 'abandoned'
```

### Key Rules
- First grow is FREE (realtime only). Subsequent: 3 credits
- Accelerated mode: 10x speed, `isPerkEligible: false`, no NFT cert
- Journal photos: EXIF/GPS stripped via `sharp(buffer).rotate().toBuffer()` before Cloudinary upload
- Medium dependency rules enforced in setup wizard: living_soil→organic only, coco→mineral required, hydro→mineral+drip only
- Stage transitions: seedling (d1-7) → veg (d8-35) → flower (d36-35+floweringTime) → harvest

### Tent View — SVG Coordinate System

File: `lib/grow/tentLayout.ts` — **single source of truth for all tent element positions.**

The entire tent is rendered as one `<svg viewBox="0 0 1000 750">` — no div/px layering. All positions are in SVG coordinate space, not pixels. This ensures exact layout on any screen size.

```
SVG_W = 1000, SVG_H = 750, TENT_FLOOR_Y = 640
```

**TENT_LAYOUT** (all x/y/w/h in SVG units):
```typescript
light:    { x: 330, y: 15,  w: 340, h: 200 }   // lamp image area
exhaust:  { x: 830, y: 25,  w: 140, h: 170 }   // exhaust fan (draggable)
sonoflex: { x: 760, y: 90,  w: 90,  h: 280 }   // ducting (no image yet)
filter:   { x: 840, y: 340, w: 120, h: 210 }   // carbon filter (rotated 90°)
circ:     { x: 20,  y: 330, w: 130, h: 130 }   // circulation fan
hygro:    { x: 770, y: 210, w: 90,  h: 90  }   // thermohygrometer (no image yet)
medium:   { x: 30,  y: 560, w: 160, h: 170 }   // soil bag
ph:       { x: 790, y: 590, w: 85,  h: 150 }   // pH meter (no image yet)
tray:     { x: 100, y: 685, w: 800, h: 55  }   // drip tray
```

**EQUIP_IMGS** — all Cloudinary image URLs live in `tentLayout.ts`:
```
tentBg, tentBgDark, exhaust, circulation, filter, mediumSoil
Light images: /equip/lights/tent/hps.png, hps on.png, cfl.png, cfl on.png
LED: Cloudinary v1775046794/light-led_o3w4p6.png
```

**Helper functions:**
- `lampTopSVG(heightCm)` — maps 20–100 cm height to SVG Y coordinate (10–110)
- `getLampSVGWidth(lightType)` — CFL: 120, others: 160
- `getLightImageUrl(lightType, isOn)` — returns correct on/off image URL
- `getPlantContainerWidth(potCount, tentSize)` — capped at 400 (= floor(640/1.6))
- `getPlantFOX(containerWidth)` — centers foreignObject at SVG_W/2
- `getTempColor(temp)`, `getHumidityColor(humidity, stage)` — badge color helpers

**SVG Layers (render order):**
1. Day/night tent backgrounds — `<image>` with CSS `opacity` crossfade (2s ease)
2. Carbon filter (SVG `transform="rotate(-90,...)"`) + circ fan + medium bag + exhaust fan (draggable)
3. Light cone (`<ellipse fill="url(#cone-{type})">` from `<radialGradient>` in `<defs>`) + lamp `<image>` (draggable) + height badge
4. PlantImage in `<foreignObject x={foX} y={0} width={containerW} height={640}>` — bottom-anchored
5. Lottie action animation in `<foreignObject x={350} y={200} width={300} height={300}>`
6. Health badge as native SVG `<g>` (rect + text + progress bar)

**Light cone SVG `<radialGradient>` — use `stopColor` + `stopOpacity` (NOT CSS rgba):**
- LED: teal `#00d4c8`, CFL: warm `#fff5cc`, HPS/CMH: orange `#ff9900`
- `gradientUnits="userSpaceOnUse"`, `cx/cy` at lamp center, `r` = 350

**Drag interactions:** Mouse/touch `clientY` delta used directly; mapped to cm-change, then `lampTopSVG()` converts to SVG Y. No SVG coordinate transform needed.

**Grow end states (failed/abandoned/completed):**
- `GET /api/hub/grow?id={id}` — supports fetching by ID for any status
- `completed` → `router.replace(/hub/grow/{id}/harvest)` immediately
- `failed` / `abandoned` → `<GrowEndOverlay>` on plain `#050508` background (no active grow UI)
- Overlay uses `@keyframes dropIn` CSS animation (falls from top, bounces into center)

### Cloudinary Assets Used
```
tent-bg:      v1775046694/tent-bg_tqvklk.png
tent-bg-dark: v1775213761/tent-bg-dark_tdybst.png
light-led:    v1775046794/light-led_o3w4p6.png
fan-exhaust:  v1775046842/fan-exhaust_d6cc5c.png
fan-circ:     v1775046841/fan-circulation_q6zbyi.png
carbon-filter:v1775046888/carbon-filter_zk4axj.png
pot-small:    v1775046945/pot-small_lr05r7.png
pot-medium:   v1775046946/pot-medium_cmrorl.png
pot-large:    v1775046949/pot-large_upcfrg.png
medium-soil:  v1775046962/medium-soil_zbyoum.png
HPS/CFL lights: /equip/lights/tent/ (local /public)
```

---

## Marketplace

Route: `/hub/marketplace`
Model: `lib/db/models/Listing.ts`

### Listing model fields
- `userId` — ObjectId ref User
- `title` — string, max 80
- `description` — string, max 500
- `category` — 'equipment' | 'clones' | 'seeds' | 'nutrients' | 'other'
- `price` — number EUR (0 = free/trade)
- `location` — string optional
- `contact` — `{ telegram?, signal?, threema? }` (at least 1 required)
- `images` — string[] Cloudinary URLs, max 3
- `status` — 'active' | 'sold' | 'removed' | 'expired'
- `creditsCost` — number (saved at post time)
- `expiresAt` — Date (30 days from creation)

### Credit costs
- `MARKETPLACE_POST: 15` — post a new listing
- `MARKETPLACE_EXTEND: 10` — extend expiry by 30 days

### API routes
```
GET    /api/hub/marketplace          public browse, ?category, ?page (20/page)
POST   /api/hub/marketplace          auth, deduct 15 credits, create listing
PATCH  /api/hub/marketplace/[id]     auth + owner, { action: 'mark_sold' | 'mark_active' | 'extend' }
DELETE /api/hub/marketplace/[id]     auth + owner, sets status='removed' (no refund)
```

### UI
- Browse page: `/hub/marketplace` — server component, category filter via URL params
- New listing: `/hub/marketplace/new` — server wrapper + `NewListingForm` client component
- My listings: profile page "Listings" tab — `MyListingActions` client component
- Contact info always visible (hub requires auth)
- Auto-expire: on each browse page load, bulk-updates status='expired' where expiresAt < now

---

## Deployment

- **Server:** DigitalOcean VPS
- **IP:** 138.68.74.105
- **OS:** Ubuntu 24.04
- **Path:** /var/www/highandseek
- **Port:** 3001
- **Process manager:** PM2 (process name: `highandseek`)
- **Web server:** Nginx
- **Node options:** `NODE_OPTIONS="--max-old-space-size=1536"` (1 GB RAM VPS)

### Commands
```bash
# Build
NODE_OPTIONS="--max-old-space-size=1536" pnpm build

# Restart (with env reload)
pm2 restart highandseek --update-env

# Logs
pm2 logs highandseek
```

### Domains
- highandseek.com, highandseek.cz — not yet configured
- DNS: needs A record → 138.68.74.105

### next.config.ts required for production builds
```ts
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

### Environment variables (`.env.local` on server)
- `AUTH_URL=http://138.68.74.105` (update to `https://highandseek.com` once domain + SSL configured)
- `AUTH_SECRET=<32-byte base64>` — must match exactly, no leading spaces
- Leading spaces in `.env.local` silently break env vars — always verify with `grep AUTH .env.local`

---

## QR Redirect System

### Routes
- `GET /go` — redirects using default slug 'go'
- `GET /go/[slug]` — dynamic redirect by slug
- Both log a `QRScan` to MongoDB, set/read `hs_qr_session` HttpOnly cookie (7 days)

### Models (`lib/db/models/QRRedirect.ts`)

**QRRedirect**
```
slug:      String (unique, lowercase)
targetUrl: String
label:     String (admin label)
isActive:  Boolean (default true)
timestamps: true
```

**QRScan**
```
slug:                    String (index)
timestamp:               Date (index)
userAgent:               String
ip:                      String
country:                 String (optional)
city:                    String (optional)
device:                  'ios' | 'android' | 'desktop' | 'other'
referrer:                String
convertedToRegistration: Boolean (default false)
convertedAt:             Date (optional)
sessionId:               String (index)
```

### Admin Routes
```
GET    /api/admin/qr                          list + scan counts
POST   /api/admin/qr                          create { slug, targetUrl, label }
PATCH  /api/admin/qr/[slug]                   update { targetUrl, label, isActive }
GET    /api/admin/qr/[slug]/stats             total, conversions, perDay, deviceBreak, recent
POST   /api/admin/qr/[slug]/stats/convert     { sessionId } → mark converted
```

### Conversion Tracking
`POST /api/auth/register` checks `hs_qr_session` cookie → marks matching `QRScan` as `convertedToRegistration: true`.

### Admin UI
`/admin/qr` — list with scan counts, create/edit modal, QR code preview (SVG/Canvas), PNG + SVG download.
`/admin/qr/[slug]` — metrics (total/conversions/rate), area chart (30d), device pie chart, recent scans table.

### QR Code Library
`qrcode.react` v4.x — use `QRCodeSVG` for display/SVG download, `QRCodeCanvas` for PNG download.

### Seed
```bash
pnpm tsx scripts/seed-qr.ts
```
Creates: `go` → highandseek.com, `grow` → /hub/grow, `strains` → /hub/strains
