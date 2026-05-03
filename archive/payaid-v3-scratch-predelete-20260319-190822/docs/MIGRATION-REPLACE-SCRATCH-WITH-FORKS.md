# Replace Scratch CRM/Finance → EspoCRM + Bigcapital (Own It, Keep Speed)

**Exact step-by-step** to swap scratch builds with forked production modules while preserving speed and 100% ownership.

---

## Option B: Fork & Rebrand – Your Best Choice

**B gives you 100% ownership, self‑hosting, and customization freedom** without legal risk. **No one can challenge it** – forked open‑source + your code = PayAid V3™.

### Why B > A / C

| Option | What | Drawback |
|--------|------|----------|
| **A** (Docker 8090 only) | Run EspoCRM image as-is | No code control; can’t add AI/India. |
| **B** (Fork source) | Fork EspoCRM + Bigcapital into **apps/payaid-crm**, **apps/payaid-finance** | **Full code ownership**, customize everything. ✅ |
| **C** (Next.js iframe proxy) | Shell iframes to forks | Iframe overhead = **speed killer**. |

**Legal:** GPLv3/AGPLv3 = *“Unlimited commercial SaaS + proprietary extensions”* (e.g. Nextcloud = AGPL + $100M ARR).

---

## Current vs future

| Current | Future |
|--------|--------|
| `apps/web` (scratch CRM routes) | Keep as **shell** (landing, login, suite). |
| `apps/crm` (scratch, messy) | **apps/payaid-crm** (EspoCRM fork) @ 8080 |
| (no finance or scratch finance) | **apps/payaid-finance** (Bigcapital fork) @ 8081 |

**Result:** Your shell + two forked apps you own; no iframe required if you embed or link by route.

---

## Day 1: Backup + fork (30 min → CRM + Finance running)

**Run only when ready.** Backup first.

### 1. Backup (1 min)

```bash
git checkout -b scratch-backup
git push origin scratch-backup
git checkout main
```

### 2. Wipe scratch CRM/Finance (1 min)

```bash
rm -rf apps/crm apps/finance
# Keep apps/web for shell
```

**PowerShell:** `Remove-Item -Recurse -Force apps\crm, apps\finance -ErrorAction SilentlyContinue`

### 3. Fork CRM (5 min)

```bash
pnpm dlx degit espocrm/espocrm apps/payaid-crm
cd apps/payaid-crm
pnpm i prisma @prisma/client
```

**Docker run** – add `apps/payaid-crm/docker-compose.yml`:

```yaml
version: '3'
services:
  crm:
    image: your-registry/payaid-crm:latest
    ports:
      - "8080:80"
    environment:
      DATABASE_URL: "postgresql://supabase..."
```

(Or use the existing **payaid-crm-app** Dockerfile + compose at repo root if you prefer that path.)

### 4. Fork Finance (5 min)

```bash
pnpm dlx degit bigcapitalhq/bigcapital apps/payaid-finance
cd apps/payaid-finance
pnpm i prisma @prisma/client
```

Port **8081** for Finance.

### 5. Test locally (5 min)

```bash
docker-compose up -d
# or: run each app’s dev server
```

- **localhost:8080** → CRM  
- **localhost:8081** → Finance  
- Keep **apps/web** for landing/shell.

---

## Day 2: Supabase + multi-tenant (2 hrs)

### 1. Shared Supabase schema

In **packages/db/schema.prisma** (or root `prisma/schema.prisma`):

```prisma
model Tenant {
  id   String   @id @default(cuid())
  slug String   @unique  // e.g. acme-corp-1234
  // ...
}

model CrmLead {
  id        String  @id @default(cuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  // ... your fields
}

model FinanceInvoice {
  id        String  @id @default(cuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  // ...
}
```

Then:

```bash
pnpm db:push
# or: pnpm prisma migrate dev --name add-tenant-rls
```

### 2. RLS (Supabase)

In Supabase SQL editor (or migrations):

```sql
-- Example: tenant isolation for CRM leads
CREATE POLICY "Tenant isolation" ON crm_lead
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id'));
```

Repeat for all tenant-scoped tables.

### 3. Speed config (both forks + shell)

- **Redis (shared):** `REDIS_URL=...` for session/cache in shell and forks.
- **CDN/uploads:** e.g. `CLOUDFLARE_R2` or S3 for uploads.
- **Indexes:** `prisma migrate dev --name speed-indexes` for tenant_id and hot columns.

---

## Day 3: Unified shell + routes (~4 hrs)

### Option A: New `apps/shell` (recommended in your plan)

Create a new Next.js app that is the single entrypoint: header, sidebar, and catch-all that proxies to CRM/Finance by iframe.

**Layout:** `apps/shell/app/layout.tsx`

```tsx
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <GlobalHeader tenantSlug={params.slug} />
        <div className="flex">
          <ModuleSidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

**Catch-all proxy:** `apps/shell/app/[...path]/page.tsx`

```tsx
const modules: Record<string, string> = {
  crm:     process.env.ESPOCRM_URL     || 'http://localhost:8080',
  finance: process.env.BIGCAPITAL_URL  || 'http://localhost:8081',
};

