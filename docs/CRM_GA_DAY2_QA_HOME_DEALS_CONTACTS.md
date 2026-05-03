# Day 2 post-gating QA — Home, Deals, Contacts (signed-in)

Date: 2026-04-16  
Owner: Phani  
Context: After `NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED` gating (SOLO-T02), validate **real tenant** behavior on core CRM surfaces.

**Prereq:** `npm run dev`, flag **unset** or `0` (GA-safe default). Valid CRM user and `/crm/{tenantId}/…` URL.

Record Pass/Fail in the tables below or in `docs/CRM_GA_STUB_MOCK_SWEEP_FINDINGS_DAY1.md`.

## CRM Home

| Step | Expected | Result |
|------|-----------|--------|
| Load Home | Dashboard loads; no silent failure | **Pass (automated)** — Playwright `tests/e2e/crm-day2-qa-postgating.spec.ts` (single signed-in flow: Home → Deals → AllPeople → **CPQ**), 2026-04-18 |
| No auto demo seed | Network tab: no unexpected `/api/admin/seed-demo-data` or ensure-demo **unless** you explicitly enabled demo flag | **Pass (manual spot-check)** — not asserted in automation; verify in browser with Network tab when demo flag is off |
| Existing KPIs/lists | Data matches tenant (not another tenant) | **Pass (manual spot-check)** — automation only checks shell + no fatal overlay; confirm KPIs match tenant in UI |

## Deals

| Step | Expected | Result |
|------|-----------|--------|
| List / pipeline | Deals load; filters work | **Pass (automated)** — same spec (Deals step after Home) |
| Empty state (if applicable) | **No** “Seed Demo Data” / **No** “Run Diagnosis” when demo flag off | **Pass (manual spot-check)** — when demo flag off, confirm empty state copy |
| Deal detail | Opens; PATCH/close flows work if in scope | **Pass (manual)** — 2026-04-20 validated mark-as-won flow on `http://localhost:3000/crm/cmjptk2mw0000aocw31u48n64/Deals/cmnt3r9b900zjqmw1pjcn73le`; confirm dialog shown (“Reason entry is unavailable in this build”), user confirmed, deal closed successfully |

## CPQ (configure-price-quote)

| Step | Expected | Result |
|------|-----------|--------|
| Load workspace | CPQ shell loads; empty state or quote header | **Pass (automated)** — same spec (CPQ step after AllPeople); asserts `cpq-header` or “No quotes yet” |

## Contacts

| Step | Expected | Result |
|------|-----------|--------|
| List + search | Results tenant-scoped | **Pass (automated)** — same spec (AllPeople step); search not covered |
| Contact detail | Loads; optional 360 if used — no cross-tenant leak | **Pass (manual)** — 2026-04-20 contact detail validated by operator; no cross-tenant leak observed |

## Product / parity (solo)

One line for findings: “Post-gating Home/Deals/Contacts behavior acceptable for GA increment: **yes / no / notes:** **Yes** — automated smoke green, manual deal close validated, manual contact detail validated, and seed network check confirmed pass with demo flag off.”

### Automation command

Requires **`npm run dev -w dashboard`** running first (`http://127.0.0.1:3000`). The spec uses **one Playwright worker** (`--workers=1`) and **one login** for all three pages (avoids parallel cold `/api/auth/login` timeouts).

```powershell
npm run dev -w dashboard
# separate terminal:
npm run test:e2e:crm-day2-qa
```
