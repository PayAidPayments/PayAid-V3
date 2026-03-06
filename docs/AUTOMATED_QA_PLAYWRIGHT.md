# Automated QA with Playwright (PayAid V3)

Playwright runs as a robot user: it hits every route, checks links and buttons, and reports what’s broken. Used with Cursor-generated tests, this cuts manual QA time significantly.

---

## What gets checked

The suite checks **every page, every same-origin link, and every button** on the platform (see `tests/fixtures/all-routes.ts` for the full list):

1. **Route health** (`tests/route-health.spec.ts`) — HTTP GET each route; must not be 404/500 or show the Next.js error overlay.
2. **Links** (`tests/ui-scanner-impl.ts` [LINKS], entry: `tests/ui-scanner-run.spec.ts`) — On each page, same-origin links are checked (tenant/dashboard/API paths skipped for GET); any ≥ 400 is reported.
3. **Buttons** (`tests/ui-scanner-impl.ts` [BUTTONS]) — On each page, every visible enabled button is clicked; any page that shows "Application error" is reported with the button label.
4. **Flow tests** — Add in `tests/flows/` or `tests/modules/` for critical journeys (create lead, raise invoice, etc.).

---

## Quick start

1. **Start the app** in one terminal (Playwright does *not* auto-start it by default, so you see test output right away):
   ```bash
   npm run dev
   ```

   **Database requirement:** E2E runs require a working PostgreSQL connection (Prisma). If your `DATABASE_URL` points to a remote Supabase pooler and your network blocks it, the dev server will crash and Playwright will show `net::ERR_CONNECTION_RESET` / timeouts. Before running E2E, verify DB connectivity:

   ```bash
   npm run verify:db
   ```

   **Local DB (recommended for stable E2E):** If `verify:db` fails with **"Tenant or user not found"** (Supabase pooler auth), use local Postgres and the `:localdb` scripts:
   ```bash
   npm run db:local:up
   npm run db:local:setup
   npm run verify:db:local
   ```
   Then run **`npm run test:e2e:share:localdb`** (or **`npm run test:e2e:ui-scanner:localdb`**) instead of `test:e2e:share` / `test:e2e:ui-scanner`. Start the app with the same local `DATABASE_URL` (e.g. in `.env` or `cross-env DATABASE_URL=postgresql://payaid:payaid@127.0.0.1:5433/payaid_v3?schema=public npm run dev`).

   **Demo data (no 404/empty support pages):** So that Home KPIs (e.g. "4 employees") match the linked list pages (HR Employees, CRM Deals, Finance Invoices), seed the demo tenant. After `db:local:setup` or main seed, run the shared demo script in Supabase SQL Editor, or ensure `scripts/supabase-seed-demo-home-data.sql` has been applied. That adds 4 employees, 2 deals, 2 tasks, 2 invoices for the demo tenant so support pages show data instead of "Create your first …".

2. **Run E2E tests** in another terminal:
   ```bash
   npm run test:e2e
   ```
   You should see a **list** of tests as they run (one line per test). When done, failures open the HTML report.

   **Optional:** To let Playwright start the dev server for you (no output for 1–2 minutes while Next.js compiles), run:
   ```bash
   set PLAYWRIGHT_START_DEV=1
   npm run test:e2e
   ```

3. **Run only route health**
   ```bash
   npm run test:e2e:route-health
   ```
   In **dev**, Next.js compiles each route on first request, so with multiple workers the run can take hours (many routes × ~2 min each in parallel). Use **one worker** so the server isn’t overloaded; total time is more predictable (~2–3 min per route, one at a time):
   ```bash
   npm run test:e2e:route-health:serial
   ```
   For a **fast** route check, run against a production build: `npm run build && npm run start` (in one terminal), then `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e:route-health` (no on-demand compile).

