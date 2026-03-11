# Deploy CRM to Vercel (Hobby)

## One-time: Enable monorepo context

The CRM app depends on `packages/db` (Prisma). So Vercel must see the full repo, not only `apps/crm`.

1. Open [Vercel Dashboard](https://vercel.com) → your **crm** project → **Settings** → **General**.
2. Under **Root Directory**, ensure it is `apps/crm`.
3. Turn **on** **“Include source files outside of the Root Directory”** (so the build can access `../../packages/db` for Prisma schema).

Then from repo root:

```bash
npm run deploy:crm
```

## Env vars

In the same project **Settings** → **Environment Variables**, set at least:

- `DATABASE_URL` (Postgres, e.g. Supabase or Neon)
- `NEXTAUTH_SECRET` or your auth secret
- Any other vars your CRM app reads from `process.env`

## Live URL

After a successful deploy:

- **Production:** `https://crm-xxx.vercel.app` (or your custom domain)
- **Demo tenant:** `https://crm-xxx.vercel.app/crm/demo-business-pvt-ltd/dashboard`

## Optional: Deploy from repo root (turbo)

Alternatively, use one Vercel project per app with **Root Directory** = *(empty, repo root)*:

- **Build Command:** `turbo build --filter=crm`
- **Output Directory:** `apps/crm/.next`
- **Install Command:** `npm install`

Then run `vercel --prod` from the repo root (no `--cwd apps/crm`).
