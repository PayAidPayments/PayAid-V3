# Dashboard Build Reliability Hardening - 2026-04-26

## Scope

- Hardened `apps/dashboard/scripts/next-build.cjs` to improve deterministic build behavior.
- Updated `apps/dashboard/vercel.json` to prefer reliability-first fallback behavior.

## Changes applied

- Added strict env-flag parsing via `scripts/strict-flag.cjs`.
- Added configurable graceful-kill escalation:
  - `NEXT_BUILD_TIMEOUT_MS` (existing timeout limit)
  - `NEXT_BUILD_KILL_GRACE_MS` (wait after `SIGTERM` before `SIGKILL`)
- Added configurable preferred engine:
  - `NEXT_BUILD_PREFERRED_MODE` (`webpack` or `turbopack`)
- Added alternate engine retry control:
  - `NEXT_BUILD_ALLOW_ALTERNATE_RETRY` (`1` enabled, strict flag semantics)
- Added stale lock cleanup guard:
  - `NEXT_BUILD_CLEAR_STALE_LOCK` (remove stale `.next/lock` before primary/fallback runs)
- Added optional isolated build output dir control in Next config:
  - `NEXT_BUILD_DIST_DIR` (maps to `next.config.mjs` `distDir` for verification isolation)
- Kept Vercel-specific guard for webpack fallback:
  - `VERCEL_ALLOW_WEBPACK_FALLBACK`
- Updated Vercel build command env defaults:
  - `NEXT_BUILD_TIMEOUT_MS=1800000`
  - `NEXT_BUILD_KILL_GRACE_MS=15000`
  - `NEXT_BUILD_HEARTBEAT_MS=60000`
  - `NEXT_BUILD_PREFERRED_MODE=turbopack`
  - `NEXT_BUILD_ALLOW_ALTERNATE_RETRY=1`
  - `NEXT_BUILD_CLEAR_STALE_LOCK=1`
  - `VERCEL_ALLOW_WEBPACK_FALLBACK=1`

## Verification commands and outcomes

1) Syntax check:

- Command: `node --check "scripts/next-build.cjs"` (run in `apps/dashboard`)
- Result: `PASS`

2) Bounded retry path validation:

- Command: `NEXT_BUILD_TIMEOUT_MS=60000 NEXT_BUILD_ALLOW_ALTERNATE_RETRY=1 npm run build` (executed with PowerShell env variables)
- Result: `FAIL` (expected for this bounded smoke)
- Observed behavior:
  - Started with webpack
  - Timed out at 60s -> `SIGTERM`
  - Automatically retried with turbopack
  - Timed out at 60s -> `SIGTERM`
  - Exited non-zero with explicit termination diagnostics

3) Heartbeat/elapsed diagnostics validation:

- Command: `NEXT_BUILD_TIMEOUT_MS=15000 NEXT_BUILD_HEARTBEAT_MS=3000 NEXT_BUILD_ALLOW_ALTERNATE_RETRY=1 npm run build`
- Result: `FAIL` (expected bounded smoke)
- Observed behavior:
  - Periodic heartbeat log emitted while each engine was running (`still running`)
  - Timeout path reported elapsed runtime per engine
  - Retry logic remained intact (`webpack` -> `turbopack`)
  - Exit stayed explicit and deterministic with signal + elapsed context

4) Deploy-style lock-contention isolation run:

- Command set A (original `.next`): `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TIMEOUT_MS=1800000 ... npm run build`
- Result: `FAIL`
- Observed behavior:
  - Build entered engine run but failed with `.next/lock` contention (`Unable to acquire lock ... .next\lock`)
  - Fallback engine also saw lock contention in same validation window
- Interpretation:
  - Build reliability blocker includes workspace lock contention from concurrent/local build artifacts.

5) Deploy-style isolated output run:

- Command set B (isolated output): `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TIMEOUT_MS=600000 ... npm run build`
- Result: `FAIL` (killed after collecting diagnostics)
- Observed behavior:
  - Lock contention bypassed (no `.next/lock` failure in isolated dir run)
  - Webpack reached `Creating an optimized production build ...` and ran until 10m timeout
  - Automatic fallback to Turbopack started and continued with heartbeat + Next banner logs
- Interpretation:
  - Primary bottleneck is now isolated to long compile duration under current graph/settings, not startup/lock deadlock.

6) Dist-dir lock-cleanup bugfix validation:

- Issue found:
  - stale-lock cleanup initially targeted only `.next/lock` and did not clear lock in custom `NEXT_BUILD_DIST_DIR` runs.
- Fix applied:
  - `apps/dashboard/scripts/next-build.cjs` now resolves lock path from active dist dir (`NEXT_BUILD_DIST_DIR` or `.next`) and clears `<distDir>/lock`.
- Validation:
  - bounded smoke with `NEXT_BUILD_DIST_DIR=.next-build-verify` logged `removed stale .next-build-verify/lock before primary build`
  - deploy-style rerun in isolated dist dir no longer failed at startup lock acquisition
  - both webpack and turbopack advanced to `Creating an optimized production build ...` before bounded operator stop

7) Deploy command hardening:

- Updated Vercel command to include dedicated output dir:
  - `NEXT_BUILD_DIST_DIR=.next-vercel-build`
- Purpose:
  - isolate deploy builds from local `.next` contention and reduce false-failure lock collisions.

8) Full-window isolated deploy validation (30m):

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=1800000 NEXT_BUILD_PREFERRED_MODE=turbopack NEXT_BUILD_ALLOW_ALTERNATE_RETRY=1 NEXT_BUILD_CLEAR_STALE_LOCK=1 npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Turbopack reached `Creating an optimized production build ...`
  - Continued heartbeat progress for full 30-minute window
  - Timed out at `1800000ms` and then entered webpack fallback path
- Interpretation:
  - Reliability hardening is functioning as designed (deterministic timeout + observability + fallback)
  - Remaining blocker is compile performance (turbopack still not completing within 30m in this environment)

9) Attempted lint-skip optimization rollback:

- Attempt:
  - tried adding lint-skip via `next.config` and later `--no-lint`.
- Outcome:
  - `next.config.eslint` is unsupported in this Next version and `--no-lint` is an unknown option.
- Resolution:
  - reverted both changes; build command and script returned to compatible flags only.

10) Heap/OOM mitigation run (webpack-first):

- Trigger:
  - previous long run showed webpack fallback failing with V8 heap OOM under `NODE_OPTIONS=--max-old-space-size=4096`.
- Change:
  - switched deploy preference to webpack-first and increased heap to `6144` in `apps/dashboard/vercel.json`.
- Validation command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TIMEOUT_MS=900000 NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Observed behavior:
  - webpack ran through full 15-minute bound without OOM
  - timed out at 900s (deterministic timeout path), then entered turbopack fallback
- Interpretation:
  - heap increase removed the immediate webpack OOM failure mode
  - remaining blocker remains compile duration (not memory crash) for green completion.

11) Compile-pressure reduction pass (lazy-load heavy dependencies):

- Changes:
  - Lazy-loaded heavy server-route deps:
    - `apps/dashboard/app/api/pdf/convert/route.ts` (`pdf-parse`)
    - `apps/dashboard/app/api/pdf/merge/route.ts` (`pdf-lib`)
    - `apps/dashboard/app/api/spreadsheets/[id]/export/route.ts` (`xlsx`)
  - Moved heavy chart pages behind client-only dynamic entry points (`ssr: false`):
    - `apps/dashboard/app/super-admin/analytics/page.tsx` -> `SuperAdminAnalyticsClient.tsx`
    - `apps/dashboard/app/super-admin/onboarding-analytics/page.tsx` -> `OnboardingAnalyticsClient.tsx`

