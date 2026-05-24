# CLAUDE.md — WokeOrNot

Developer reference for working on this project. Keep this file up to date as the project evolves.

---

## ⚠️ CRITICAL WORKING RULES — READ FIRST

These rules are non-negotiable. Follow them on every task, every session.

### 1. This is a live production site
`wokeornot.net` is live and receiving real traffic behind Cloudflare + Railway. Any breakage affects real users immediately.

**Before making any change:**
- Identify what existing functionality could be affected
- Verify the change preserves desktop layout and all existing features
- If there is any doubt about breakage, stop and ask — do not guess

### 2. Every major change must be on a new branch
- **Never commit directly to `main`** for feature work, refactors, or anything non-trivial
- Create a branch: `git checkout -b <descriptive-name>`
- Keep commits clean and scoped to the task

**What counts as "major":** new features, UI changes, schema changes, middleware changes, API changes, dependency updates, layout refactors, anything touching more than 2 files.

**What can go directly on main:** typo fixes, single-line copy changes, documentation-only updates.

### 3. Never merge to `main` without explicit instruction
- Do **not** merge or push to `main` unless the user says words like "merge to main", "merge it", "push to main", or "deploy"
- Do **not** assume that "looks good" or "that works" is approval to merge
- After work on a branch is done, stop and wait for the user's explicit merge instruction

### 4. Railway auto-deploys from `main`
Pushing to `main` on GitHub immediately triggers a production deploy via Railway. There is no staging environment — merging = deploying.

### 5. Self-review every implementation before declaring it done
After finishing any implementation — before committing, and before reporting the work as complete — read back every file you created or modified in full. For each change, verify:
- **Correctness:** Does the logic actually do what it's supposed to? Check for missing `res.ok` / error checks on `fetch()` calls, off-by-one errors, wrong variable references, stale state, unhandled edge cases.
- **Type safety:** Are types correct at runtime, not just on paper? A `as SomeType` cast that hides a real mismatch is a bug.
- **No false positives:** Success messages, UI state changes, and mutations must only happen when the operation actually succeeded — not unconditionally after the request is fired.
- **No breakage to existing features:** Trace how existing code paths interact with the change. If a shared utility, API route, schema field, or component was modified, check every caller.
- **Pre-existing bugs touched by the change:** If the change sits next to or builds on broken pre-existing code, fix the pre-existing bug too — don't layer new code on top of a known defect.

Do not rely on "it compiled" or "TypeScript didn't complain" as a substitute for this review. Build success with `ignoreBuildErrors: true` means nothing. Read the code.

---

## Project Purpose

**WokeOrNot** is a community-driven platform for rating the "wokeness" of movies, TV shows, and kids content. Users rate content on a 1–10 scale, tag reviews with specific woke-aspect categories, leave comments, and participate in a community forum. The wokeness score is visualized with a color-coded bar (green = not woke, yellow = moderate, red = very woke).

Content metadata (posters, descriptions, cast) is sourced from the **TMDB API**. All user-generated ratings and reviews are stored in MongoDB.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.8 (App Router + Turbopack; hybrid: some routes in `src/pages/api/`) |
| Language | TypeScript 5.8.3 (strict mode) |
| UI | React 19, Tailwind CSS 4, Framer Motion 12, MUI 7 |
| Icons | Lucide React, React Icons |
| Forms | React Hook Form 7, Zod 3 |
| Data fetching | SWR 2 (client), Server Components (server) |
| ORM | Prisma 6 |
| Database | MongoDB (NoSQL) |
| Auth | NextAuth.js 4 (Google OAuth + credentials); JWT Bearer for mobile |
| Email | Resend API (`src/lib/mailer.ts` + `src/lib/email-templates.ts`) |
| HTTP client | Axios |
| External API | TMDB (movies, TV shows, search) |
| Analytics | Google Analytics 4 (hardcoded ID `G-C1RWGTWZ61`) + PostHog |
| Error tracking | Sentry (optional) |
| Notifications | notistack (snackbar), in-app bell (Notification model) |
| Charts | Recharts (admin analytics) |
| JWT (mobile) | jose (Edge-compatible) |
| Hosting | Railway (wokeornot.net) behind Cloudflare CDN |
| CI/CD | GitHub Actions |

