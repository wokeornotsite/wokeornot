# CLAUDE.md — WokeOrNot

Developer reference for working on this project. Keep this file up to date as the project evolves.

---

## Project Purpose

**WokeOrNot** is a community-driven platform for rating the "wokeness" of movies, TV shows, and kids content. Users rate content on a 1–10 scale, tag reviews with specific woke-aspect categories, leave comments, and participate in a community forum. The wokeness score is visualized with a color-coded bar (green = not woke, yellow = moderate, red = very woke).

Content metadata (posters, descriptions, cast) is sourced from the **TMDB API**. All user-generated ratings and reviews are stored in MongoDB.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.8 (App Router, Turbopack) |
| Language | TypeScript 5.8.3 (strict mode) |
| UI | React 19, Tailwind CSS 4, Framer Motion 12, MUI 7 |
| Icons | Lucide React, React Icons |
| Forms | React Hook Form 7, Zod 3 |
| Data fetching | SWR 2 (client), Server Components (server) |
| ORM | Prisma 6 |
| Database | MongoDB (NoSQL) |
| Auth | NextAuth.js 4 (Google OAuth + credentials) |
| Email | Nodemailer |
| HTTP client | Axios |
| External API | TMDB (movies, TV shows, search) |
| Analytics | Google Analytics 4 |
| Error tracking | Sentry (optional) |
| Hosting | Vercel (wokeornot.net) |
| CI/CD | GitHub Actions |

**Important build notes:**
- `next.config.js` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — builds succeed even with type/lint errors
- `output: 'standalone'` is set for Vercel deployment

---

## Folder Structure

```
wokeornot/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (Navbar, Footer, SessionProvider)
│   │   ├── page.tsx                # Home page (hero + trending)
│   │   ├── globals.css             # Global styles
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # NextAuth + register/verify/reset/forgot
│   │   │   ├── admin/              # Admin-only: movies, users, reviews, analytics, auditlog
│   │   │   ├── reviews/[id]/       # CRUD + reactions for content reviews
│   │   │   ├── comments/[id]/      # Comment CRUD
│   │   │   ├── favorites/          # Favorites/watchlist
│   │   │   ├── forum/              # Forum threads
│   │   │   ├── search/             # Content search
│   │   │   ├── categories/         # Rating categories
│   │   │   ├── genres/             # Genre data
│   │   │   ├── kids/               # Kids content
│   │   │   ├── user/               # Profile: avatar, email, name, password
│   │   │   └── cron/cleanup/       # Daily DB cleanup (called by Vercel cron)
│   │   ├── movies/                 # Movie browse + detail pages
│   │   ├── tv-shows/               # TV show browse + detail pages
│   │   ├── kids/                   # Kids content pages
│   │   ├── favorites/              # User favorites page
│   │   ├── forum/                  # Community forum
│   │   ├── profile/                # User profile
│   │   ├── search/                 # Search results
│   │   ├── admin/                  # Admin dashboard (middleware-protected)
│   │   │   ├── layout.tsx          # Admin layout with sidebar
│   │   │   ├── page.tsx            # Admin overview
│   │   │   ├── content/            # Content management
│   │   │   ├── users/              # User moderation
│   │   │   ├── analytics/          # Analytics dashboard
│   │   │   ├── moderation/         # Moderation panel
│   │   │   └── maintenance/        # DB maintenance tools
│   │   └── [legal pages]/          # about, privacy, terms, contact, cookies
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI: content-card, wokeness-bar, genre-badges, etc.
│   │   ├── review/                 # ReviewForm, ReviewList, ReviewCard
│   │   ├── comment/                # Comment components
│   │   ├── auth/                   # register-form, reset-password-form, verification-notice
│   │   ├── admin/                  # AdminSidebar and admin-specific components
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── analytics/              # AnalyticsCharts
│   │   └── error-boundary.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration (providers, callbacks, session)
│   │   ├── admin-auth.ts           # Admin authorization helpers
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── tmdb.ts                 # TMDB API integration
│   │   ├── validation.ts           # Zod schemas + sanitizeHTML (XSS prevention)
│   │   ├── wokeness-utils.ts       # Score colors, labels, level helpers
│   │   ├── rateLimit.ts            # Sliding window rate limiter
│   │   ├── analytics.ts            # GA4 event tracking helpers
│   │   ├── cleanup.ts              # DB cleanup logic
│   │   ├── design-system.ts        # Design tokens/constants
│   │   ├── date-utils.ts           # Date formatting
│   │   ├── genre-map.ts            # TMDB genre ID → name mapping
│   │   ├── log.ts                  # Logging utilities
│   │   ├── sentry-client.ts        # Sentry browser setup
│   │   └── sentry-server.ts        # Sentry server setup
│   │
│   ├── types/
│   │   └── index.ts                # All shared TypeScript types
│   │
│   └── middleware.ts               # Protects /admin — redirects non-ADMIN users to /
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
│   ├── ci.yml                      # Lint + build + security audit on push/PR
│   └── deploy.yml                  # Deploy to Vercel on main branch push
│
├── docs/                           # Supplemental documentation
│   ├── CI_CD.md
│   ├── SENTRY_SETUP.md
│   ├── I18N_SETUP.md
│   └── ENOENT_error.md
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                     # Vercel cron job config
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

# Database: apply schema changes
npx prisma migrate dev --name <migration-name>

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
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your@email.com"
EMAIL_PASS="your-password"
```