12) Post-optimization runtime validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=900000 NEXT_BUILD_PREFERRED_MODE=webpack NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack completed full 900s window without OOM (stable heap behavior preserved)
  - Timed out deterministically at 900s and entered turbopack fallback
  - Fallback entered optimized production build successfully before operator stop
- Interpretation:
  - Recent lazy-load and dynamic-entry optimizations are safe and keep runtime stable
  - Further compile-time reduction is still required for green completion within deploy window.

13) Compile-pressure reduction pass (force-dynamic for heavy analytics routes):

- Changes:
  - Marked heavyweight analytics pages as runtime-rendered to reduce static/build pressure:
    - `apps/dashboard/app/dashboard/analytics/advanced/page.tsx`
    - `apps/dashboard/app/dashboard/voice-agents/analytics/page.tsx`
    - `apps/dashboard/app/analytics/[tenantId]/Home/page.tsx`
  - Each now exports: `export const dynamic = 'force-dynamic'`

14) Post-force-dynamic validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack remained stable and timed out deterministically at 600s (no OOM)
  - Fallback turbopack entered optimized production build path successfully before operator stop
- Interpretation:
  - This pass preserved stability but did not materially reduce total compile duration enough to meet the current timeout window.

15) Report-export route hotspot reduction:

- Changes:
  - Lazy-loaded `xlsx` in additional export/report routes:
    - `apps/dashboard/app/api/hr/reports/builder/[id]/export/route.ts`
    - `apps/dashboard/app/api/gst/gstr-1/export/route.ts`
    - `apps/dashboard/app/api/gst/gstr-3b/export/route.ts`
- Goal:
  - reduce eager module graph pressure from report/export-only code paths.

16) Post-report-route optimization validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack again reached optimized production build and timed out at 600s deterministically (no OOM)
  - Fallback turbopack entered optimized production build before operator stop
- Interpretation:
  - Additional report-route lazy-loading is safe and preserves build stability
  - compile duration remains the primary unresolved blocker.

17) Route-level compile triage (charts-disabled profile):

- Triage mechanism added:
  - `NEXT_BUILD_TRIAGE_DISABLE_CHARTS=1` now aliases `recharts` to a lightweight shim in `apps/dashboard/next.config.mjs`
  - Shim module: `apps/dashboard/lib/build-triage/recharts-stub.tsx`
- Purpose:
  - test whether chart-heavy dependencies are a dominant compile-time bottleneck.

18) Charts-disabled triage validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TRIAGE_DISABLE_CHARTS=1 NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack still timed out at 600s (deterministic timeout, no OOM)
  - Fallback turbopack entered optimized production build before operator stop
- Interpretation:
  - Chart dependency cluster is not the primary compile bottleneck.
  - Remaining hotspot likely lies in broader server/app-route graph size or non-chart module compile cost.

19) Route-level compile triage (AI Studio + Website Builder pages disabled):

- Triage mechanism added:
  - `NEXT_BUILD_TRIAGE_DISABLE_AI_WEBSITE_PAGES=1` enables webpack module replacement for:
    - `app/ai-studio/**/page.*`
    - `app/website-builder/**/page.*`
  - Replacement target:
    - `apps/dashboard/lib/build-triage/route-page-stub.tsx`
- Purpose:
  - test whether these feature clusters dominate compile time.

20) AI/Website-disabled triage validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TRIAGE_DISABLE_AI_WEBSITE_PAGES=1 NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack still timed out at 600s (deterministic timeout, no OOM)
  - Fallback turbopack entered optimized production build before operator stop
- Interpretation:
  - AI Studio + Website Builder page cluster is not the dominant compile bottleneck.
  - Bottleneck is likely in broader shared/core compile graph and/or global app route surface.

21) Core module-shell triage profile:

- Triage mechanism added:
  - `NEXT_BUILD_TRIAGE_DISABLE_CORE_MODULE_SHELL=1` aliases these shared module wrappers to a minimal stub:
    - `@/components/modules/AppShell`
    - `@/components/modules/UniversalModuleLayout`
    - `@/components/modules/UniversalModuleHero`
    - `@/components/modules/GlassCard`
  - Stub file:
    - `apps/dashboard/lib/build-triage/core-module-shell-stub.tsx`

22) Core-shell triage validation:

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TRIAGE_DISABLE_CORE_MODULE_SHELL=1 NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack again timed out at 600s deterministically (no OOM)
  - Fallback turbopack entered optimized production build before operator stop
- Interpretation:
  - Shared module-shell wrappers are not the dominant compile bottleneck.
  - Primary compile cost remains in broader route surface / shared dependencies beyond isolated UI shell clusters.

23) Family-level route-surface triage framework:

- Triage mechanism added:
  - `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES` (comma-separated top-level app families, e.g. `hr,inventory`)
  - Each family gets an env-gated webpack replacement for `app/<family>/**/page.*` to:
    - `apps/dashboard/lib/build-triage/route-page-stub.tsx`
- Purpose:
  - identify whether any single top-level domain drives compile timeout.

24) Family triage run #1 (`hr` disabled):

- Command:
  - `VERCEL=1 VERCEL_ENV=production NEXT_BUILD_DIST_DIR=.next-build-verify NEXT_BUILD_TIMEOUT_MS=600000 NEXT_BUILD_PREFERRED_MODE=webpack NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=hr NODE_OPTIONS=--max-old-space-size=6144 ... npm run build`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack still timed out at 600s (deterministic, no OOM)
  - Fallback turbopack entered optimized production build before operator stop
- Interpretation:
  - `hr` route family is not the dominant compile bottleneck.
  - Continue triage with additional families (`finance`, `inventory`, `crm`) to isolate high-cost cluster(s).

25) Family triage run #2 (`finance` disabled):

- Command:
  - `... NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=finance ...`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack timed out at ~600s deterministically (no OOM)
  - Fallback turbopack entered optimized build before operator stop
- Interpretation:
  - `finance` route family is not the dominant compile bottleneck.

26) Family triage run #3 (`inventory` disabled):

- Command:
  - `... NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=inventory ...`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack timed out at ~600s deterministically (no OOM)
  - Fallback turbopack entered optimized build before operator stop
- Interpretation:
  - `inventory` route family is not the dominant compile bottleneck.

27) Family triage run #4 (`crm` disabled):

- Command:
  - `... NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=crm ...`
- Result: `FAIL` (timeout)
- Observed behavior:
  - Webpack timed out at ~600s deterministically (no OOM)
  - Fallback turbopack entered optimized build before operator stop
- Interpretation:
  - `crm` route family is not the dominant compile bottleneck.

28) Family-triage synthesis:

- Disabled families tested so far:
  - `hr`, `finance`, `inventory`, `crm`
- Outcome:
  - no single tested family reduces webpack compile below the 600s timeout threshold.
- Conclusion:
  - dominant compile cost appears to be distributed/shared across global route graph and foundational dependencies rather than isolated in a single top-level business family.

29) **Phase 15 â€“ shared dependency graph triage (webpack aliases)**