4. **Run only UI scanner (links + buttons)**  
   Use the dedicated entry so the scanner uses a 5‑min timeout for tenant routes and retries on connection errors:
   ```bash
   npm run test:e2e:ui-scanner
   ```
   This runs **`tests/ui-scanner-run.spec.ts`** → **`tests/ui-scanner-impl.ts`**. There is no `ui-scanner.spec.ts`; the old spec was removed so only this entry is used.

   If your DB is remote/flaky, run the local-DB variant:
   ```bash
   npm run test:e2e:ui-scanner:localdb
   ```

5. **HTML report**
   ```bash
   npm run test:e2e:report
   npm run test:e2e:show-report
   ```

6. **Visual runner (watch mode)**
   ```bash
   npm run test:e2e:ui
   ```

7. **Record a test from your clicks**
   ```bash
   npm run test:e2e:codegen
   ```

8. **Full platform check and share results to Cursor**
   - Start the app: `npm run dev` (wait until Ready).
   - In another terminal run:
     ```bash
     npm run test:e2e:share
     ```
   This runs **every page, every link, every button** (one worker). When it finishes, it writes **`E2E_RESULTS.md`** in the project root with:
   - Summary (passed / failed / flaky / skipped)
   - Failed tests with error details
   - **A "Fix these (paste to Cursor)" section** — a block you can copy and paste into Cursor with the prompt: **"Fix all of these E2E failures in the app."** Cursor will then have the exact list of ROUTE / LINKS / BUTTONS failures and can fix them.
   - To add or change routes, edit **`tests/fixtures/all-routes.ts`** (used by both route-health and ui-scanner).

---

## Share results with Cursor

**Why my long run (e.g. 4h) isn’t in E2E_RESULTS.md**  
`E2E_RESULTS.md` is generated from **`e2e-results.json`**. That file is only updated when Playwright runs *with* the JSON reporter. Previously, only **`npm run test:e2e:share`** enabled it, so:

- If you ran **`npm run test:e2e`** (without `:share`) for 4 hours, the **HTML report** was updated (106 passed, 97 failed, etc.) but **`e2e-results.json`** was *not*, so the markdown still reflected an older run. The 4h results can’t be recovered from the HTML report.
- **Now**, the JSON reporter runs on **every** local run, so any run updates `e2e-results.json`. After a run, run `npx tsx scripts/e2e-results-to-markdown.ts` and the markdown will match the HTML.
- When you use **`npm run test:e2e:share`**, the run also **backs up** `e2e-results.json` into `e2e-results-backups/e2e-results-<timestamp>.json`. To regenerate the markdown from a past share run:  
  `npx tsx scripts/e2e-results-to-markdown.ts e2e-results-backups/e2e-results-<timestamp>.json`

**Why E2E_RESULTS.md might not match the HTML report**  
If you see different numbers (e.g. HTML says 97 failed but the markdown says 11), the markdown was from an older run. Run `npx tsx scripts/e2e-results-to-markdown.ts` after your latest run to refresh it (or pass a backup path as above).

**How to share so Cursor can fix issues**

