# PayAid V3 – Monolith vs Decoupled: Current State

**Why we still have the monolith and how to finish the move to decoupled.**

---

## Decision: Move to Decoupled

The project **has decided** to move to a decoupled structure:

- **Phase 2** created Turborepo with `apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice` as deploy targets.
- **MONOLITHIC_TO_DECOUPLED_MIGRATION_PLAN.md** and **PENDING_ITEMS_DECOUPLED** describe the target: module-specific apps, subdomains, independent deploys.
- **GO-LIVE-CHECKLIST** deploys the **apps** (crm, hr, voice, dashboard), not the root app.

So the **intended** architecture is decoupled; the monolith is **legacy** and should be phased out.

---

## Current Reality: Hybrid

| What | Where it lives | Who runs it |
|------|----------------|-------------|
| **Landing page** (`/`) | Root `app/page.tsx` → `app/landing/` (proxy rewrite) + `components/landing/LandingPage.tsx` | **Monolith** (root Next.js on 3000) |
| **Login, signup** | Root `app/login/`, `app/signup/` | Monolith |
| **Home / Command Center** | Root `app/home/` | Monolith |
| **Dashboard shell + routes** | Root `app/dashboard/`, `app/crm/`, `app/finance/`, etc. | Monolith |
| **CRM/HR/Voice/Dashboard apps** | `apps/crm`, `apps/hr`, `apps/voice`, `apps/dashboard` | **Decoupled** (Turbo on 3001–3004) |

So today:

- **Port 3000** = root monolith (landing, login, home, and almost all product routes).
- **Ports 3001–3004** = decoupled apps (minimal shells; some routes may be synced or duplicated).

We kept “using the monolith” for the landing because the **landing and entry flows were never moved** into any of the apps. Fixing 404 for `localhost:3000/` meant fixing the only place that code lives: the root app.

---

## Why the monolith is still there

From **PHASE_2_COMPLETE.md**:

- *“The existing monolith remains at repo root; apps/* are the **new deploy targets**.”*
- *“Full app/dashboard/* + shell layouts **move here in follow-up**.”*

So Phase 2 added the app shells and intended a **follow-up migration** of routes. That migration is **incomplete**:

- Landing, login, signup, home, and the bulk of dashboard/module routes are still in the root `app/`.
- The sync script is deprecated; routes were not fully copied into the apps.
- So in practice, the main app people run and deploy for “the product” is still the root monolith unless you explicitly deploy only one app (e.g. `deploy:crm`).

---

## How to finish the move to decoupled

To **stop** depending on the monolith for the main entry (port 3000), you have two approaches.

### Option A: Landing + login in one app (e.g. Dashboard)

- Move **landing** and **login/signup** into `apps/dashboard` (or a dedicated `apps/web`).
- Point **port 3000** at that app in dev (`apps/dashboard` or `apps/web` on 3000).
- `dev:all` runs only Turbo apps; no root `next dev`. Root monolith can be retired for “main app” once all routes are moved.

### Option B: Dedicated marketing app

- Add **`apps/landing`** (or `apps/marketing`): landing page + login + signup only.
- That app runs on 3000; after login it redirects to the right module app (e.g. dashboard or crm).
- Clear split: one app = marketing + auth; others = product modules.

### What to move

1. **Landing** – Already in `components/landing/LandingPage.tsx`. Add a route in the chosen app (e.g. `apps/dashboard/app/page.tsx` or `apps/landing/app/page.tsx`) that uses it; ensure the app has access to `@/components` or a shared package.
2. **Login / signup** – Move `app/login`, `app/signup` (and any shared auth UI) into that same app or into `packages/core` / `packages/ui` and consume from the app.
3. **Home** – Move `app/home` into `apps/dashboard` (or the “shell” app) so the post-login entry is decoupled.
4. **Root monolith** – Once all entry and shell routes are in apps, the root app can be limited to redirects, or removed, and **port 3000** can be served entirely by one of the apps.

---

## Summary

| Question | Answer |
|----------|--------|
| **Have we decided to move to decoupled?** | **Yes.** Docs and Phase 2 describe decoupled apps as the target. |
| **Why are we still using the monolith?** | Because the **migration is incomplete**: landing, login, home, and most routes still live only in the root `app/`. We fixed the monolith for the landing because that’s where the code is. |
| **What to do next?** | Move landing (and login/signup) into one of the apps (e.g. `apps/dashboard` or new `apps/landing`), serve port 3000 from that app, then continue moving remaining routes off the monolith until it can be retired. |

This file can live in the repo as the single place that states: **decision = decoupled; monolith = legacy until migration is done.**