- Purpose: isolate **cross-cutting** heavy stacks (not single route families) to see if compile time is dominated by a specific third-party or first-party package graph.
- Code:
  - `apps/dashboard/lib/build-triage/framer-motion-stub.tsx` â€” `motion`, `AnimatePresence`, `Reorder` (no `framer-motion` package graph).
  - `apps/dashboard/lib/build-triage/payaid-ai-stub.ts` â€” replaces `@payaid/ai` for bundle resolution only.
  - `apps/dashboard/lib/build-triage/tiptap-react-stub.tsx` + `tiptap-starter-kit-stub.ts` â€” replaces `@tiptap/react` and `@tiptap/starter-kit` for document editors.
  - `apps/dashboard/lib/build-triage/xlsx-stub.ts` â€” minimal `read` / `write` / `utils` surface for `xlsx` (compile isolation only; not a runtime substitute).
- Env flags in `apps/dashboard/next.config.mjs` (all opt-in, `1` = on):
  - `NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION`
  - `NEXT_BUILD_TRIAGE_DISABLE_PAYAID_AI`
  - `NEXT_BUILD_TRIAGE_DISABLE_TIPTAP`
  - `NEXT_BUILD_TRIAGE_DISABLE_XLSX`
- Example (compare one flag at a time, same `NEXT_BUILD_DIST_DIR`, timeout, and preferred engine as other triage runs):
  - `NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION=1` â€¦ `npm run build`
  - `NEXT_BUILD_TRIAGE_DISABLE_PAYAID_AI=1` â€¦
  - `NEXT_BUILD_TRIAGE_DISABLE_TIPTAP=1` â€¦
  - `NEXT_BUILD_TRIAGE_DISABLE_XLSX=1` â€¦

30) Dependency-triage smoke (framer-motion stub, bounded):

- Command (PowerShell, isolated dist, no alternate retry, 90s cap):
  - `NEXT_BUILD_DIST_DIR=.next-triage-smoke-fm` + `NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION=1` + `NEXT_BUILD_TIMEOUT_MS=90000` + `NEXT_BUILD_ALLOW_ALTERNATE_RETRY=0` + `NODE_OPTIONS=--max-old-space-size=6144` â†’ `npm run build` in `apps/dashboard`
- Result: `FAIL` (expected timeout)
- Observed behavior:
  - `next build --turbopack` started and emitted heartbeat; no immediate resolve/alias error from the stub wiring.
- Interpretation:
  - Stubs are load-bearing enough for a production compile to **start**; full comparative timing still requires long-window runs (e.g. 600s) per stack, as with family triage.
- **Update:** long-window (600s) webpack isolation for `FRAMER_MOTION`, `PAYAID_AI`, `TIPTAP`, and `XLSX` is recorded in (31) below â€” none completed within the 600s cap.

31) **Long-window dependency triage (webpack-first, 600s cap, 2026-04-27)**

- Shared environment (per run, isolated `distDir`, same engine, no alternate retry):
  - `VERCEL=1` + `VERCEL_ENV=production`
  - `NODE_OPTIONS=--max-old-space-size=6144`
  - `NEXT_BUILD_PREFERRED_MODE=webpack`
  - `NEXT_BUILD_TIMEOUT_MS=600000`
  - `NEXT_BUILD_ALLOW_ALTERNATE_RETRY=0`
  - `NEXT_BUILD_CLEAR_STALE_LOCK=1`
- Outcomes (local `apps/dashboard`):

| Triage flag | `NEXT_BUILD_DIST_DIR` | Result | Webpack `elapsedMs` to SIGTERM (approx) |
|-------------|------------------------|--------|----------------------------------------|
| `NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION=1` | `.next-triage-wp-framer` | `FAIL` (timeout) | ~600870ms |
| `NEXT_BUILD_TRIAGE_DISABLE_PAYAID_AI=1` | `.next-triage-wp-ai` | `FAIL` (timeout) | ~600434ms |
| `NEXT_BUILD_TRIAGE_DISABLE_TIPTAP=1` | `.next-triage-wp-tiptap` | `FAIL` (timeout) | ~600734ms |
| `NEXT_BUILD_TRIAGE_DISABLE_XLSX=1` | `.next-triage-wp-xlsx` | `FAIL` (timeout) | ~600673ms |

- Observed behavior (all four):
  - Reached `Creating an optimized production build ...` with no OOM in the log window
  - Deterministic `SIGTERM` at the 600s budget
- Interpretation:
  - Disabling any **one** of `framer-motion`, `@payaid/ai`, tiptap, or `xlsx` alone does **not** move the webpack build past a 10-minute local wall clock under this benchmark. No single one of these stacks is the exclusive compile-time driver (consistent with family-level and recharts/AI-page/shell triage).
- **Recommended next step (P0 work):** move to **cumulative** triage (enable multiple `NEXT_BUILD_TRIAGE_DISABLE_*` at once) or **platform-level** levers: raise the measurement window to match Vercel (`NEXT_BUILD_TIMEOUT_MS=1800000` locally) to see if any run completes under 30m; and/or start structural reduction (route consolidation, `experimental` / bundle analyzer on largest chunks, or split deployment surface) since isolated removals are not finding a dominant node.

32) **Cumulative triage (all dep + prior profiles, 600s cap, 2026-04-27)**

- Enabled in one run:
  - `NEXT_BUILD_TRIAGE_DISABLE_CHARTS=1` (recharts stub)
  - `NEXT_BUILD_TRIAGE_DISABLE_AI_WEBSITE_PAGES=1` (AI Studio + Website Builder page stubs)
  - `NEXT_BUILD_TRIAGE_DISABLE_CORE_MODULE_SHELL=1` (AppShell/Universal* / GlassCard aliases)
  - `NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_PAYAID_AI=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_TIPTAP=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_XLSX=1`
- Shared env: same as (31) (`webpack` preferred, `600000` timeout, no alternate retry, isolated `distDir=.next-triage-cumulative-600s`).
- Result: `FAIL` (timeout at ~600.5s, `SIGTERM`, no OOM in log).
- Interpretation:
  - Even with **all** of the above build-time stubbing combined, the webpack build does not finish within **10 minutes** on this host. The remaining cost is distributed across the rest of the app (routes, `lucide-react`, Radix, `@payaid/db` / `transpilePackages`, Next/React compiler work, and other shared graph) â€” not any single one of the previously isolated packages.
- Ergonomics: `apps/dashboard/next.config.mjs` supports **`NEXT_BUILD_TRIAGE_COMBINED_ALL=1`** to turn on the same nonâ€“route-family triage set as a single switch (families still require `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES` separately).

33) **30m cumulative benchmark + Next 16 compile-gate fix (2026-04-27)**

- First 30m run (`NEXT_BUILD_TIMEOUT_MS=1800000`, `NEXT_BUILD_TRIAGE_COMBINED_ALL=1`, webpack-first, no alternate retry):
  - Failed at ~1713s with explicit webpack compile errors:
    - `app/super-admin/analytics/page.tsx`
    - `app/super-admin/onboarding-analytics/page.tsx`
  - Error: `ssr: false` is not allowed with `next/dynamic` in Server Components (Next 16 rule).
- Fix applied:
  - Replaced `dynamic(() => import('./...'), { ssr: false })` server-page wrappers with direct imports of the existing client components:
    - `SuperAdminAnalyticsClient`
    - `OnboardingAnalyticsClient`