1. **If you already have the report open** (e.g. at http://localhost:52832/), regenerate the shareable list from the **same** run so the numbers match:
   ```bash
   npx tsx scripts/e2e-results-to-markdown.ts
   ```
   Open **`E2E_RESULTS.md`** in the project root. Copy the whole **"Fix these (paste to Cursor)"** block (the code fence with `E2E failures to fix:` and the list), paste it into Cursor, and say: **"Fix all of these E2E failures in the app."**

2. **If you don’t have `e2e-results.json`** (e.g. you ran from the UI without `PLAYWRIGHT_JSON_REPORT=1`), run the full suite so the file is created, then do step 1:
   ```bash
   npm run test:e2e:share
   ```
   When it finishes, open **`E2E_RESULTS.md`** and paste the "Fix these" block into Cursor as above.

**After a headless run (recommended)**  
Run the full suite with the share script so the markdown file is generated:
```bash
npm run test:e2e:share
```
If **`verify:db`** fails (e.g. Supabase **"Tenant or user not found"**), use local DB and the share script that skips remote DB:
```bash
npm run test:e2e:share:localdb
```
Start the app with local `DATABASE_URL` first (see Quick start → Local DB). When the run finishes, open **`E2E_RESULTS.md`** in the project root. Copy the **"Fix these (paste to Cursor)"** block and paste it into Cursor with: *"Fix all of these E2E failures in the app."*

If Node runs **out of memory** (OOM) during the run, use the memory-safe script:
```bash
npm run test:e2e:share:oom-safe
```
Ensure **`npm run dev`** is already running so the app is at http://localhost:3000; otherwise tests will fail or time out. Route health automatically retries each GET up to 3 times on connection errors (ECONNRESET, ECONNREFUSED, ETIMEDOUT) with a 15s delay, so brief server hiccups are less likely to fail the run.

**After a UI run**  
The UI does not write `e2e-results.json` by default, so `E2E_RESULTS.md` is not auto-generated. You can:

1. **Run the share script** (same tests, headless) to get the markdown:
   ```bash
   npm run test:e2e:share
   ```
   Then use `E2E_RESULTS.md` as above.

2. **Use the HTML report** from your UI run: run `npm run test:e2e:show-report` to open the last report. For each failed test, copy the test name and error message, then paste into Cursor with: *"Fix these E2E failures: [paste list]."*

3. **Next time you use UI**, enable the JSON report so the markdown can be generated after the run:
   ```bash
   # CMD
   set PLAYWRIGHT_JSON_REPORT=1
   npm run test:e2e:ui

   # PowerShell
   $env:PLAYWRIGHT_JSON_REPORT=1; npm run test:e2e:ui
   ```
   After you run tests and close the UI, run `npx tsx scripts/e2e-results-to-markdown.ts`. If `e2e-results.json` was written, **`E2E_RESULTS.md`** will be created and you can use the "Fix these" block as above.

---

## Environment

- **`PLAYWRIGHT_TENANT_ID`** — Tenant ID for tenant-scoped routes. **Default: `cmjptk2mw0000aocw31u48n64`** (Demo Business Pvt Ltd). Most testing uses this tenant; override only when needed.
- **`PLAYWRIGHT_BASE_URL`** — Base URL (default: `http://localhost:3000`). For long runs (e.g. `test:e2e:share`), use `http://127.0.0.1:3000` to avoid IPv6 `::1` connection refused on some systems.

---

## Cursor: generate tests for a new page

After Cursor adds a new page, prompt:

```
Now write a Playwright test for this page in tests/modules/{module}.spec.ts that:
1. Navigates to the route and checks it returns 200 (or acceptable redirect).
2. Checks the top bar nav links are present and not 404.
3. Checks the primary CTA button (New / Create / Add) is visible and clickable.
4. Checks no "Application error" or "404" text appears.
Use tenantId = 'cmjptk2mw0000aocw31u48n64' (Demo Business — or PLAYWRIGHT_TENANT_ID).
```

Then run:

```bash
npm run test:e2e:report
npm run test:e2e:show-report
```

Fix any red failures and re-run until green.

---

## Commands reference

| Command | Purpose |
|--------|--------|
| `npm run test:e2e` | Run all Playwright tests headlessly |
| `npm run test:e2e:ui` | Open Playwright UI (live browser) |
| `npm run test:e2e:headed` | Run tests in a visible browser |
| `npm run test:e2e:route-health` | Run only route health checks |
| `npm run test:e2e:route-health:serial` | Route health with 1 worker (recommended in dev to avoid 9h runs) |
| `npm run test:e2e:report` | Run tests and generate HTML report |
| `npm run test:e2e:show-report` | Open last HTML report |
| `npm run test:e2e:codegen` | Record clicks and generate test code |
| `npm run test:e2e:share` | Run full E2E with 1 worker, then generate `E2E_RESULTS.md` for sharing |
| `npm run test:e2e:share:localdb` | Same as above using local Postgres (no remote DB); use when `verify:db` fails with "Tenant or user not found" |

---

## Adding routes

- **Route health and UI scanner:** Add the path to `ALL_ROUTES` in `tests/fixtures/all-routes.ts` (used by both specs).
- **Flow / module tests:** Add `tests/flows/*.spec.ts` or `tests/modules/{module}.spec.ts` and run with `npm run test:e2e`.

---

## Sharing results

After a run (from the **UI** or the **CLI**), you can share the results like this:

1. **Open the HTML report**
   ```bash
   npm run test:e2e:show-report
   ```
   This opens the last generated report in the browser (same report whether you ran from the UI or the CLI). You can screenshot it or share the report folder.

2. **Report location**
   The report is written to `playwright-report/` (and optionally `test-results/` for traces/screenshots). To share:
   - **Zip and send:** Zip the `playwright-report` folder and send it; the recipient can open `index.html` in a browser.
   - **CI:** In GitHub Actions (or similar), use `playwright report show-report` or upload `playwright-report` as an artifact so each run has a shareable link.

3. **Re-run with report**
   To generate a fresh report and then open it:
   ```bash
   npm run test:e2e:report
   npm run test:e2e:show-report
   ```

---

## Getting all tests green (action plan)

Follow this order to get to a fully passing suite:

1. **Start the app and keep it running**
   ```bash
   npm run dev
   ```
   Wait until you see `Ready` and http://localhost:3000 loads in a browser. Leave this terminal open.

2. **Run route-health with one worker** (avoids timeouts and 9h runs)
   ```bash
   npm run test:e2e:route-health:serial
   ```
   This hits all 77 routes one by one. Expect ~2–4 hours in dev (first request per route can trigger Next.js compile).

3. **Open the report and fix failures**
   ```bash
   npm run test:e2e:show-report
   ```
   For each **failed** test:
   - Open it and check the trace/screenshot/error.
   - **Timeout** → Server was down or slow; re-run with app already warm, or increase timeout in `tests/route-health.spec.ts` if needed.
   - **ECONNRESET / ECONNREFUSED** → Dev server may have crashed or restarted; route-health retries up to 3 times. For long runs, use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` so requests use IPv4 and avoid `::1` connection refused.
   - **404/500** → Fix the route or the app (missing page, wrong path, or backend error).
   - **Application error** in body → Fix the runtime error in the app for that route.

4. **Re-run until route-health is green**
   After fixing issues, run `npm run test:e2e:route-health:serial` again. Repeat until all 77 route tests pass.

5. **Run the full E2E suite (route-health + UI scanner)**
   ```bash
   npm run test:e2e:share
   ```
   Or: `npm run test:e2e` with the app still running. Fix any **ui-scanner** failures (broken links, buttons that crash) the same way: open report → fix app or test → re-run.

6. **Optional: faster runs**
   For quicker feedback, run against a **production** build in another terminal: `npm run build && npm run start`. Then run `npm run test:e2e` (no compile per route, so much faster).

---

## Keeping the next run green

Use this checklist so the next run stays green:

1. **Fix every failure from the last run**
   - In the HTML report, open each failed test and use the trace/screenshot to see what broke.
   - Fix the app or the test (e.g. updated selector, new route, changed copy), then re-run that test or the full suite.

2. **Run route-health in dev with one worker**
   - Use `npm run test:e2e:route-health:serial` so the dev server isn’t overloaded and the run finishes in a predictable time. Use `npm run test:e2e:route-health` only with a production build or if you’re okay with a long run.

3. **Start the app before tests**
   - In one terminal: `npm run dev` (wait until “Ready”). In another: `npm run test:e2e` or `npm run test:e2e:route-health:serial`. If the server isn’t up, route-health and UI-scanner will time out or fail.

4. **When you add a new page, add its route**
   - Add the path to `ALL_ROUTES` in `tests/fixtures/all-routes.ts`. Route-health and ui-scanner both use that list; the new page will be covered by both. Otherwise the new page won’t be covered and future changes might break it without the suite catching it.

5. **Re-run before you push**
   - Run at least `npm run test:e2e:route-health:serial` (and optionally the full `npm run test:e2e`) so you don’t push with failing E2E tests.

---

## CI

In CI, set `CI=1` so Playwright uses the GitHub reporter and does not start a local web server (run `next start` or your app before the test step). Optionally set `PLAYWRIGHT_TENANT_ID` to a seeded test tenant.
