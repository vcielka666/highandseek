@AGENTS.md

# High & Seek — Project Context

**Domain:** highandseeek.com (three e's, `highandseeek` in package.json)
**Concept:** Cannabis ecosystem — Shop (CBD e-commerce) + Hub (community + AI + gamification).

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
| Charts | Recharts | — |
| Icons | lucide-react | — |
| Forms | react-hook-form + @hookform/resolvers | — |
| Package manager | **pnpm** (not npm/yarn) | — |

**Dev server port:** 3001 (`next dev -p 3001`)

---

## Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-hs-black` | `#050508` | Background |
| `--color-hs-teal` | `#00d4c8` | Shop / primary CTA |
| `--color-hs-teal-dim` | `#007a74` | Muted teal |
| `--color-hs-magenta` | `#cc00aa` | Hub / secondary CTA |
| `--color-hs-purple` | `#8844cc` | Accent |
| `--color-hs-amber` | `#f0a830` | XP, badges, admin |
| `--color-hs-amber-dim` | `#8a5e1a` | Muted amber |
| `--color-hs-navy` | `#0a2428` | Deep background |
| `--color-hs-white` | `#e8f0ef` | Primary text |
| `--color-hs-muted` | `#4a6066` | Labels, icons |

### Fonts

| Variable | Source | Usage |
|---|---|---|
| `var(--font-cacha)` | `public/fonts/Cacha.otf` (local) | Emphasis/brand only — hero, logo, CTAs |
| `var(--font-orbitron)` | Google | Tech headings, usernames, XP |
| `var(--font-dm-sans)` | Google | Body, inputs |
| `var(--font-dm-mono)` | Google | Labels, tags, toasts |

### Visual Style
- Dark `#050508` bg with scanline overlay (`body::after`)
- Shop = teal, Hub = magenta, Admin = amber
- Animations: `fadeUp`, `glitch`, `gridMove`, `glowPulse` (in `globals.css`)
- Borders: `0.5px solid rgba(color, 0.15–0.25)`, radius: `4px` inputs, `8px` cards
- shadcn/ui: override colors with inline `style` props (not Tailwind — oklch tokens conflict)

---

## Database Models

| Model | File | Key fields |
|---|---|---|
| User | `lib/db/models/User.ts` | email, passwordHash, username, role, xp, level, avatar, followersCount, followingCount, postsCount |
| Strain | `lib/db/models/Strain.ts` | slug, name, type, genetics, floweringTime, difficulty, personality, visuals, stats, shopProductSlug |
| AvatarState | `lib/db/models/AvatarState.ts` | userId, strainSlug, level, xp, needs{hydration,nutrients,energy,happiness}, status, cooldowns, careHistory |
| StrainChat | `lib/db/models/StrainChat.ts` | userId, strainSlug, messages[{role,content,timestamp}], xpEarned |
| VirtualGrow | `lib/db/models/VirtualGrow.ts` | userId, strainSlug, setup{tentSize,lightType,medium,potSize,...}, timeMode, stage, health, attributes, actions, journalEntries, harvestData, status |
| GrowEquipment | `lib/db/models/GrowEquipment.ts` | name, slug, brand, specs, category, compatibleMedia, prices{czk,usd}, imageUrl, isGenerated, isActive |
| Post | `lib/db/models/Post.ts` | userId, type, content{text,mediaUrl,mediaType}, growUpdate, tags, likes, dislikes, likesCount, commentsCount, isPublic, isDeleted |
| Comment | `lib/db/models/Comment.ts` | postId, userId, text(max 300), likes, likesCount, isDeleted |
| Listing | `lib/db/models/Listing.ts` | userId, title, description, category, price, contact{telegram,signal,threema}, images, status, expiresAt |
| ErrorLog | `lib/db/models/ErrorLog.ts` | message, stack, route, userId, severity, action, createdAt |
| QRRedirect | `lib/db/models/QRRedirect.ts` | slug, targetUrl, label, isActive |
| QRScan | (same file) | slug, sessionId, ip, device, convertedToRegistration |

---

## File Structure

```
app/
  layout.tsx                    # Root layout — fonts, SessionProvider, ToastProvider
  globals.css                   # Tailwind v4 + @theme inline tokens + animations
  page.tsx                      # Landing page
  shop/                         # Shop (public, teal)
  hub/
    page.tsx                    # Hub bento grid (protected)
    grow/                       # Grow simulator
    feed/                       # Social feed
    marketplace/                # P2P marketplace
    profile/[username]/         # User profiles
  admin/                        # Admin panel (amber accent, role=admin only)
  auth/login/, auth/register/
  go/, go/[slug]/               # QR redirect system
  api/
    auth/                       # Auth.js + register
    hub/                        # grow, strains, feed, posts, comments, marketplace, users
    admin/                      # orders, products, users, strains, qr, overview, analytics
    shop/                       # cart, checkout, webhook

components/
  layout/                       # Navbar, HeroSection, HeroGrid(server), PillarsSection, Footer
  hub/
    cards/                      # FeedCard, GrowCard, StrainCard, etc.
    feed/                       # PostCard, CreatePost
    FollowButton.tsx
  admin/                        # MetricCard, StatusBadge, AdminPageHeader
  providers/                    # SessionProvider, ToastProvider
  ui/                           # shadcn components

lib/
  auth/config.ts                # NextAuth — Credentials provider, JWT, session shape
  db/connect.ts                 # MongoDB singleton
  db/models/                    # All Mongoose models
  grow/                         # tentLayout.ts, attributes.ts, simulation.ts, PlantSVG.tsx
  avatar/decay.ts               # Strain avatar need decay (pure, time-based)
  i18n/translations.ts          # EN + CS strings
  notifications/telegram.ts     # Telegram notify helpers
  xp/utils.ts                   # XP award helper

stores/languageStore.ts         # Zustand — locale persisted, t derived fresh
proxy.ts                        # Route protection (Next.js 16)
scripts/                        # make-admin, seed-strains, seed-grow-equipment, seed-qr
```

---

## Key Rules

1. **ALL user-facing text through i18n** — EN + CS in `lib/i18n/translations.ts`. Use `useLanguage()` (client) / `getServerT()` (server). No hardcoded strings. No Slovak.
2. **No `any` in TypeScript** — use proper types or Zod inference.
3. **pnpm only** — `npm install` fails (peer dep conflicts).
4. **`proxy.ts` not `middleware.ts`** — Next.js 16 convention.
5. **Tailwind v4** — no `tailwind.config.js`, all config in `globals.css` via `@theme inline`.
6. **`||` not `??` for AUTH_SECRET** — empty string must be falsy.
7. **Zustand persist: `partialize`** — only persist `locale`, never `t`.
8. **Fonts via CSS variables** — `fontFamily: 'var(--font-cacha)'`, never hardcode names.
9. **`useSearchParams` requires Suspense** — inner component reads params, outer wraps in `<Suspense>`.
10. **shadcn colors: inline `style` props** — Tailwind classes conflict with oklch tokens.
11. **Admin accent = amber** — never teal/magenta as primary in `/admin/*`.
12. **Telegram failure must never block user flows** — always try/catch, never throw.
13. **Journal/feed photos: EXIF strip** — `sharp(buffer).rotate().toBuffer()` before Cloudinary upload.
14. **Grow tent SVG** — `viewBox="0 0 1000 750"`, all positions in SVG units. `lib/grow/tentLayout.ts` is single source of truth.
15. **Database: `highandseeek_db` only** — never `seekers`, `test`, or `admin`.
16. **Never cross-query between `highandseeek_db` and `seekers_db`.**

---

## Authentication

- JWT strategy, Credentials provider (email + password), bcryptjs 12 rounds
- `AUTH_SECRET || NEXTAUTH_SECRET` (handles empty string)
- Protected: `/hub/*` → `/auth/login?callbackUrl=...`, `/admin/*` → admin role required
- Session: `id`, `email`, `username`, `role`, `xp`, `level`

---

## Environment Variables

```
MONGODB_URL=mongodb+srv://...@cluster0.zxa57.mongodb.net/highandseeek_db
AUTH_SECRET=<32-byte base64>
NEXTAUTH_SECRET=<same>
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
MYSTERY_BOX_PASSWORD_HASH=   # bcrypt hash only, never plaintext
CLOUDINARY_*
STRIPE_*
RESEND_API_KEY=
```

---

## Deployment

- **Server:** DigitalOcean VPS, 138.68.74.105, Ubuntu 24.04
- **Path:** `/var/www/highandseek`, port 3001
- **Process:** PM2 (`highandseek`), Nginx reverse proxy
- **Node options:** `NODE_OPTIONS="--max-old-space-size=1536"` (1 GB RAM)
- **Build:** `NODE_OPTIONS="--max-old-space-size=1536" pnpm build`
- **Restart:** `pm2 restart highandseek --update-env`
- **Logs:** `pm2 logs highandseek`
- **Domains:** highandseek.com, highandseek.cz — DNS not yet configured (A → 138.68.74.105)
- **`next.config.ts`:** `typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true }`
- **`AUTH_URL`:** `http://138.68.74.105` (update to https once SSL configured)
- Leading spaces in `.env.local` silently break vars — verify with `grep AUTH .env.local`

---

## What's Built

| Feature | Route | Status |
|---|---|---|
| Auth (login/register) | `/auth/*` | ✅ |
| Landing page | `/` | ✅ |
| Hub bento grid | `/hub` | ✅ |
| Admin panel | `/admin/*` | ✅ Full CRUD — orders, products, users, hub stats, analytics, system, QR |
| Grow simulator | `/hub/grow` | ✅ Setup wizard, tent SVG, care actions, journal, harvest |
| AI strain avatars | `/hub/strains` | ✅ Care system, chat (Claude Haiku), decay, 7 strains seeded |
| Marketplace | `/hub/marketplace` | ✅ Browse, create, extend, mark sold |
| Social feed | `/hub/feed` | ✅ Posts, comments, likes, follow/unfollow, media upload |
| QR redirect system | `/go/[slug]` | ✅ Scan tracking, conversion, admin UI |
| Telegram notifications | — | ✅ Order inquiry + confirmation |
| Grow equipment DB | — | ✅ 82 products (22 real prices, 60 estimated) |
| Shop (e-commerce) | `/shop` | 🚧 Placeholder |
| Seekers integration | — | ⏳ Future |
| AI forum bridge | — | ⏳ Future |

### Grow Simulator — Key Details
- SVG tent: `viewBox="0 0 1000 750"`, all coords in `lib/grow/tentLayout.ts`
- First grow free (realtime), subsequent: 3 credits; accelerated = 10x, no NFT cert
- Stages: seedling (d1–7) → veg (d8–35) → flower → harvest
- Medium rules: living_soil→organic only, coco→mineral required, hydro→mineral+drip
- Cloudinary assets IDs in `tentLayout.ts` (EQUIP_IMGS)

### AI Strain Avatar — Key Details
- Decay: `lib/avatar/decay.ts` — pure time-based, hydration −1/h, happiness −2/h if no chat 48h+
- 10 levels: Seedling(0)→Legendary(2500); cooldowns: water 8h, feed 24h, light 12h, flush 72h
- XP multiplier by status: thriving 1.5×, wilting 0.3×

### Social Feed — Key Details
- Cursor-based pagination; fallback to popular 7d if no follows
- Media: EXIF stripped, webp 1080px, Cloudinary `highandseeek/feed/photos`
- XP: POST_TEXT 10, POST_PHOTO 20, POST_LIKED 3 (to owner), POST_COMMENT 5

### Admin Panel
- Sidebar: 240px desktop, 48px icon-only mobile
- `scripts/make-admin.ts <email>` to grant admin role
- All destructive actions logged to ErrorLog
