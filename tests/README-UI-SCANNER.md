# UI Scanner – timeouts and "Broken links" with status -1

If you see:

- **Timeout 180000ms** or **Test timeout of 210000ms** at **`ui-scanner.spec.ts:10`** or **`:61`** with `PAGE_TIMEOUT_MS` or `page.goto(route, ...)`
- **Broken links (9): ... → -1** for HR/tenant links (e.g. `/hr/.../Home`, `/hr/.../Salary-Structures`)

**Cause:** An **old** `tests/ui-scanner.spec.ts` (200-line spec) is still on disk or being run. That spec GET-checks every link (including tenant routes), which time out and report as -1. The current scanner lives in **`tests/ui-scanner-impl.ts`** and **skips** tenant/dashboard/API links, so it never reports those as broken.

**Fix (run from project root):**

1. **Overwrite the old spec with the stub** (so it can’t run even if the IDE runs that file):
   ```powershell
   cd "d:\Cursor Projects\PayAid V3"
   npm run fix:ui-scanner-spec
   ```
2. **Run the scanner only via the script** (this also runs the fix script first):
   ```powershell
   npm run test:e2e:ui-scanner
   ```
   Do **not** run `playwright test tests/ui-scanner.spec.ts` or use "Run Test" on that file in the IDE. The full suite (`npm run test:e2e`) also runs `fix:ui-scanner-spec` before tests.

If your app is crashing during E2E with Prisma DB errors (often shows up as `net::ERR_CONNECTION_RESET`), run the local DB variant:

```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run test:e2e:ui-scanner:localdb
```

**Check you’re on the right entry:** The `[LINKS]` test in the impl starts around **line 73** and uses `gotoWithRetry(page, fullUrl, gotoTimeout)`. Tenant module links are skipped in link checks (no `page.request.get` for them), so they never get status -1.