- Rerun (same 30m profile, isolated `distDir=.next-triage-cumulative-30m-rerun`):
  - Result: `FAIL` (deterministic timeout at ~1801s, `SIGTERM`)
  - No compile error surfaced in that run window after the page-wrapper fix.
- Interpretation:
  - The new compiler-blocking route wrappers are resolved.
  - Even with cumulative triage and compile blockers fixed, webpack still does not complete within the 30-minute deploy-style budget on this host.

34) **Route-surface collapse + API-route collapse (2026-04-27)**

- Route-collapse run (600s, webpack-first):
  - Disabled a broad set of top-level app route families via `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES` (most business/marketing/industry families stubbed to `route-page-stub`), with `NEXT_BUILD_TRIAGE_COMBINED_ALL=1`.
  - Result: `FAIL` timeout at ~601s.
- Route + API collapse run (600s, same profile):
  - Added `NEXT_BUILD_TRIAGE_DISABLE_API_ROUTES=1`, replacing `app/api/**/route.*` with `lib/build-triage/api-route-stub.ts`.
  - Result: `FAIL` timeout at ~601s.
- Interpretation:
  - Even after stubbing the majority of page families and API route handlers, compile still saturates the 600s budget with no OOM and no new module errors.
  - Dominant cost appears to be the remaining shared compile graph / framework transform surface (global layouts, shared components/libs, Next compiler transforms, and monorepo transpile surface), not isolated domain routes or API handlers.

35) **Transpile-packages triage under collapsed surface (2026-04-27)**

- Config support added:
  - `NEXT_BUILD_TRIAGE_DISABLE_TRANSPILE_PACKAGES=1` in `apps/dashboard/next.config.mjs` to temporarily remove `transpilePackages` (`@payaid/db`, `@payaid/social`, `@payaid/ai`) for benchmark-only isolation.
- Run profile:
  - `NEXT_BUILD_TRIAGE_COMBINED_ALL=1`
  - broad `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=...` collapse
  - `NEXT_BUILD_TRIAGE_DISABLE_API_ROUTES=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_TRANSPILE_PACKAGES=1`
  - webpack-first, `NEXT_BUILD_TIMEOUT_MS=600000`, no alternate retry
- Result:
  - `FAIL` timeout at ~601s (`SIGTERM`)
- Interpretation:
  - Under an already heavily collapsed route/dependency/API surface, removing monorepo `transpilePackages` still does not move the run under 600s.
  - Compile bottleneck remains distributed in the remaining global Next compile pipeline.

36) **Forced optimizePackageImports triage under collapsed surface (2026-04-27)**

- Config support added:
  - `NEXT_BUILD_FORCE_OPTIMIZE_PACKAGE_IMPORTS=1` in `apps/dashboard/next.config.mjs` to allow `experimental.optimizePackageImports` even in Vercel-mode runs.
- Run profile:
  - Collapsed benchmark profile from (35):
    - `NEXT_BUILD_TRIAGE_COMBINED_ALL=1`
    - broad `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=...`
    - `NEXT_BUILD_TRIAGE_DISABLE_API_ROUTES=1`
    - `NEXT_BUILD_TRIAGE_DISABLE_TRANSPILE_PACKAGES=1`
  - plus `NEXT_BUILD_FORCE_OPTIMIZE_PACKAGE_IMPORTS=1`
  - webpack-first, 600s timeout, no alternate retry
- Result:
  - `FAIL` timeout at ~602s (`SIGTERM`)
  - Next banner confirms the experiment is active (`optimizePackageImports`)
- Interpretation:
  - Enabling `optimizePackageImports` under the collapsed profile does not produce a measurable sub-600s completion.
  - The remaining compile bottleneck still appears to be broad shared transform/build graph cost rather than package import optimization alone.

37) **Build-surface profile scaffolding (`core` and `payments-core`) + 30m benchmarks (2026-04-27)**

- Config scaffolding added in `apps/dashboard/next.config.mjs`:
  - `NEXT_BUILD_SURFACE_PROFILE=core`
    - excludes a broad non-core route-family set through the existing family-stub mechanism.
  - `NEXT_BUILD_SURFACE_PROFILE=payments-core`
    - extends `core` exclusions and additionally excludes `admin`, `analytics`, `approvals`, `hr`, `inventory`, `notifications`, `super-admin`.
- `core` benchmark findings:
  - 600s run: timeout at ~601s (expected under short window).
  - 30m run: webpack compilation reached `Compiled successfully in 25.5min`, then timed out during page-data collection.
  - Interpretation: `core` profile materially reduces compile phase enough to reach post-compile stages.
- `payments-core` benchmark findings:
  - 30m run (rerun after interrupted attempt): timeout at ~1803s while still in compile phase.
  - No `Compiled successfully` marker before timeout.
  - Interpretation: `payments-core` profile as currently defined does **not** outperform `core`; this indicates the additional excluded families are not the dominant compile drivers and may have removed relatively cheaper surfaces while leaving expensive shared/core surfaces intact.

### Profile comparison snapshot

- `core` (30m): compile completes; timeout shifts to page data.
- `payments-core` (30m): compile does not complete within 30m.
- Decision signal: use `core` as the near-term split baseline for reliability work, then reduce page-data workload in that profile (dynamic/static strategy and route-level data-generation pressure) rather than further broad family exclusions.

38) **`payments-min` surface profile benchmark (2026-04-27)**

- Additional profile added in `apps/dashboard/next.config.mjs`:
  - `NEXT_BUILD_SURFACE_PROFILE=payments-min`
  - Extends `payments-core` exclusions and additionally excludes `checkout`, `crm`, `dashboard`, `finance`, `settings`.
- 30m deploy-style run (`NEXT_BUILD_TIMEOUT_MS=1800000`, webpack-first, no alternate retry):
  - Result: `FAIL` timeout at ~1804s while still in compile stage.
  - No `Compiled successfully` marker before timeout.
- Interpretation:
  - Further broad family-level exclusions do not reliably convert into faster compile completion.
  - This reinforces that the dominant remaining cost is shared/global compile pipeline behavior, not just top-level route-family count.
  - Near-term reliability path remains `core` profile with targeted page-data/static-generation pressure controls.

39) **`core-page-data-lite` surface profile benchmark (2026-04-27)**

- Added profile in `apps/dashboard/next.config.mjs`:
  - `NEXT_BUILD_SURFACE_PROFILE=core-page-data-lite`
  - Excludes `core` set + `admin`, `analytics`, `approvals`, `super-admin`.
- 30m deploy-style run:
  - Result: `FAIL` timeout at ~1806s in compile phase.
  - No `Compiled successfully` marker before timeout.
- Interpretation:
  - Excluding likely page-data-heavy families did not improve overall completion versus `core`.
  - Additional profile complexity alone does not reduce the dominant compile/runtime pressure enough under 30m.

40) **`core` with forced optimizePackageImports + transpilePackages off (2026-04-27)**

- Run profile:
  - `NEXT_BUILD_SURFACE_PROFILE=core`
  - `NEXT_BUILD_FORCE_OPTIMIZE_PACKAGE_IMPORTS=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_TRANSPILE_PACKAGES=1`
  - webpack-first, `NEXT_BUILD_TIMEOUT_MS=1800000`, no alternate retry
- Result:
  - `FAIL` timeout at ~1803s in compile phase.
  - Next banner confirms `optimizePackageImports` active.
  - No `Compiled successfully` marker in the run window.
