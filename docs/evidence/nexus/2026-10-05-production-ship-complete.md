# Evidence: NEXUS / customer specialists production ship

Date: 2026-10-05  
Production alias: `https://payaid-v3.vercel.app`  
Production deploy: `dpl_6UpevWDBfo3rXniHhRCp8DJHfWQ3` (READY, target=production)  
Initial green commit: `0a4003a57c5403b5121b7abc5552c9f9a87e1de3` (PR #36)

## What shipped

- Phase 1–4 specialist pack on `main` (PR #32): NEXUS catalogs, customer entitlements, draft flows, orchestrator APIs, AI Studio Flows UI.
- Kept main’s full Vercel build (`cd apps/dashboard && node scripts/vercel-build.cjs`). Did **not** promote slim preview `f8110c9`.

## Production build fixes (PRs #33–#37)

| PR | Fix |
|---|---|
| #33 | Flatten `apps/dashboard/app` + write root `next.config.mjs` in `vercel-build.cjs` |
| #34 | Keep root `proxy.ts`; skip copying `middleware.ts`; retire legacy `next.config.js` |
| #35 | Rewrite five-level `../../../../../components/` imports; add missing voice-helper modules |
| #36 | Re-upload helpers as UTF-8 (PR #35 upload was UTF-16 LE) |
| #37 | Stop rewriting `/` → missing `/landing` (serve `app/page.tsx`) |

## Smoke (2026-10-05, pre-#37)

- `/login` → 200
- `/ai-studio` → 200
- `/register` → 200
- `/dashboard` → 200
- `/` → 404 (fixed by PR #37; re-verify after deploy)

## Do not

- Promote Ready slim preview from `feat/nexus-customer-specialists` (`f8110c9`).