**Important build notes:**
- `next.config.js` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — builds succeed even with type/lint errors
- `output: 'standalone'` is set for Railway deployment
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) applied globally in `next.config.js`
- PostHog events are proxied through `/ingest/*` rewrites in `next.config.js` to avoid ad-blocker interference

---

## Folder Structure

```
wokeornot/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (GA4, AdSense script, SessionProvider, PostHog, schema.org JSON-LD)
│   │   ├── analytics.tsx           # GA4 <Script> component (hardcoded ID G-C1RWGTWZ61)
│   │   ├── page.tsx                # Home page (hero + trending + recently rated)
│   │   ├── globals.css             # Global styles + iOS safe-area utility classes (.pb-safe, .pt-safe)
│   │   ├── robots.ts               # robots.txt (blocks /api, /admin, /favorites)
│   │   ├── sitemap.xml/route.ts    # Dynamic XML sitemap — only reviewed content; CDN-cached 24h
│   │   ├── api/                    # API routes (App Router)
│   │   │   ├── auth/               # NextAuth + register/verify/reset/forgot/resend
│   │   │   │   └── mobile/         # Mobile JWT auth: login, google, apple, me
│   │   │   ├── admin/              # Admin-only: movies, users, reviews, analytics, auditlog, forum
│   │   │   ├── content/            # Content CRUD, trending, providers, similar
│   │   │   │   └── [tmdbId]/
│   │   │   │       ├── providers/  # Streaming providers from TMDB
│   │   │   │       └── similar/    # Similar content from TMDB
│   │   │   ├── reviews/[id]/       # CRUD + reactions for content reviews
│   │   │   ├── comments/[id]/      # Comment CRUD
│   │   │   ├── favorites/          # Favorites/watchlist
│   │   │   ├── forum/[threadId]/   # Forum threads + thread comments
│   │   │   ├── notifications/      # Unread count + mark-all-read
│   │   │   ├── recently-rated/     # Recently rated content feed
│   │   │   ├── search/             # Content search + suggestions
│   │   │   ├── categories/         # Rating categories
│   │   │   ├── genres/             # Genre data
│   │   │   ├── kids/               # Kids content
│   │   │   ├── og/                 # OG image generation (satori)
│   │   │   ├── user/               # Profile: avatar, bio, email, name, password, notifications, profile/[id]
│   │   │   └── cron/cleanup/       # Daily DB cleanup (called by Railway cron service)
│   │   ├── movies/                 # Movie browse + detail pages
│   │   ├── tv-shows/               # TV show browse + detail pages
│   │   ├── kids/                   # Kids content pages
│   │   ├── favorites/              # User favorites page
│   │   ├── forum/                  # Community forum
│   │   ├── profile/                # Own user profile (edit name, avatar, bio, password)
│   │   ├── users/[id]/             # Public user profile pages
│   │   ├── search/                 # Search results
│   │   ├── register/               # Registration page
│   │   ├── admin/                  # Admin dashboard (middleware-protected)
│   │   │   ├── layout.tsx          # Admin layout with sidebar
│   │   │   ├── page.tsx            # Admin overview
│   │   │   ├── content/            # Content management
│   │   │   ├── users/              # User management
│   │   │   ├── analytics/          # Analytics dashboard (Recharts)
│   │   │   ├── moderation/         # Ban/warn users, delete reviews
│   │   │   ├── forum/              # Forum thread management
│   │   │   ├── audit-log/          # Admin action audit log viewer
│   │   │   └── maintenance/        # DB maintenance tools
│   │   └── [legal pages]/          # about, privacy, terms, contact, cookies
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── amazon-affiliate-button.tsx  # Amazon affiliate "Find on Amazon" button
│   │   │   ├── content-card.tsx    # Content card (poster, score, genres, category bars)
│   │   │   ├── mobile-rate-button.tsx       # Floating "Rate This" FAB on mobile detail pages (md:hidden)
│   │   │   ├── wokeness-bar.tsx    # Color-coded wokeness score bar
│   │   │   ├── genre-badges.tsx    # Genre tag pills
│   │   │   ├── social-share-buttons.tsx     # Share to Twitter/Facebook/copy link
│   │   │   ├── breadcrumbs.tsx     # Navigation breadcrumbs
│   │   │   ├── skip-link.tsx       # Accessibility skip-to-content link
│   │   │   ├── accessibility-announcer.tsx  # ARIA live region for SPA navigation
│   │   │   ├── trending-section.tsx
│   │   │   ├── recently-rated-section.tsx
│   │   │   ├── trending-carousel.tsx
│   │   │   ├── favorite-button.tsx
│   │   │   ├── user-stats-card.tsx
│   │   │   ├── skeleton-card.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── category-icon.tsx
│   │   ├── ads/
│   │   │   └── adsense-ad.tsx      # Google AdSense <ins> block (client component)
│   │   ├── review/                 # ReviewForm, ReviewList, ReviewCard, review tabs
│   │   ├── comment/                # Comment components
│   │   ├── forum/                  # Forum thread form + comment section
│   │   ├── auth/                   # register-form, reset-password-form, login-form, etc.
│   │   ├── admin/                  # AdminSidebar, AdminDashboardStats, RecentReviewsTable, etc.
│   │   ├── layout/                 # Navbar, Footer, NotificationBell, ClientLayout
│   │   │   ├── mobile-bottom-nav.tsx        # Fixed mobile bottom nav bar (md:hidden, 5 tabs)
│   │   │   └── client-layout.tsx            # Wraps main content; adds pb-16 md:pb-0 for bottom nav clearance
│   │   ├── analytics/              # PageViewTracker, PosthogUserIdentifier
│   │   ├── theme/                  # MUIProvider, EmotionCacheProvider
│   │   └── error-boundary.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration (providers, callbacks, session)
│   │   ├── admin-auth.ts           # Admin authorization helpers
│   │   ├── mobile-auth.ts          # JWT Bearer auth for mobile: sign/verify token, getAuthUser()
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── tmdb.ts                 # TMDB API integration (with 1-hour in-memory LRU cache, max 500 entries)
│   │   ├── validation.ts           # Zod schemas + sanitizeHTML (XSS prevention)
│   │   ├── wokeness-utils.ts       # Score colors, labels, level helpers — always use this, never hardcode
│   │   ├── rateLimit.ts            # Sliding window rate limiter (API-level)
│   │   ├── analytics.ts            # GA4 event tracking helpers
│   │   ├── posthog-server.ts       # PostHog server-side client singleton
│   │   ├── notifications.ts        # createNotification() — write in-app notifications
│   │   ├── badges.ts               # Badge award logic: checkReviewBadges, checkHelpfulBadge, etc.
│   │   ├── mailer.ts               # Resend API send helper — sendEmail() (NOT Nodemailer)
│   │   ├── email-templates.ts      # HTML email templates (verification, reset, etc.)
│   │   ├── cleanup.ts              # DB cleanup logic
│   │   ├── content-fetch.ts        # Server-side content fetch helpers
│   │   ├── http.ts                 # Shared HTTP client/fetch helpers
│   │   ├── request.ts              # Request utility helpers
│   │   ├── design-system.ts        # Design tokens/constants
│   │   ├── date-utils.ts           # Date formatting
│   │   ├── genre-map.ts            # TMDB genre ID → name mapping
│   │   ├── log.ts                  # Logging utilities
│   │   ├── useDebouncedValue.ts    # Custom debounce hook
│   │   ├── i18n/config.ts          # i18n config (scaffolded, not active)
│   │   ├── sentry-client.ts        # Sentry browser setup
│   │   └── sentry-server.ts        # Sentry server setup
│   │
│   ├── types/
│   │   └── index.ts                # All shared TypeScript types
│   │
│   ├── middleware.ts               # 3 layers: AI crawler block → IP rate limit → /admin guard
│   │
│   └── pages/api/                  # Legacy Pages Router API (hybrid coexistence)
│       ├── movies.ts
│       ├── trending.ts
│       ├── tv-shows.ts
│       └── (admin + user routes)
│
├── prisma/
│   ├── schema.prisma               # Complete DB schema (MongoDB)
│   ├── seed.ts                     # Main seed script
│   ├── seedMovies.ts               # Seed movies from TMDB
│   ├── seedGenres.ts               # Seed genre data
│   └── seedContentGenres.ts        # Seed content-genre mappings
│
├── scripts/
│   ├── makeAdmin.js                # Promote a user to ADMIN role
│   ├── cleanup-bad-reviews.js      # Remove malformed review data
│   ├── fix-content-index.js        # Fix content indexing
│   └── resetCategories.ts          # Reset rating categories
│
├── public/
│   ├── images/                     # Static images
│   └── avatars/                    # User avatar uploads
│
├── .github/workflows/
│   └── ci.yml                      # Lint + build + security audit on push/PR
│
├── docs/                           # Supplemental documentation
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Dev Commands

```bash
# Install dependencies
npm install

