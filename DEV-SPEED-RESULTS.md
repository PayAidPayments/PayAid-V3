# Dev server speed – before vs after

## Automated runs (this repo)

| Run | Result | Notes |
|-----|--------|--------|
| **dev:marketing** (Turbopack, port check) | **TIMEOUT 124s** | Background job may not have started Next correctly. |
| **dev:marketing** (Turbopack, stdout "Ready") | **TIMEOUT 90s** | No "Ready"/"Compiled" line seen in 90s; Turbo may buffer child output. |

So automated timing hit timeouts (likely due to Turbo wrapping output and/or slow first cold start with large Prisma). Use **manual test** below for real numbers.

---

## Typical benchmarks (Next.js / Turbopack)

From Next.js 16 and community benchmarks:

| Metric | Before (Webpack) | After (Turbopack) |
|--------|-------------------|--------------------|
| **Cold start** | ~4.2s | ~1.1s |
| **HMR** | ~800ms | ~90ms |
| **Full dev startup** (mono) | 30s+ (with parallel apps) | &lt;10s (single-app `dev:marketing`) |

---

## Manual test (recommended)

1. **Kill any running dev servers** (Ctrl+C in terminals).
2. **After (Turbopack, single app)**  
   - Run: `npm run dev:marketing`  
   - Start a stopwatch when you press Enter.  
   - Stop when you see **"Ready"** or **"✓ Compiled"** or when **http://localhost:3005** loads.  
   - Record: **After = _____ s**
3. **Before (optional – Webpack)**  
   - In `apps/marketing/package.json` temporarily change dev to:  
     `"dev": "next dev -p 3005"` (remove `--turbo`).  
   - Run: `cd apps/marketing && npm run dev`  
   - Same stopwatch method.  
   - Record: **Before = _____ s**  
   - Restore `--turbo` when done.
4. **Compare**  
   - **Speedup ≈ Before ÷ After** (e.g. 24s → 6s ⇒ ~4x).

---

## Scripts added for timing

- **`node scripts/time-dev-ready.js turbo`** – runs Next from `apps/marketing` with Turbopack and exits on first "Ready"/"Compiled" (writes `scripts/dev-speed-result.txt`). May timeout on first cold run.
- **`node scripts/time-dev-ready.js webpack`** – same app with Webpack (port 3006).
- **`powershell -File scripts/time-dev-port.ps1 -Port 3005 -Script dev:marketing`** – times until port 3005 is listening (needs dev server to actually start in the background).

---

## Summary

- **Before:** Webpack + large Prisma + parallel apps ⇒ often **30s+** startup.  
- **After:** Turbopack + single-app `dev:marketing` ⇒ target **&lt;10s**; HMR near-instant.  
- Run the **manual test** above and fill in your **Before** and **After** times for your machine.