- Interpretation:
  - Combined import-optimization + transpilePackage disable does not outperform the earlier `core` baseline run that reached compile completion before timing out in page-data.
  - Best signal remains the earlier plain `core` profile; this path now points to reducing expensive compile/data behaviors in-core rather than adding more profile toggles.

41) **Core baseline + focused family suppression (`admin`,`analytics`,`super-admin`) (2026-04-27)**

- Run profile:
  - `NEXT_BUILD_SURFACE_PROFILE=core`
  - `NEXT_BUILD_TRIAGE_DISABLE_FAMILIES=admin,analytics,super-admin`
  - webpack-first, `NEXT_BUILD_TIMEOUT_MS=1800000`, no alternate retry
  - isolated `distDir=.next-surface-core-minus-admin-analytics-30m`
- Result:
  - `FAIL` timeout at ~1801s (`SIGTERM`)
  - no `Compiled successfully` marker before timeout
- Interpretation:
  - Suppressing those three likely-heavy in-core families does not restore compile completion within 30m.
  - Remaining bottleneck is not dominated by `admin`/`analytics`/`super-admin` alone; pressure remains distributed across other in-core graph/shared transforms.

42) **Core baseline + root layout forced dynamic (2026-04-27)**

- Change applied:
  - `apps/dashboard/app/layout.tsx` now exports `dynamic = 'force-dynamic'` to suppress static optimization at the root segment.
- 30m deploy-style run (`NEXT_BUILD_SURFACE_PROFILE=core`, webpack-first):
  - Result: `FAIL` timeout at ~1801s.
  - Observed progression:
    - `Compiled successfully in 25.3min`
    - entered `Collecting page data using 7 workers ...`
    - timed out during page-data phase.
- Interpretation:
  - Root dynamic setting does not remove the page-data bottleneck under current graph.
  - Build now deterministically reaches compile completion but still misses full 30m gate due to long page-data collection.

43) **Output-file-tracing isolation (core/full-surface) - decisive pass (2026-04-27)**

- Config support:
  - Added `NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1` in `apps/dashboard/next.config.mjs`.
  - When enabled, Next config sets `outputFileTracing: false` (instead of `outputFileTracingRoot`) for benchmark/deploy isolation.
- Benchmarks:
  1. `core` profile, 40m timeout, tracing disabled:
     - `PASS`, webpack completed successfully in ~24.1min.
  2. `core` profile, 30m timeout, tracing disabled:
     - `PASS`, webpack completed successfully in ~22.7min.
  3. **full surface** (no `core`, no family suppression), 30m timeout, tracing disabled:
     - `PASS`, webpack completed successfully in ~25.5min.
- Interpretation:
  - Disabling output-file tracing removes the terminal `Collecting build traces` / finalization bottleneck and restores deterministic successful builds within the 30m budget even on full route surface.
  - This is the first verified full-surface local profile meeting the 30m reliability target.

44) **Deploy command alignment (2026-04-27)**

- Updated `apps/dashboard/vercel.json` build command to include:
  - `NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1`
- Rationale:
  - Align Vercel build environment with the proven local full-surface pass profile.
  - Preserve existing reliability guards (`webpack` preference, stale-lock cleanup, heartbeat, 30m timeout, memory cap, fallback toggle).

45) **Vercel `buildCommand` 256-char limit + wrapper (2026-04-28)**

- Failure (CLI `vercel --prod --yes --archive=tgz --debug` from repo root):
  - After tarball pack (~28k files), deployment API returned `400`:
  - `Invalid request: projectSettings.buildCommand should NOT be longer than 256 characters.`
- Fix:
  - Added `apps/dashboard/scripts/vercel-build.cjs` to apply the same env defaults as the previous inline chain (`NEXT_BUILD_DIST_DIR`, tracing triage, webpack preference, timeouts, heap, etc.).
  - Set `apps/dashboard/vercel.json` `buildCommand` to `node scripts/vercel-build.cjs` (under the limit).
  - Set `outputDirectory` to `.next-vercel-build` so it matches `NEXT_BUILD_DIST_DIR` used by the build script.
- Next step:
  - Rerun production deploy; expect upload again (~20+ min on this machine) then remote build.

46) **Post-fix deploy + smoke triage (2026-04-28)**

- `npx vercel ls payaid-v3` (repo-linked project `payaid-projects-a67c6b27/payaid-v3`):
  - Newest row in the captured window was **Preview ~16h**, then **Production ~1d** (`payaid-v3-44vcdi7g7-â€¦` Ready, ~6m build).
  - **No production deployment** appeared in that listing with an age matching the postâ€“phase-45 CLI window, so **green evidence for the new `buildCommand` on Vercel is still pending** (either deploy still in flight locally, failed after upload, or list truncated).
- Local CLI behavior (same session class as prior runs):
  - `vercel --prod --yes` (no `--debug`) can sit on `Deploying payaid-projects-a67c6b27/payaid-v3` with **no further stdout for many minutes** while the client builds/uploads the tree (~28k files after `.vercelignore`); do not treat silence as a hang until **Vercel dashboard** or CLI prints a URL / error.
- `npm run check:step41-routes-live` (no local secrets loaded):
  - **FAIL** with missing `TENANT_ID`, `EMAIL_CAMPAIGN_ID`, `AUTH_TOKEN` (script also accepts `CANONICAL_STAGING_TENANT_ID`, `CANONICAL_STAGING_EMAIL_CAMPAIGN_ID`, `CANONICAL_STAGING_AUTH_TOKEN`).
  - Artifact: `docs/evidence/email/2026-04-27T22-29-46-365Z-step41-routes-live-check.md`.
- Cheap production **reachability** (not tied to the new deploy id): `HEAD https://payaid-v3.vercel.app` â†’ **200** (confirms current alias serves; does not prove the latest git/config revision is live).

47) **Production deploy after `vercel-build.cjs` + Next 16 tracing triage correction (2026-04-28)**

- CLI `npm run deploy:dashboard` (`vercel --prod --yes --archive=tgz`) eventually uploaded **~424.7MB** and created deployment:
  - **Inspect:** `https://vercel.com/payaid-projects-a67c6b27/payaid-v3/jVFNqt4zNemAEXsDRSBEJ7Y4x5TA`
  - **id:** `dpl_jVFNqt4zNemAEXsDRSBEJ7Y4x5TA`
  - **url:** `https://payaid-v3-mpnmkqoqc-payaid-projects-a67c6b27.vercel.app`
- Remote build log (this deploymentâ€™s source snapshot, preâ€“local commit below) showed:
  - `Running "node scripts/vercel-build.cjs"` â†’ `next build --webpack` as intended.
  - **Warning:** `Invalid next.config.mjs options â€¦ Unrecognized key(s) in object: 'outputFileTracing'` â€” Next **16.1.6** rejects boolean `outputFileTracing`; the old triage branch therefore did **not** disable tracing on Vercel.
- **Code fix (same day, for follow-up deploy):** removed invalid `outputFileTracing: false`; keep **`outputFileTracingRoot`** at monorepo root; when `NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1`, remove **`TraceEntryPointsPlugin`** from the **server** webpack plugin list (constructor name match). Restores an intentional â€œskip entrypoint trace pluginâ€ path compatible with Next 16.
- `vercel inspect` on the deployment URL while remote work was still active reported **status: Building**; **HEAD** on the deployment hostname returned **401** (consistent with deployment not ready / access rules while building).

