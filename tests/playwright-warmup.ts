/**
 * Playwright global warmup: fail fast if the app is down, then prime cold Next.js routes.
 *
 * Opt out: PLAYWRIGHT_SKIP_WARMUP=1
 *
 * Note: Playwright runs globalSetup *before* webServer. If Playwright will start `npm run dev`
 * (local, no PLAYWRIGHT_NO_WEB_SERVER), we skip pre-warm so setup does not fail on a closed port.
 * For priming + fail-fast, use: PLAYWRIGHT_NO_WEB_SERVER=1 with dev already running.
 */

import { resolvePlaywrightBaseUrl } from './playwright-base-url'

const T = process.env.PLAYWRIGHT_TENANT_ID ?? 'demo'

function dashboardBase(): string {
  return resolvePlaywrightBaseUrl()
}

/** Mirrors playwright.config: webServer runs only when not CI and not PLAYWRIGHT_NO_WEB_SERVER. */
function playwrightWillStartWebServer(): boolean {
  if (process.env.CI) return false
  if (process.env.PLAYWRIGHT_NO_WEB_SERVER) return false
  return true
}

async function fetchWithTimeout(url: string, ms: number, label: string): Promise<void> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: { Accept: 'text/html,*/*' },
    })
    if (!res.ok && res.status >= 500) {
      console.warn(`[playwright-warmup] ${label} ${res.status} ${url}`)
    }
  } catch (e) {
    console.warn(`[playwright-warmup] ${label} skipped:`, e instanceof Error ? e.message : e)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Throws if nothing listens on the dashboard base URL within connectMs (fail-fast).
 */
export async function warmPlaywrightServers(): Promise<void> {
  if (process.env.PLAYWRIGHT_SKIP_WARMUP === '1') {
    console.log('[playwright-warmup] PLAYWRIGHT_SKIP_WARMUP=1 — skipping')
    return
  }

  if (playwrightWillStartWebServer()) {
    console.log(
      '[playwright-warmup] Skipping pre-warm (Playwright will start webServer first). ' +
        'For route priming + fail-fast, run dev then PLAYWRIGHT_NO_WEB_SERVER=1.'
    )
    return
  }

  const base = dashboardBase()
  const connectMs = Number(process.env.PLAYWRIGHT_WARMUP_CONNECT_MS ?? 20_000)
  const primeMs = Number(process.env.PLAYWRIGHT_WARMUP_ROUTE_MS ?? 180_000)

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), connectMs)
  try {
    const res = await fetch(base, {
      method: 'GET',
      signal: ac.signal,
      redirect: 'manual',
    })
    clearTimeout(timer)
    if (res.status >= 500) {
      throw new Error(`GET ${base} returned ${res.status}`)
    }
  } catch (e) {
    clearTimeout(timer)
    throw new Error(
      `[playwright-warmup] Cannot reach ${base} within ${connectMs}ms. ` +
        `Start the app (e.g. npm run dev) or unset PLAYWRIGHT_NO_WEB_SERVER to let Playwright start it. ` +
        `Original: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  const paths = [
    ['/login', 'login'],
    [`/ai-studio/${T}/Cofounder`, 'cofounder'],
    [`/marketing/${T}/Home`, 'marketing-home'],
    [`/home/${T}`, 'home'],
  ] as const

  console.log(`[playwright-warmup] Priming ${paths.length} routes on ${base} (timeout ${primeMs}ms each)…`)
  await Promise.all(paths.map(([p, label]) => fetchWithTimeout(`${base}${p}`, primeMs, label)))
  console.log('[playwright-warmup] Done.')
}