export default async function ModuleProxy({
  params,
}: {
  params: { path: string[]; slug?: string };
}) {
  const [module, ...subpath] = params.path ?? [];
  const base = modules[module];
  if (!base) return <div>Unknown module</div>;
  const iframeUrl = `${base}/#/${subpath.join('/')}`;
  return (
    <iframe
      src={iframeUrl}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
    />
  );
}
```

**Routes:**

- `payaid.com/crm/demo-1234/dashboard` → shell `[...path]` → iframe `http://localhost:8080/#/dashboard` (or tenant in query)
- `payaid.com/finance/demo-1234/invoices` → iframe Bigcapital

You’ll need to pass `slug` (and optionally JWT) into the iframe (e.g. query or postMessage) so the forked app can set tenant.

### Option B: Use existing `apps/web` as shell

Keep `apps/web`; add a catch-all route under e.g. `app/crm/[slug]/proxy/[...path]/page.tsx` that iframes EspoCRM, and similarly for finance. Same idea: shell = Next.js, modules = iframe to fork URLs.

---

## Day 4: Rebrand + India (~4 hrs)

### EspoCRM rebrand

In **payaid-crm-app** or **apps/espocrm-crm**:

```bash
# Bash (e.g. WSL/Git Bash)
find . -name "*.php" -not -path "./vendor/*" -exec sed -i 's/EspoCRM/PayAid CRM/g' {} +
cp payaid-logo.png client/img/logo.png   # or the path your fork uses
```

Or use **`payaid-crm-app/scripts/brand-replace.ps1`** (PowerShell); keep “EspoCRM” in license blocks where required.

### Bigcapital rebrand

```bash
find apps/bigcapital-finance -name "*.tsx" -exec sed -i 's/Bigcapital/PayAid Finance/g' {} +
# Plus logo/theme in their public or assets
```

### India features

- **CRM:** WhatsApp button → your Baileys (or other) API.
- **Finance:** GST fields, invoice templates, UPI (e.g. Razorpay webhook).
- **Shared:** tenant slug in shell; pass to forks via URL or header.

---

## Speed preservation

1. **Supabase indexes** – tenant_id, foreign keys, and hot query columns.
2. **Redis** – session and module cache (shared REDIS_URL).
3. **Edge proxy (e.g. Vercel)** – sub-1ms routing; shell on edge, forks on your infra.
4. **Iframe:** `sandbox="allow-scripts allow-same-origin"`, `loading="lazy"`; shell handles auth and tenant context and passes it into the iframe.

**Target:** ~120ms TTFB (fork native + your DB).

---

## Ownership (bulletproof)

```
Your codebase:
├── apps/web/                # Your shell – landing, login, suite (100% yours)
├── apps/payaid-crm/         # EspoCRM fork + your WhatsApp/AI (yours)
├── apps/payaid-finance/     # Bigcapital fork + your GST (yours)
├── packages/ai/             # Your Ollama agents (if present)
└── supabase/ or packages/db # Your schema + RLS (yours)
```

Legal: MIT/GPL/AGPL of the forks allow commercial use and proprietary extensions under their terms. Your shell and customizations = PayAid V3.

---

## Cursor “Replace & Own” prompt

Use this when you want to execute the migration (backup first).

```md
# REPLACE SCRATCH → FORKS (CRM + FINANCE)

**PHASE 1: BACKUP + WIPE**
- git checkout -b scratch-backup && git push origin scratch-backup && git checkout main
- rm -rf apps/crm apps/finance   # keep apps/web for shell

**PHASE 2: DUAL FORK**
- pnpm dlx degit espocrm/espocrm apps/payaid-crm
- pnpm dlx degit bigcapitalhq/bigcapital apps/payaid-finance
- cd apps/payaid-crm && pnpm i prisma @prisma/client
- cd apps/payaid-finance && pnpm i prisma @prisma/client

**PHASE 3: SUPABASE SHARED**
- schema.prisma: Tenant + tenant_id on ALL tenant-scoped tables
- pnpm db:push
- RLS: FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id') on each table

**PHASE 4: UNIFIED SHELL** (apps/shell or apps/web)
- Catch-all route → iframe proxy to CRM (8080) and Finance (8081)
- Global header + sidebar; tenant from [slug]

**PHASE 5: REBRAND**
- EspoCRM → PayAid CRM (logo + sed or payaid-crm-app/scripts/brand-replace.ps1)
- Bigcapital → PayAid Finance (logo + sed)

**TEST**
- localhost:8080 → PayAid CRM
- localhost:8081 → PayAid Finance
- apps/web remains shell (landing, login, suite)

COMMIT "forks-replace-scratch".
```

---

## Checklist

- [ ] Day 1: Backup branch; rm apps/crm, apps/finance; fork to apps/payaid-crm and apps/payaid-finance; pnpm i prisma @prisma/client; docker-compose up (8080 CRM, 8081 Finance).
- [ ] Day 2: Prisma Tenant + tenant_id; pnpm db:push; RLS on Supabase; Redis + indexes.
- [ ] Day 3: Unified shell (apps/shell or apps/web) with catch-all iframe proxy; routes /crm/[slug]/..., /finance/[slug]/....
- [ ] Day 4: Rebrand both forks (PayAid CRM, PayAid Finance, logo); India (WhatsApp, GST, tenant slug).
- [ ] Test: CRM and Finance load in shell; tenant slug respected; speed acceptable.

**Day 1 done ⇒ CRM + Finance ≈ 80% of a suite. Week 2: WhatsApp + AI. You own the code.**