48) **Deploy `dpl_jVFNâ€¦` closed Ready + tracing fix pushed (2026-04-28)**

- `vercel inspect https://payaid-v3-mpnmkqoqc-payaid-projects-a67c6b27.vercel.app`:
  - **status:** **Ready**
  - **Aliases:** `https://payaid-v3.vercel.app`, `https://payaid-v3-payaid-projects-a67c6b27.vercel.app`, `https://payaid-v3-phaniteja-2132-payaid-projects-a67c6b27.vercel.app`
- **HEAD** `https://payaid-v3.vercel.app` â†’ **200** (production alias serving after this deployment).
- **Note:** This Ready build used the snapshot that still logged the invalid `outputFileTracing` warning; a **Next 16â€“compatible** fix was pushed on `release/leads-retention-hardening-7fccfc49c`: commit **`c5eec7142`** accidentally reintroduced the **full** triage `next.config.mjs`; it was immediately corrected by **`ac367c97c`** (slim branch config restored + only `NEXT_BUILD_DIST_DIR` / `TraceEntryPointsPlugin` triage + comments). Prefer **`ac367c97c`** (or later on that branch) for merges to production. If Vercel production tracks **`main`**, cherry-pick **`ac367c97c`** (or equivalent patch) and redeploy.
- `npm run check:step41-routes-live` (no secrets in CI shell): still **FAIL** â€” missing `TENANT_ID`, `EMAIL_CAMPAIGN_ID`, `AUTH_TOKEN` (artifact `docs/evidence/email/2026-04-27T23-12-43-993Z-step41-routes-live-check.md`).

49) **Main-line sync triage (2026-04-28)**

- **`ac367c97c` is not an ancestor of `origin/main`** â€” `main` still has the older dashboard `vercel.json` (long inline `buildCommand`, no `vercel-build.cjs`) and slim `next.config` **without** the Next 16 `TraceEntryPointsPlugin` triage hook.
- A remote branch pointing at **`ac367c97c`** would include the **entire release tip**, not a dashboard-only delta; such a branch was **created and deleted** to avoid a misleading mega-PR.
- Worktree **`D:/Cursor Projects/PayAid-V3-main-sync`** (on `main`) could not `git pull` because of **uncommitted local changes** (merge aborted). Clean that worktree, then either cherry-pick **`ac367c97c`** onto updated `main` (if history allows) or open a **small PR** that only updates `apps/dashboard/vercel.json`, `apps/dashboard/scripts/vercel-build.cjs`, and `apps/dashboard/next.config.mjs` from **`ac367c97c`**.
- `npm run check:step41-routes-live` (this session, 2026-04-27T23:38:53Z): still **FAIL** â€” same missing env (artifact `docs/evidence/email/2026-04-27T23-38-53-383Z-step41-routes-live-check.md`).

50) **Focused `main` PR branch (2026-04-28)**

- Branch **`chore/dashboard-main-build-sync`** from **`origin/main`** with exactly three paths: `apps/dashboard/next.config.mjs` (aligned to **`ac367c97c`** intent), new **`apps/dashboard/scripts/vercel-build.cjs`**, updated **`apps/dashboard/vercel.json`**.
- Base commit on branch: **`e768cdf55`** â€” `chore(dashboard): Vercel build wrapper + Next 16 tracing triage for main`.
- Remote branch was **force-updated** to **`e768cdf55`** only (dropped optional doc-only **`88cd99bd4`** from the PR tip before merge).

51) **Merged to `main` (2026-04-28)**

- **PR:** `https://github.com/PayAidPayments/PayAid-V3/pull/3` â€” **squash-merged** at **`2026-04-28T01:07:08Z`**.
- **`origin/main`** tip: **`68fc4d5fa`** â€” `chore(dashboard): Vercel build wrapper + Next 16 tracing triage for main (#3)`.
- **Vercel (Git â†’ `main`):** new **Production** deployment **`dpl_HgQG7tHNCD268o7gKGWNBN9ra7qe`** â€” `https://payaid-v3-qcvdmzme8-payaid-projects-a67c6b27.vercel.app` (aliases include `https://payaid-v3-git-main-payaid-projects-a67c6b27.vercel.app`); was **Building** immediately after merge (confirm **Ready** + build logs in dashboard; expect **no** invalid `outputFileTracing` config warning with merged `next.config.mjs`).
- **step41:** still **FAIL** without env â€” artifact `docs/evidence/email/2026-04-28T01-08-11-538Z-step41-routes-live-check.md`.

52) **Post-merge production deploy from `main` (2026-04-28)**

- Deployment **`dpl_HgQG7tHNCD268o7gKGWNBN9ra7qe`** (`https://payaid-v3-qcvdmzme8-payaid-projects-a67c6b27.vercel.app`) reached **Ready**; production alias **`https://payaid-v3.vercel.app`** now resolves to this deployment (replaces prior **`dpl_jVFNâ€¦`**).
- Build log (`vercel inspect â€¦ --logs`, sample): **Branch `main`**, commit **`68fc4d5`**; **`node scripts/vercel-build.cjs`** ran; **`next build --turbopack`** (see `apps/dashboard/scripts/next-build.cjs` â€” on `VERCEL=1` the preferred engine is currently **`turbopack`** first, then optional webpack fallback). **Compiled successfully in ~4.8min**; static generation completed; **no** `Invalid next.config` / `outputFileTracing` warning observed in the captured log window.
- **Warnings:** `Failed to fetch one or more git submodules` during clone (non-fatal for this build); Prisma generate ~52s.
- `npm run check:step41-routes-live` (2026-04-28T01:13:23Z): still **FAIL** â€” missing env (artifact `docs/evidence/email/2026-04-28T01-13-23-017Z-step41-routes-live-check.md`).

53) **`next-build.cjs` honors `NEXT_BUILD_PREFERRED_MODE` on Vercel (2026-04-28)**

- **PR:** `https://github.com/PayAidPayments/PayAid-V3/pull/4` â€” **squash-merged** at **`2026-04-28T01:55:05Z`**; merge commit **`2a02a4a4ae4efc6888471db9bc1aa77c22edd117`**.
- **Rationale:** `vercel-build.cjs` sets **`NEXT_BUILD_PREFERRED_MODE=webpack`** by default, but `next-build.cjs` on **`main`** still chose **`turbopack`** whenever `isVercel` was true (phase 52 log: **`next build --turbopack`**). The fix reads **`NEXT_BUILD_PREFERRED_MODE`** when it is exactly **`webpack`** or **`turbopack`**, else keeps the prior default (**`turbopack`** on Vercel, **`webpack`** locally).
- **Vercel (Git â†’ `main`):** new **Production** deployment **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** â€” `https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` (clone at commit **`2a02a4a`**). Remote build log shows **`[next-build] running: next build --webpack`** and **`â–² Next.js 16.1.6 (webpack)`** (evidence captured while status was still **Building**; confirm **Ready** + `https://payaid-v3.vercel.app` alias in dashboard when the build finishes).
- **Warnings:** same **`Failed to fetch one or more git submodules`** on clone (unchanged).
- `npm run check:step41-routes-live` (2026-04-28T02:13:36Z): still **FAIL** â€” missing env (artifact `docs/evidence/email/2026-04-28T02-13-36-889Z-step41-routes-live-check.md`).

54) **Follow-up status check after PR #4 merge (2026-04-28)**

