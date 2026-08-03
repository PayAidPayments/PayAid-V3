# Module Dashboard Uniformity

Single layout grammar for every PayAid module **Home / Dashboard** so users feel one platform.

## 5-band contract

Every module home must compose [`ModuleDashboardShell`](../../components/modules/dashboard/ModuleDashboardShell.tsx):

1. **Header** — module name, tenant/context, optional period/role controls  
2. **KPI row** — **max 4** primary metrics (pad with reserved empty slots if fewer)  
3. **Insight strip** — 1–2 sentence AI/trend summary, or honest “Insights unavailable”  
4. **Action row** — 2–4 primary CTAs that answer “so what?”  
5. **Secondary band** — **exactly one** of: chart | work queue | recent items  

Do not stack chart + queue + recent as peer full-width sections on the home. Put additional depth on list/detail routes or behind a single “More insights” link.

## KPI anatomy

Each KPI card should include:

- Label  
- Value  
- Optional period delta (% + trend)  
- Optional sparkline  
- Optional drill-down `href`  

Currency uses `formatINRForDisplay` / compact helpers.

## Incomplete modules

Productivity and other incomplete tools use the **same shell** with:

- Honest empty KPI slots or zeros labeled as empty state context  
- Insight status `unavailable` when there is no real model output  
- “Start here” CTAs  
- Secondary band = empty state or recent list only  

No fake dense widget walls. No bare link-list homes.

Industry / catalog shells that are not product-ready should use [`ComingSoonModuleHome`](../../components/modules/dashboard/ComingSoonModuleHome.tsx) (keep `navVisibility: 'hidden'` in Module Switcher per architecture hygiene).

File gate: `node scripts/check-module-dashboard-homes.cjs`

## Visual language

- Shared chrome from `components/modules/dashboard/*`  
- Module accent via [`lib/modules/module-config.ts`](../../lib/modules/module-config.ts) (icon + description); avoid per-module carnival gradients on the home canvas  
- Page background: calm slate (`bg-slate-50` / dark slate) aligned with AppShell  

## Performance

- Skeleton-first via `DashboardSkeleton`  
- Lazy-load chart packages below the fold (`next/dynamic`, `ssr: false`)  
- Keep home page data adapters thin; do not re-fetch the same summary in every band  

## Role-aware defaults (guidance)

| Role focus | Prefer KPIs |
|---|---|
| Executive | Revenue / pipeline value / headcount / cash |
| Operator | Overdue tasks / today’s queue / open tickets |
| Builder (productivity) | Recent files / templates / storage |

Pass different `kpis` arrays from the page; keep the shell identical.

## Migration checklist

- [ ] Home uses `ModuleDashboardShell`  
- [ ] ≤ 4 primary KPIs  
- [ ] One secondary band only  
- [ ] Empty / loading states from shared kit  
- [ ] Module id present in `MODULE_CONFIGS`  
- [ ] No-404 QA on home + action links  
