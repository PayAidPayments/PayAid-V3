# Deploy CRM to Vercel

## Why from repo root

The CRM app (`apps/crm`) depends on the workspace package `@payaid/db`. Vercel must run **from the monorepo root** so `pnpm install` and `pnpm --filter crm run build` can resolve workspace dependencies. Deploying only from `apps/crm` causes `npm install` to fail on `workspace:*` deps.

## Steps

1. **One-time: set Root Directory** (fixes "No Next.js version detected"):
   - **Vercel Dashboard** → [your **crm** project](https://vercel.com/payaid-projects-a67c6b27/crm) → **Settings** → **General**
   - Click **Edit** next to **Root Directory**
   - Set to **`apps/crm`** and save  
   (Vercel then detects Next.js from `apps/crm/package.json` and still runs install/build from repo root.)

2. **From monorepo root** (`payaid-v3-scratch`):
   ```bash
   pnpm deploy:crm
   ```
   If Vercel asks to set up/link, choose the existing **crm** project so the full repo is used.

3. **Override build so Turbo doesn’t take over** (fixes `turbo run build` failing):
   - **Vercel Dashboard** → **crm** → **Settings** → **Build & Development**
   - Set **Build Command** to: **`pnpm --filter crm run build`** (no `cd ../..` — install/build already run from repo root.)
   - (Optional) **Install Command:** `pnpm install`  
   When Turbo is detected, Vercel replaces your build command with `turbo run build`. Setting Build Command in the dashboard forces the CRM-only build.

4. **Environment variables** (Settings → Environment Variables):
   - For **Production** (and Preview if needed), set:
     - `DATABASE_URL`
     - `REDIS_URL`
   - Do not rely on “development” env only; production was overwritten when pulling env to `.env.local`.

## After first deploy from root

- `.vercel` will live at **repo root** (not in `apps/crm`). Keep it there so future `pnpm deploy:crm` runs from root and sends the full monorepo.