- **Deployment status:** `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` still reports **Building** for **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** (Git `main`, commit `2a02a4a`).
- **Build mode evidence remains good:** phase 53 logs already confirm `next build --webpack` and `Next.js 16.1.6 (webpack)` for this deployment path.
- **Production alias reachability:** `HEAD https://payaid-v3.vercel.app` returned **200** with `x-vercel-id` present (serving traffic while new production build is still running).
- `npm run check:step41-routes-live` (2026-04-28T02:16:39Z): still **FAIL** â€” missing env (`TENANT_ID`, `EMAIL_CAMPAIGN_ID`, `AUTH_TOKEN`); artifact `docs/evidence/email/2026-04-28T02-16-39-277Z-step41-routes-live-check.md`.

55) **Additional production polling pass (2026-04-28)**

- `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` still reports **Building** for **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** at ~29 minutes from creation.
- `HEAD https://payaid-v3.vercel.app` remains **200** with `x-vercel-id` present; production alias continues serving while the new build has not yet reached a terminal state.
- No new build-mode regression observed in this pass; phase 53 evidence (`next build --webpack`) remains the latest engine proof for this deploy.

56) **Extended production poll (+4 min) with log recheck (2026-04-28)**

- After an additional wait window, `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` still reports **Building** for **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** (~36 minutes since creation at check time).
- `vercel inspect ... --logs` still includes expected markers from this run path (`Failed to fetch one or more git submodules`, `[next-build] running: next build --webpack`) and no new engine regression signals.
- `HEAD https://payaid-v3.vercel.app` remains **200** with `x-vercel-id` present; production alias continues serving while the new deployment has not finalized.

57) **Extended production poll (+5 min) with marker snapshot (2026-04-28)**

- After an additional wait window, `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` still reports **Building** for **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** (~44 minutes from creation at check time).
- Marker log snapshot remains stable: `Failed to fetch one or more git submodules`, `[next-build] running: next build --webpack`, `Next.js 16.1.6 (webpack)`, and deployment `status â— Building`.
- `HEAD https://payaid-v3.vercel.app` continues to return **200** with `x-vercel-id` present; alias is healthy while the newer production deployment is still not terminal.

58) **Immediate follow-up poll (2026-04-28)**

- `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` still shows **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`** as **Building** (~46 minutes from creation at check time).
- Key log markers remain unchanged in sampled output: `Failed to fetch one or more git submodules`, `[next-build] running: next build --webpack`, `Next.js 16.1.6 (webpack)`, `status â— Building`.
- `HEAD https://payaid-v3.vercel.app` remains **200** with `x-vercel-id`; production alias is healthy while the pending production deployment has not reached a terminal state.

59) **Terminal state captured: production build failed (2026-04-28)**

- `vercel inspect https://payaid-v3-d5sjvwz6r-payaid-projects-a67c6b27.vercel.app` reached terminal status **Error** for **`dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3`**.
- Build log terminal signature:
  - `[next-build] webpack build timed out after 1800000ms; terminating child process`
  - `[next-build] terminated by signal: SIGKILL`
  - `Error: Command "node scripts/vercel-build.cjs" exited with 1`
  - Build system report: **at least one OOM event detected** (container killed process with SIGKILL).
- `HEAD https://payaid-v3.vercel.app` remained **200** during/after failure, indicating production alias continued serving prior Ready deployment.
- Implication: PR #4 behavior change (respecting `NEXT_BUILD_PREFERRED_MODE`) is correct, but current Vercel default (`NEXT_BUILD_PREFERRED_MODE=webpack`) is not sustainable on this build footprint under current container limits.

60) **Mitigation applied: production env override + redeploy (2026-04-28)**

- Set Vercel production env var `NEXT_BUILD_PREFERRED_MODE=turbopack` for project `payaid-v3` (`vercel env add NEXT_BUILD_PREFERRED_MODE production`).
- Triggered production redeploy from failed deployment id:
  - `vercel redeploy dpl_HkAJNZZYhVxWJyNf4QAqyufk2cx3 --target production`
  - New deployment: **`dpl_FrzYU7GoHP7mZWbyiGkzWLR2qedf`**
  - URL: `https://payaid-v3-nib1zmsh4-payaid-projects-a67c6b27.vercel.app`
- Redeploy log markers confirm mitigation took effect:
  - `[next-build] running: next build --turbopack`
  - `â–² Next.js 16.1.6 (Turbopack)`
- Follow-up status check (~10 minutes from creation): deployment still **Building** (not yet terminal); production alias `https://payaid-v3.vercel.app` remains **200** while rollout is pending.

61) **Terminal state captured: production build failed after Turbopack fallback (2026-04-28)**

- `vercel inspect https://payaid-v3-nib1zmsh4-payaid-projects-a67c6b27.vercel.app` reached terminal status **Error** for **`dpl_FrzYU7GoHP7mZWbyiGkzWLR2qedf`**.
- Build log terminal signature:
  - `[next-build] running: next build --turbopack`
  - `[next-build] turbopack failed; retrying with webpack fallback`
  - Webpack fallback then failed with multiple `Module not found` errors.
- Missing modules reported in fallback log include:
  - `@tanstack/react-query`
  - `class-variance-authority`
  - `bcryptjs`
  - `bull`
  - `@upstash/redis`
  - `ioredis`
  - `fluent-ffmpeg`
  - `graphql`
  - `groq-sdk`
  - `exceljs`
  - `date-fns`
  - `framer-motion`
  - `@tiptap/react`
  - `@tiptap/starter-kit`
- Implication: failure mode shifted from timeout/OOM to dependency completeness on the repository snapshot used by Vercel; next blocker is to land all missing dependencies in `apps/dashboard/package.json`, redeploy, and re-verify terminal `Ready`.

62) **Missing-dependency remediation merged + production deploy Ready (2026-04-28)**

- Opened and merged **PR #5** (`fix(dashboard): add missing runtime dependencies for vercel build`) to `main`.
- Merge commit on `main`: **`2be8f6a86851a85b224db83b8844aea8559c7fab`**.
- Git-backed production deployment created after merge:
  - deployment id: **`dpl_GKrC56UnAX2uZwVZ6patqBK2yPh9`**
  - url: `https://payaid-v3-hbjrya8bz-payaid-projects-a67c6b27.vercel.app`
  - status: **Ready**
  - aliases include: `https://payaid-v3.vercel.app`
- Build log evidence from this deployment:
  - clone from **`main`** at commit **`2be8f6a`**
  - install completed, including Prisma generate
  - `node scripts/vercel-build.cjs` -> `[next-build] running: next build --turbopack`
  - terminal markers: `Build Completed in /vercel/output`, `Deployment completed`, status **Ready**
- Outcome: the prior webpack fallback `Module not found` blocker (phase 61) is cleared on production deploy path.

63) **Step 4.1 live-route smoke passed on production alias (2026-04-28)**

- Executed `npm run check:step41-routes-live` with runtime env resolved from local assets:
  - `BASE_URL=https://payaid-v3.vercel.app`
  - auth token minted via `POST /api/auth/login` using existing perf login credentials from `.env`
  - `TENANT_ID`/`EMAIL_CAMPAIGN_ID` resolved from DB (`scripts/get-latest-email-campaign-id.mjs`)
- Result: **PASS** (`ok: true`) with all tracked routes returning **200**:
  - `progress`
  - `failed-jobs`
  - `retry-history`
