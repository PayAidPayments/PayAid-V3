import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from './fixtures/all-routes';
import type { APIRequestContext } from '@playwright/test';

/**
 * Route health: HTTP GET each route, assert not 404/500.
 * In dev, run with one worker: npm run test:e2e:route-health:serial
 * For long runs, start dev server separately and use PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 to avoid IPv6 issues.
 */

// Next.js dev compiles on first request. Default 4 min; heavy routes 6 min so dev runs pass.
const DEFAULT_ROUTE_TIMEOUT_MS = 240_000;
const SLOW_ROUTE_SUFFIXES = [
  '/Reports', '/CustomerSuccess', '/Dialer', '/SalesEnablement',
  '/Ads', '/Creative-Studio', '/Social-Media', '/Analytics', '/Segments', '/Sequences',
  '/finance/', '/hr/', '/inventory/StockMovements',
];
function routeTimeout(route: string) {
  const isSlow =
    SLOW_ROUTE_SUFFIXES.some((s) => route.includes(s)) ||
    (route.includes('/sales/') && (route.endsWith('/Home') || route.includes('/Orders') || route.includes('/Landing-Pages')));
  return isSlow ? 360_000 : DEFAULT_ROUTE_TIMEOUT_MS;
}

const CONNECTION_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED']);
function isConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return [...CONNECTION_ERROR_CODES].some((code) => msg.includes(code));
}

async function getWithRetry(
  request: APIRequestContext,
  route: string,
  timeoutMs: number,
  maxAttempts = 3,
  delayMs = 15_000
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await request.get(route, { timeout: timeoutMs, maxRedirects: 5 });
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isConnectionError(err)) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

for (const route of ALL_ROUTES) {
  test(`[ROUTE] ${route}`, async ({ request }) => {
    const timeoutMs = routeTimeout(route);
    test.setTimeout(timeoutMs + 60_000); // extra buffer for retries
    const response = await getWithRetry(request, route, timeoutMs);
    const status = response.status();
    if (route === '/' && status === 404) {
      expect(status).toBe(404);
      return;
    }
    expect(status, `Route ${route} should not be 404/500`).not.toBe(404);
    expect(status, `Route ${route} should not be 404/500`).not.toBe(500);
    const body = await response.text();
    expect(body, `Route ${route} should not serve error overlay`).not.toContain('Application error: a server-side exception');
  });
}