# Start dev server (Turbopack, http://localhost:3000)
npm run dev

# Production build (runs `prisma generate` first)
npm run build

# Start production server
npm start

# Lint
npm run lint

# Database: regenerate Prisma client (after schema changes)
npx prisma generate

# Database: visual explorer
npx prisma studio

# Seed database
npx ts-node prisma/seed.ts

# Promote user to admin
node scripts/makeAdmin.js <email>
```

---

## Environment Variables

Create a `.env` file in the project root.

### Required

```env
# MongoDB connection string
DATABASE_URL="mongodb+srv://..."

# NextAuth
NEXTAUTH_SECRET="a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"   # Set to production URL in prod

# Google OAuth (console.developers.google.com)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# TMDB API (themoviedb.org/settings/api)
TMDB_API_KEY="..."
```

### Email (required for password reset and email verification)

```env
# Resend API (https://resend.com) — the email provider used in production
RESEND_API_KEY="re_..."
EMAIL_FROM="WokeOrNot <noreply@wokeornot.net>"
```

### Optional

```env
# Google Analytics 4 — NOTE: GA4 ID G-C1RWGTWZ61 is hardcoded in src/app/analytics.tsx
# This env var is currently unused but reserved for future env-driven config
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# PostHog product analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"  # or your EU host