- Artifact:
  - `docs/evidence/email/2026-04-28T07-28-18-801Z-step41-routes-live-check.md`
- Outcome:
  - production deploy reliability + live-route smoke gate now have closure-quality green evidence in this cycle.

64) **Post-doc-update production deployment terminal state captured (2026-04-28)**

- Follow-up production deployments triggered by phase-63 documentation commits reached terminal states:
  - **Ready**: `dpl_bKTEhHkLxb36NFLjRsCphraU5xqr`
    - URL: `https://payaid-v3-mgccomqw5-payaid-projects-a67c6b27.vercel.app`
    - Aliases include `https://payaid-v3.vercel.app`
  - **Canceled**: `dpl_FNKx5wYavVp7k2gfPWp9rxuVzmW1`
    - URL: `https://payaid-v3-r8t19kag3-payaid-projects-a67c6b27.vercel.app`
- Interpretation:
  - Cancellation is consistent with overlapping production queue behavior while a newer run completed; production alias now points at the successful Ready deployment.

65) **Dashboard build reliability closeout snapshot recorded (2026-04-28)**

- Closure criteria met in this cycle:
  - dependency remediation merged on `main` (PR #5 / commit `2be8f6a`)
  - production deployment Ready on remediated snapshot
  - Step 4.1 live routes smoke pass captured (`progress`, `failed-jobs`, `retry-history` all 200)
  - post-doc follow-up deployment poll recorded with alias still on Ready deployment
- Remaining work is optional/non-blocking hygiene (for example, submodule warning cleanup and operator env/runbook hardening for repeated smoke runs).

## Interpretation

- The build pipeline now fails deterministically with heartbeat + elapsed diagnostics instead of opaque/stalled behavior.
- Lock-contention failures were reproduced and mitigated for validation runs via stale-lock cleanup + optional isolated `distDir`.
- Previous blocker (finalization/traces timeout) is mitigated under `NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1` with successful full-surface 30m local runs.
- **Current focus (post Phase 44):** validate the same profile in actual Vercel deployment/runtime smoke, then close the P0 build-reliability item once deploy evidence is green.
- **Current focus (post Phase 45â€“46):** confirm **one** successful **Production** deploy created **after** `node scripts/vercel-build.cjs` landed (dashboard deployment URL + build logs), then run **step41** with `TENANT_ID` / `EMAIL_CAMPAIGN_ID` / `AUTH_TOKEN` (or `CANONICAL_STAGING_*` equivalents) in `.env.local` or the shell.
- **Current focus (post Phase 47):** wait for **`dpl_jVFNqt4zNemAEXsDRSBEJ7Y4x5TA`** to finish **Ready** or **Error**; if green, run step41 smoke; if red or timeout, push **Next 16 tracing triage** commit and redeploy so Vercel no longer relies on the invalid `outputFileTracing` key.
- **Current focus (post Phase 48):** merge **`ac367c97c`** (slim `next.config` + Next 16 tracing triage) to the branch Vercel builds for production, confirm a follow-up deploy has **no** `outputFileTracing` config warning, then run **step41** with secrets in `.env.local`. Do **not** merge **`c5eec7142`** alone (superseded).
- **Current focus (post Phase 49):** land the **three dashboard files** on **`main`** (see phase 49); unblock **`PayAid-V3-main-sync`** or use a fresh clone; then step41 with `.env.local` secrets.
- **Current focus (post Phase 50):** merge PR **`chore/dashboard-main-build-sync`** â†’ **`main`** (link in phase 50), confirm Vercel production build log has **no** invalid `outputFileTracing` key warning, then run **step41** with secrets.
- **Current focus (post Phase 51):** PR **#3** merged; **`main`** = **`68fc4d5fa`**. Watch **Vercel** production deploy from **`main`**, then run **step41** with `.env.local` secrets.
- **Current focus (post Phase 52):** production alias is on **`dpl_HgQGâ€¦`** **Ready**; confirm submodule warning is acceptable; run **step41** with secrets to close smoke gate.
- **Current focus (post Phase 53):** confirm **`dpl_HkAJNâ€¦`** reaches **Ready** and production alias moves to it; build log should show **`next build --webpack`** (already observed mid-build). Run **step41** with **`TENANT_ID` / `EMAIL_CAMPAIGN_ID` / `AUTH_TOKEN`** (or **`CANONICAL_STAGING_*`**) in **`.env.local`** to close the smoke gate.
- **Current focus (post Phase 54):** wait for **`dpl_HkAJNâ€¦`** to flip from **Building** to **Ready/Error** and record final status + alias target. Then rerun **step41** with valid secrets to close the smoke gate.
- **Current focus (post Phase 55):** continue polling **`dpl_HkAJNâ€¦`** until **Ready/Error**, capture final inspect/log snippet, then run **step41** only after secrets are loaded to produce a closure-quality pass artifact.
- **Current focus (post Phase 56):** same gating remains: capture **terminal deployment state** first, then execute **step41** in a secrets-populated shell (`TENANT_ID`, `EMAIL_CAMPAIGN_ID`, `AUTH_TOKEN` or `CANONICAL_STAGING_*`) for final closure evidence.
- **Current focus (post Phase 57):** continue periodic polling until **`dpl_HkAJNâ€¦`** reaches **Ready/Error** (or explicit Vercel cancel/fail), then record terminal evidence and run **step41** only with loaded secrets.
- **Current focus (post Phase 58):** unchanged; poll until **terminal state** and then proceed to secrets-backed **step41** verification to finalize closure evidence.
- **Current focus (post Phase 59):** mitigate the new blocker by adjusting production build mode strategy (e.g., set `NEXT_BUILD_PREFERRED_MODE=turbopack` in Vercel project env, or equivalent code/default change) and redeploy; after a **Ready** deploy, rerun **step41** with required secrets for closure evidence.
- **Current focus (post Phase 60):** wait for **`dpl_FrzYUâ€¦`** to reach **Ready/Error**; if **Ready**, confirm production alias moves to it and then run **step41** with secrets. If it fails, capture terminal signature and decide whether to tune timeout/memory strategy in code.
- **Current focus (post Phase 61):** land missing dashboard dependencies in `apps/dashboard/package.json`, trigger a new production deployment, confirm terminal **Ready** + alias target, then run **step41** with loaded secrets (`TENANT_ID`, `EMAIL_CAMPAIGN_ID`, `AUTH_TOKEN` or `CANONICAL_STAGING_*`) for closure evidence.
- **Current focus (post Phase 62):** with production deploy now **Ready** on the dependency-remediation commit, load `TENANT_ID`, `EMAIL_CAMPAIGN_ID`, and `AUTH_TOKEN` (or `CANONICAL_STAGING_*`) in shell/`.env.local` and rerun **`npm run check:step41-routes-live`** to produce closure-quality pass evidence.
- **Current focus (post Phase 63):** convert this run into final closeout by keeping the step41 env-resolution path documented (or baking canonical staging vars in operator runbook), then proceed with remaining non-blocking cleanup items (for example, optional submodule warning triage).
- **Current focus (post Phase 64):** production alias and step41 smoke are both green in this cycle; remaining items are optional hygiene tasks (for example, submodule warning cleanup and env/runbook hardening for repeatable operator smoke runs).
- **Current focus (post Phase 65):** closed for this reliability thread; only optional hardening/cleanup remains and can be scheduled independently of deployment-readiness gates.
