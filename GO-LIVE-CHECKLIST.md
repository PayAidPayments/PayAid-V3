# PayAid V3 – What to do now (go-live)

## ✅ Already done (no action needed)

- Phase 8–9: Playwright demo flows, `dev:all`, `demo`, `deploy:crm` / `deploy:hr` scripts, README Quickstart + Benchmarks.
- CRM deploy config: `apps/crm/vercel.json` (Prisma + build), `apps/crm/DEPLOY.md`, Prisma in `apps/crm` for generate.
- Commit: `phase-8-9-qa-dx`.

---

## 🔲 You do these (one-time, then deploy)

### 1. Turn on “Include source files outside of the Root Directory”

- Go to **[Vercel Dashboard](https://vercel.com)** → open project **crm** → **Settings** → **General**.
- Find **Root Directory** (should be `apps/crm`).
- Turn **ON** the option **“Include source files outside of the Root Directory”**.
- Save.

Without this, the build only sees `apps/crm` and cannot see `packages/db` (Prisma schema), so the deploy will keep failing.

### 2. Set environment variables (if not already set)

In the same **crm** project: **Settings** → **Environment Variables**. Add at least:

- `DATABASE_URL` – your Postgres URL (e.g. Supabase or Neon).
- `NEXTAUTH_SECRET` or whatever your app uses for auth (a long random string).

Add any other vars your CRM app uses (see `.env.example` or app code).

### 3. Deploy again

From the repo root:

```bash
npm run deploy:crm
```

After a green build you’ll get:

- **Production:** `https://crm-xxx.vercel.app`
- **Demo tenant:** `https://crm-xxx.vercel.app/crm/demo-business-pvt-ltd/dashboard`

### 4. Test prod (2 min)

- Open: `https://crm-xxx.vercel.app/crm/demo-business-pvt-ltd/dashboard`
- Optional: Lighthouse, Speed Insights P95 TTFB &lt;500ms, screenshot.

---

## Rollout plan (all apps)

| App       | Deploy command              | URL pattern                          |
|----------|-----------------------------|--------------------------------------|
| CRM      | `npm run deploy:crm`        | crm-xxx/crm/demo-business-pvt-ltd/... |
| HR       | `npm run deploy:hr`         | hr-xxx/hr/demo-business-pvt-ltd/...   |
| Voice    | `npm run deploy:voice`      | voice-xxx/voice-agents/demo...        |
| Dashboard| `npm run deploy:dashboard`  | dash-xxx/dashboard                    |

For each app: same Vercel steps (Root = `apps/<app>`, **ON** “Include source files outside of the Root Directory”, env vars), then run the deploy command.

---

## Optional: local full demo (no Vercel)

- **Terminal 1:** `npm run dev:all` (apps on 3000–3003).
- **Terminal 2:** `npm run test:demo` (Playwright CTO flows; should be green).

---

## Optional stack: PayAid Social & Marketing Studio

Single-flow Studio (Audience → Content & media → Channels → Launch), standalone app, and dispatch worker. See `docs/PAYAID_SOCIAL_STUDIO.md` for full design.

### 🔲 1. Smoke-test Studio (in dashboard)

- Start dashboard: `npm run dev` (or `npm run dev:dashboard`).
- Open a tenant that has Marketing enabled: `/marketing/[tenantId]/Studio` (e.g. `/marketing/demo-tenant/Studio` if that tenant exists).
- Walk through: **Audience & goal** → **Content & media** (try “Generate content” if Ollama is running; “Generate images” needs `IMAGE_WORKER_URL`) → **Channels & schedule** → **Review & launch**.
- Confirm “Launch campaign” creates posts (check DB `MarketingPost` or logs).

### 🔲 2. Run the social-post-dispatch worker (local)

- Ensure **Redis** is running (e.g. `REDIS_URL` in `.env` or local Redis).
- From repo root: `npm run worker:social-dispatch`.
- Leave it running; trigger a “Send now” launch from Studio. Worker should pick up the job and set `MarketingPost.status` to `SENT` (connectors are still stubbed).

### 🔲 3. Standalone PayAid Social app (optional)

- Run: `npm run dev:social` (app on port **3005**).
- In `apps/social` (or `.env`), set `NEXT_PUBLIC_SOCIAL_API_URL=http://localhost:3000` so Studio calls the dashboard API for segments, AI, and launch.
- Open `http://localhost:3005/studio` and test the same flow; segments/content/launch should work when dashboard is on 3000.

### 🔲 4. Environment (optional stack)

- **Dashboard / worker:** `DATABASE_URL`, `REDIS_URL` (for Bull). For AI in Studio: `OLLAMA_BASE_URL` (content), `IMAGE_WORKER_URL` or `TEXT_TO_IMAGE_SERVICE_URL` (images).
- **Standalone app:** `NEXT_PUBLIC_SOCIAL_API_URL` (dashboard base URL when using API from port 3005).
- See `.env.example` and `docs/PAYAID_SOCIAL_STUDIO.md` (Environment section).

### 🔲 5. Later: wire real connectors

- In `server/workers/social-post-dispatch.ts`, replace stubs for **WhatsApp** (WAHA), **Email** (SMTP), **SMS**, and social networks.
- Use `packages/social/src/connectors/whatsapp.ts` (WAHA) and stubs in `packages/social/src/connectors/` (facebook, linkedin, twitter, youtube) as starting points.

---

**Summary:** I can’t change Vercel project settings or env vars for you. Do **steps 1 and 2** in the dashboard, then run **step 3** (`npm run deploy:crm`). After that, the live CRM URL and demo path above will work.

**Last deploy attempt:** Build failed (schema not found) because only 167 files were sent—confirm **“Include source files outside of the Root Directory”** is **ON** for the crm project, then redeploy.