# Monetization: Amazon affiliate links (shows "Find on Amazon" button on detail pages)
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG="yourtag-20"

# Monetization: Google AdSense (renders ad units when set)
NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-XXXXXXXXXXXXXXXX"

# Rate limiting (set to "1" to enable, "0" to disable)
RATE_LIMIT_ENABLED="1"
RATE_LIMIT_SHADOW="0"   # Shadow mode: log but don't block

# Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Cron job authentication (sent as Authorization header by Railway cron service)
CRON_SECRET="..."
```

---

## Middleware (`src/middleware.ts`)

The middleware runs on **every request** (except static assets) and enforces three layers in order:

1. **AI crawler blocking** — Returns 403 for known AI training bots (claudebot, gptbot, ccbot, google-extended, bytespider, etc.) matched by User-Agent. Keep in sync with `public/robots.txt`.

2. **IP-based rate limiting for content pages** — Limits to **30 hits per 60 seconds** per IP on `/movies/:id`, `/tv-shows/:id`, `/kids/:id`. Threshold is 10× normal human browsing speed — targets scrapers that rotate UA strings. Responds with 429 + `Retry-After: 60`. Reads `cf-connecting-ip` header (set by Cloudflare) for the real visitor IP, falling back to `x-forwarded-for`.

3. **Admin route protection** — Checks NextAuth JWT for `role === 'ADMIN'` on all `/admin/*` paths. Non-admin users are redirected to `/`.

---

## Authentication

Handled by **NextAuth.js 4** (`src/lib/auth.ts`) for web, and JWT Bearer tokens for mobile.

### Web (NextAuth)
- **Providers:** Google OAuth + Email/Password credentials
- **Flow:** Register → email verification token sent → must verify → login
- Password reset via email token (expires 1 hour)
- Sessions: JWT strategy, 30-day expiry

### Mobile (JWT Bearer)
- `src/lib/mobile-auth.ts` handles signing/verifying 30-day JWTs with `jose` (Edge-compatible)
- Mobile API endpoints: `POST /api/auth/mobile/login`, `/google`, `/apple`, `/me`
- `getAuthUser(req)` in `mobile-auth.ts` accepts both NextAuth session cookies (web) and `Authorization: Bearer <token>` headers (mobile) — use this in any route that must serve both clients

### Authorization
- Middleware protects `/admin/*` (see above)
- Admin API routes additionally call helpers from `src/lib/admin-auth.ts`
- Roles: `USER`, `MODERATOR`, `ADMIN`

---

## Mobile UX

The site has a dedicated mobile layer built on top of the desktop layout. All mobile-only components use `md:hidden` to be invisible on desktop — **do not remove these classes**.

### Mobile Bottom Navigation (`src/components/layout/mobile-bottom-nav.tsx`)
- Fixed bottom bar with 5 tabs: Home / Movies / TV / Kids / Search
- `md:hidden` — only renders on mobile
- Uses `pb-safe` (iOS safe-area bottom inset) from `globals.css`
- Active tab shows violet color + underline indicator
- `client-layout.tsx` adds `pb-16 md:pb-0` to `<main>` so content clears the bar on mobile but is unaffected on desktop

### Floating Rate Button (`src/components/ui/mobile-rate-button.tsx`)
- Appears on scroll (>300px) on all detail pages (movies, TV, kids)
- `md:hidden` — only renders on mobile
- Tapping scrolls to `#review-section` anchor
- Position: `fixed bottom-20 right-4` (above the bottom nav bar)

### Detail Page Layout on Mobile
- On mobile, content is reordered using CSS `order` property: overview + reviews appear **above** the sidebar (so users see the content description first, not the sidebar)
- On desktop: `md:order-1` / `md:order-2` restores original sidebar-left + content-right layout
- The `#review-section` anchor div must remain on all detail pages for the floating button to work

### iOS Safe-Area
- `globals.css` defines `.pb-safe { padding-bottom: env(safe-area-inset-bottom) }` and `.pt-safe`
- These are used by `MobileBottomNav` to avoid content sitting behind the home indicator on notched iPhones

---

## API Conventions

Most API routes live in `src/app/api/` (App Router). A few legacy routes remain in `src/pages/api/` (Pages Router). Follow this pattern for App Router routes:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/mobile-auth'; // handles both web + mobile auth
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ... handler logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Always:**
- Validate input with Zod schemas from `src/lib/validation.ts`
- Sanitize user-generated HTML with `sanitizeHTML` from `src/lib/validation.ts` (XSS prevention)
- Apply rate limiting on auth and review endpoints via `src/lib/rateLimit.ts`
- Use `getAuthUser()` from `src/lib/mobile-auth.ts` for routes that need to work on both web and mobile
- Check session/role before any write operations

---

## Monetization

### Amazon Affiliate Links
- `src/components/ui/amazon-affiliate-button.tsx` — renders an orange "Find on Amazon" button that searches Amazon Prime Video for the content title
- Requires `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` env var; renders nothing if unset
- Used on movie/TV/kids detail pages

### Google AdSense
- `src/components/ads/adsense-ad.tsx` — client component that renders an `<ins class="adsbygoogle">` block for a given ad slot
- The AdSense script is loaded once globally in `src/app/layout.tsx` (conditionally on `NEXT_PUBLIC_ADSENSE_CLIENT`)
- Renders nothing if `NEXT_PUBLIC_ADSENSE_CLIENT` is unset (safe to include without the env var)

---

## SEO & Sitemap

- **`src/app/robots.ts`** — generates `robots.txt`; blocks `/api/`, `/admin/`, `/favorites/`
- **`src/app/sitemap.xml/route.ts`** — dynamic XML sitemap
  - Only indexes content with `reviewCount > 0` to prevent crawlers from hitting thousands of empty pages (controls server cost)
  - CDN-cached for 24 hours via `Cache-Control: s-maxage=86400`
  - Static pages + all reviewed content pages with accurate `lastmod` dates
- **OG images** — `/api/og` generates dynamic Open Graph images
- **Schema.org JSON-LD** — Organization schema injected in root `layout.tsx`
- **Full metadata** in `layout.tsx`: title template, description, keywords, Open Graph, Twitter card, canonical URL, Google site verification

---

## Notifications & Badges

### In-App Notifications
- `src/lib/notifications.ts` — `createNotification({ userId, type, message, link })` writes to the `Notification` model
- `src/components/layout/notification-bell.tsx` — navbar bell icon with unread count badge, fetched via SWR
- API: `GET /api/notifications` (list + unread count), `PATCH /api/user/notifications` (mark read)

### User Badges / Achievements
- `src/lib/badges.ts` — defines 5 badge types and award logic:
  - `FIRST_REVIEW`, `TEN_REVIEWS`, `FIFTY_REVIEWS` — triggered on review submit
  - `FIRST_COMMENT` — triggered on comment submit
  - `HELPFUL_REVIEWER` — triggered when a user's reviews receive 10+ likes
- `checkReviewBadges(userId)`, `checkCommentBadges(userId)`, `checkHelpfulBadge(reviewAuthorId)` — call these after the relevant write operations
- `BadgeDisplay` component shows earned badges on user profile pages

---

## Database

**MongoDB** via **Prisma ORM**. The connection string must point to a MongoDB instance (Atlas recommended for production).

### Key Models

| Model | Purpose |
|---|---|
| `User` | Auth, roles (USER/MODERATOR/ADMIN), ban status, bio, email notification opt-in |
| `Account` / `Session` | NextAuth adapter tables |
| `Content` | Movies, TV shows, kids content (linked to TMDB ID, tracks `reviewCount`) |
| `Review` | User rating (1–10), optional text, optional `guestName` (guest reviews supported) |
| `Category` | Wokeness aspect categories (e.g., political, environmental) |
| `ReviewCategory` | Junction: which categories a review tagged |
| `CategoryScore` | Aggregated category scores per content item |
| `Comment` | Threaded comments on content; supports soft-delete (`isDeleted`) |
| `Genre` / `ContentGenre` | Genre data and explicit many-to-many mapping |
| `ReviewReaction` | Like/dislike on reviews (one reaction per user per review) |
| `Favorite` | User watchlist entries |
| `ForumThread` | Community discussion threads |
| `AuditLog` | Admin action history (bans, deletions, warnings) |
| `Notification` | In-app notifications (type, message, link, read status) |
| `Badge` | Badge definitions (key, name, description, icon) |
| `UserBadge` | Junction: which users have earned which badges |
| `VerificationToken` | Email verification tokens |
| `PasswordResetToken` | Password reset tokens |

After changing `prisma/schema.prisma`, always run `npx prisma generate` (and migrate if changing structure).

---

## Coding Conventions

### Naming
- **Components**: PascalCase — `ReviewCard.tsx`, `AdminSidebar.tsx`
- **Utilities/hooks**: camelCase — `wokeness-utils.ts`, `useReviews.ts`
- **Files (non-component)**: kebab-case — `admin-auth.ts`, `date-utils.ts`
- **Constants**: UPPER_SNAKE_CASE — `TMDB_BASE_URL`

### TypeScript
- Strict mode is enabled — avoid `any`
- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Shared types live in `src/types/index.ts`
- NextAuth session type is extended in `src/types/` to include `role` and `id`

### Components
- Use Server Components for data fetching where possible
- Use `'use client'` only when interactivity is needed (forms, hooks, animations)
- SWR for client-side data fetching with caching

### Styling
- Tailwind CSS utility classes — no separate CSS modules unless truly necessary
- Design tokens/constants in `src/lib/design-system.ts`
- Wokeness score colors and labels always go through `src/lib/wokeness-utils.ts` — never hardcode them
- Mobile-first: use `md:` breakpoint to restore desktop values when overriding for mobile

---

## Admin System

The admin dashboard is at `/admin` (middleware-protected, ADMIN role only).

**Features:**
- Content management — browse, search, delete content
- User management — view users
- Moderation — ban, warn users; delete reviews; view flagged users
- Analytics dashboard — signups, reviews, content metrics (Recharts)
- Forum management — view and delete forum threads
- Audit log viewer — paginated history of all admin actions
- Maintenance tools — cleanup, re-indexing

**To create the first admin user:**
```bash
node scripts/makeAdmin.js user@example.com
```

---

## Deployment

**Production:** Railway at `wokeornot.net`, behind Cloudflare CDN

**Infrastructure:**
- **Railway** — hosts the Next.js app (Railpack builder, Node 22, us-east4 region)
- **Railway cron service** — separate `cron-cleanup` service runs `/api/cron/cleanup` daily at `2:00 AM UTC`
- **Cloudflare** — DNS, DDoS protection, Bot Fight Mode, WAF rate limiting
- **Resend** — transactional email API (sending domain: `wokeornot.net`)

**Deploys:** Railway auto-deploys from the `main` branch on GitHub push. **Pushing to `main` = immediate production deploy.** No manual step needed.

**GitHub Actions:**
- `ci.yml` — runs on push/PR to `main`, `develop`, `fix/*` branches
  - ESLint (non-blocking)
  - `npm run build` (uploads `.next` artifact)
  - Security audit (`npm audit` + Trivy)

**Image domains allowed** (`next.config.js`):
- `image.tmdb.org` — movie/show posters
- `lh3.googleusercontent.com` — Google profile pictures

---

## Known Pre-existing Issues (not bugs to fix)

These issues exist in the codebase but are pre-existing and unrelated to any recent changes. Do not spend time investigating them unless explicitly asked.

| Issue | Notes |
|---|---|
| `[TMDB] TMDB_API_KEY is not set` console error | `TMDB_API_KEY` has no `NEXT_PUBLIC_` prefix so it's undefined when `tmdb.ts` is imported by a client component (`client-content-card.tsx`). Server-side TMDB calls work correctly. Pre-existing. |
| Build error on `/api/auth/forgot` | Resend API key not available during local build; identical on `main`. Does not affect production where the env var is set. Pre-existing. |

---

## Testing

No tests are currently implemented. The CI pipeline has a test placeholder (`npm test`) that will need a test runner (Jest or Vitest) added when tests are introduced.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth config: providers, callbacks, session shape |
| `src/lib/mobile-auth.ts` | Mobile JWT auth + `getAuthUser()` for web+mobile unified auth |
| `src/middleware.ts` | 3-layer guard: AI crawler block → IP rate limit → /admin RBAC |
| `src/lib/prisma.ts` | Prisma client singleton (import from here, never instantiate directly) |
| `src/lib/tmdb.ts` | All TMDB API calls (movies, shows, search, detail, providers) with 1h LRU cache (max 500 entries — **do not remove the cap**, it prevents OOM crashes) |
| `src/lib/validation.ts` | Zod schemas + `sanitizeHTML` for XSS prevention |
| `src/lib/wokeness-utils.ts` | Score → color/label/level helpers |
| `src/lib/rateLimit.ts` | Sliding window rate limiter (API-level, separate from middleware rate limit); prunes expired entries at >5k to prevent unbounded memory growth |
| `src/lib/notifications.ts` | Write in-app notifications |
| `src/lib/badges.ts` | Badge award logic — call after reviews/comments/reactions |
| `src/lib/mailer.ts` | Resend API send helper (`sendEmail()`) — NOT Nodemailer |
| `src/lib/email-templates.ts` | HTML email templates |
| `src/lib/posthog-server.ts` | PostHog server-side client singleton |
| `src/lib/analytics.ts` | GA4 event tracking helpers |
| `src/components/ui/amazon-affiliate-button.tsx` | Amazon affiliate CTA (requires env var) |
| `src/components/ui/mobile-rate-button.tsx` | Floating mobile "Rate This" FAB (md:hidden) |
| `src/components/layout/mobile-bottom-nav.tsx` | Mobile bottom nav bar (md:hidden) |
| `src/components/layout/client-layout.tsx` | Root client layout — adds pb-16 md:pb-0 for mobile nav |
| `src/components/ads/adsense-ad.tsx` | Google AdSense ad unit (requires env var) |
| `src/app/sitemap.xml/route.ts` | Dynamic XML sitemap (reviewed content only, CDN-cached) |
| `src/app/robots.ts` | robots.txt generation |
| `src/types/index.ts` | All shared TypeScript types |
| `prisma/schema.prisma` | Complete DB schema |
| `src/app/layout.tsx` | Root layout: GA4, AdSense, PostHog, schema.org, SessionProvider |
| `src/app/admin/layout.tsx` | Admin layout with sidebar navigation |
| `next.config.js` | Image domains, security headers, PostHog proxy rewrites, performance settings |
| `.github/workflows/ci.yml` | CI: lint, build, security audit |
