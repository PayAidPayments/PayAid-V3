# Complete Monolith Migration: apps/dashboard as Single Entry (Option A)

**Commit:** `complete-monolith-migration-dashboard-entry`

## What was done

1. **Entry in apps/dashboard**
   - `app/(landing)/page.tsx` → `/` (marketing/landing, re-exports `@/components/landing/LandingPage`)
   - `app/(auth)/login/page.tsx` → `/login`
   - `app/(auth)/signup/page.tsx` → `/signup`
   - `app/dashboard/` → post-login shell (existing in apps/dashboard)

2. **Modules mounted in apps/dashboard**
   - `app/crm/` from `apps/crm/app/crm/`
   - `app/hr/` from `apps/hr/app/hr/`
   - `app/voice-agents/` and other routes from root `app/` (copied)

3. **Root app routes and API**
   - Root `app/` contents (api, home, finance, etc.) copied into `apps/dashboard/app/` (excluding dashboard, login, signup, landing to avoid overwriting).
   - Root `app/` moved to `deprecated/app/` (or partially; see repo state).

4. **Config**
   - `apps/dashboard`: dev/start on **port 3000** (`package.json`).
   - Root `package.json`: `"dev": "npm run dev -w dashboard"`, `"dev:all": "npx concurrently ... turbo dev --filter=dashboard ... dev:websocket"`.

## Verification

```bash
# Single app only
node node_modules/turbo/bin/turbo run dev --dry-run --filter=dashboard

# Full local (app + websocket)
npm run dev:all

# Expected: localhost:3000 — landing, /login, /signup, /dashboard, /crm/[tenantId]/..., /hr/...
```

## Deploy

```bash
npm run deploy:dashboard   # vercel --prod --cwd apps/dashboard
```

**No root Next.js app.** Single entry: `apps/dashboard` on port 3000.
