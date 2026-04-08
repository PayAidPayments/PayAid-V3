# CRM / Web App Sync – Single Source of Truth

**Rule: Never implement the same CRM UI twice.** One frontend, one route tree, shared components in a package.

---

## Correct structure

```
payaid-v3/
├── apps/
│   ├── web/                           # Single frontend shell (THE app)
│   │   ├── app/
│   │   │   ├── page.tsx                # Landing
│   │   │   ├── login/                 # Auth
│   │   │   ├── suite/                  # Module launcher
│   │   │   └── crm/
│   │   │       ├── page.tsx           # Redirect to /crm/[slug]/dashboard
│   │   │       ├── [slug]/            # Tenant-scoped CRM (single source)
│   │   │       │   ├── layout.tsx     # AppShell
│   │   │       │   ├── dashboard/
│   │   │       │   ├── leads/
│   │   │       │   ├── pipeline/
│   │   │       │   ├── activities/
│   │   │       │   └── ...
│   │   │       └── (flat redirects: dashboard → [slug]/dashboard, etc.)
│   │   └── lib/                       # Web-only: auth, tenantContext, crmService
│   │
│   └── crm/                           # Optional standalone: redirect to web or thin shell
│       └── (redirect to apps/web or use packages/ui only)
│
├── packages/
│   ├── db/                            # Prisma, shared data
│   └── ui/                            # Shared presentational components
│       └── src/
│           └── components/
│               └── CRM/               # Reusable CRM UI (single source)
│                   ├── Dashboard.tsx
│                   ├── KpiCard.tsx
│                   └── ...
```

---

## URL and routing (web)

| URL | Source of truth |
|-----|-----------------|
| `/` | apps/web/app/page.tsx (landing) |
| `/login` | apps/web/app/login |
| `/suite` | apps/web/app/suite |
| `/crm` | apps/web/app/crm/page.tsx → redirect to /crm/[slug]/dashboard |
| `/crm/dashboard?tenantId=...` | apps/web/app/crm/dashboard/page.tsx → redirect to /crm/[slug]/dashboard |
| `/crm/[slug]/dashboard` | apps/web/app/crm/[slug]/dashboard/page.tsx |
| `/crm/[slug]/leads` | apps/web/app/crm/[slug]/leads/page.tsx |
| … | apps/web/app/crm/[slug]/... |

**Tenant** is always in the path: `[slug]`. No duplicate routes under a different app.

---

## Data and API

- **Data / server logic**: apps/web/lib (crmService, tenantContext, auth). No duplication in apps/crm for the same features.
- **API routes**: apps/web/app/api/... (auth, leads, etc.). Single place.

---

## Shared UI (packages/ui)

- **Purpose**: Presentational CRM (and other module) components that receive data as props.
- **Consumers**: apps/web (primary). Optionally apps/crm if kept as a thin shell.
- **Rule**: New reusable CRM components (cards, tables, charts) go in `packages/ui/components/CRM/`. Pages in apps/web fetch data and render `<PackageComponent data={...} />`.

---

## apps/crm standalone

- **Current**: Separate Next app with its own dashboard, leads, etc. (duplicate).
- **Target**: Either:
  - **A)** Deprecate: run only apps/web; point users to web for CRM, or
  - **B)** Thin shell: apps/crm only provides layout + redirect to web, or imports from packages/ui and shares one code path.

Prefer **A** so there is a single deployment and single route tree.

---

## Checklist for “single source”

- [ ] All CRM routes live under apps/web/app/crm/[slug]/...
- [ ] No duplicate dashboard/leads/pipeline implementations in apps/crm
- [ ] Reusable CRM UI lives in packages/ui/components/CRM/
- [ ] apps/web imports shared components from @payaid/ui
- [ ] One tenant resolution: slug in URL, getTenantContext(slug) in layout/pages
