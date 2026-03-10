# Phase 7 – Deploys – Complete

## Summary

Phase 7 enables production-grade builds (TypeScript and ESLint enforced in all apps) and adds a reference Vercel config for Hobby multi-app. **Recommended:** deploy each app as a separate Vercel project with Root Directory set.

---

## 1. Build strictness (apps/*)

All four apps now enforce type and lint on build:

- **apps/crm/next.config.mjs**
- **apps/hr/next.config.mjs**
- **apps/voice/next.config.mjs**
- **apps/dashboard/next.config.mjs**

Added:

- **`typescript: { ignoreBuildErrors: false }`**
- **`eslint: { ignoreDuringBuilds: false }`**

So production builds fail on TS or ESLint errors.

---

## 2. Vercel (Hobby multi-app)

**Recommended: separate project per app**

- **CRM:** New Project → Git → Root Directory: **`apps/crm`** → Deploy.  
  Or CLI: **`vercel --prod --cwd apps/crm`**
- **HR:** Root Directory: **`apps/hr`** (or `vercel --prod --cwd apps/hr`)
- **Voice:** Root Directory: **`apps/voice`**
- **Dashboard:** Root Directory: **`apps/dashboard`**

Env (per project): `DATABASE_URL`, `DIRECT_URL` (or Supabase vars), `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` if used, and any app-specific secrets.

**Reference: vercel.monorepo.json**

- **vercel.monorepo.json** at repo root is a reference for a single-repo, multi-app setup (builds + routes).
- To use it, copy to **vercel.json** (or merge into existing root vercel.json) and adjust for your account. For Hobby, separate projects above are usually simpler.

---

## 3. Deploy commands

```bash
# Deploy CRM (Hobby)
vercel --prod --cwd apps/crm

# Or from Vercel UI: New Project → Root Directory = apps/crm
```

**Test URL (CRM):** `https://<your-crm-project>.vercel.app/crm/demo-business-pvt-ltd/dashboard`  
Target: P95 TTFB &lt; 500ms (Vercel Speed Insights).

---

## 4. Verify

- Local: **`cd apps/crm && npm run build`** – should succeed with no TS/ESLint ignore.
- After deploy: open `/crm/demo-business-pvt-ltd/dashboard` and `/api/health`.

---

**Commit:** `phase-7-deploys`