### Optional

```env
# Google Analytics 4
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Rate limiting (set to "1" to enable, "0" to disable)
RATE_LIMIT_ENABLED="1"
RATE_LIMIT_SHADOW="0"   # Shadow mode: log but don't block

# Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Cron job authentication (sent as Authorization header by Vercel)
CRON_SECRET="..."
```

---

## Database

**MongoDB** via **Prisma ORM**. The connection string must point to a MongoDB instance (Atlas recommended for production).

### Key Models

| Model | Purpose |
|---|---|
| `User` | Auth, roles (USER/MODERATOR/ADMIN), email verification |
| `Account` / `Session` | NextAuth adapter tables |
| `Content` | Movies, TV shows, kids content (linked to TMDB ID) |
| `Review` | User rating (1–10) with optional text and guest name |
| `Category` | Wokeness aspect categories (e.g., political, environmental) |
| `ReviewCategory` | Junction: which categories a review tagged |
| `CategoryScore` | Aggregated category scores per content item |
| `Comment` | Threaded comments on content and forums |
| `Genre` / `ContentGenre` | Genre data and many-to-many mapping |
| `ReviewReaction` | Like/dislike on reviews |
| `Favorite` | User watchlist entries |
| `ForumThread` | Community discussion threads |
| `AuditLog` | Admin action history (bans, deletions, warnings) |
| `VerificationToken` | Email verification tokens |
| `PasswordResetToken` | Password reset tokens |

After changing `prisma/schema.prisma`, always run `npx prisma generate` (and `migrate dev` if changing the schema structure).

---

## Authentication

Handled by **NextAuth.js 4** (`src/lib/auth.ts`).

### Providers
1. **Google OAuth** — Third-party sign-in
2. **Credentials** — Email + bcrypt-hashed password

### Flow
- Register → email verification token sent → user must verify before logging in
- Password reset via email token (expires in 1 hour)
- Sessions use JWT, 30-day expiry

### Authorization
- **Middleware** (`src/middleware.ts`) protects all `/admin/*` routes — redirects non-ADMIN users to `/`
- Admin API routes additionally call helpers from `src/lib/admin-auth.ts`
- Roles: `USER`, `MODERATOR`, `ADMIN`

---

## API Conventions

All API routes live in `src/app/api/`. Follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
- Check session/role before any write operations

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

---

## Admin System

The admin dashboard is at `/admin` (middleware-protected, ADMIN role only).

**Features:**
- Content management — browse, search, delete content
- User moderation — ban, warn, view user activity
- Review management — view, delete reviews
- Analytics dashboard — signups, reviews, content metrics
- Audit log — all admin actions are logged to `AuditLog` model
- Maintenance tools — cleanup, re-indexing

**To create the first admin user:**
```bash
node scripts/makeAdmin.js user@example.com
```

---

## Deployment

**Production:** Vercel at `wokeornot.net`

**Vercel config** (`vercel.json`):
- Cron job: `/api/cron/cleanup` runs daily at `2:00 AM UTC`

**GitHub Actions:**
- `ci.yml` — runs on push/PR to `main`, `develop`, `fix/*` branches
  - ESLint (non-blocking)
  - `npm run build` (uploads `.next` artifact)
  - Security audit (`npm audit` + Trivy)
- `deploy.yml` — deploys to Vercel on push to `main`

**Image domains allowed** (`next.config.js`):
- `image.tmdb.org` — movie/show posters
- `lh3.googleusercontent.com` — Google profile pictures

---

## Testing

No tests are currently implemented. The CI pipeline has a test placeholder (`npm test`) that will need a test runner (Jest or Vitest) added when tests are introduced.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth config: providers, callbacks, session shape |
| `src/middleware.ts` | Route guard: redirects non-ADMIN from `/admin` |
| `src/lib/prisma.ts` | Prisma client singleton (import from here, never instantiate directly) |
| `src/lib/tmdb.ts` | All TMDB API calls (movies, shows, search, detail) |
| `src/lib/validation.ts` | Zod schemas + `sanitizeHTML` for XSS prevention |
| `src/lib/wokeness-utils.ts` | Score → color/label/level helpers |
| `src/lib/rateLimit.ts` | Sliding window rate limiter |
| `src/types/index.ts` | All shared TypeScript types |
| `prisma/schema.prisma` | Complete DB schema |
| `src/app/layout.tsx` | Root layout: SessionProvider, Navbar, Footer |
| `src/app/admin/layout.tsx` | Admin layout with sidebar navigation |
| `vercel.json` | Vercel cron job configuration |
| `next.config.js` | Image domains, standalone output, performance settings |
| `.github/workflows/ci.yml` | CI: lint, build, security audit |
| `.github/workflows/deploy.yml` | CD: deploy to Vercel on main push |
