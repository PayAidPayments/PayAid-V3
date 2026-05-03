/**
 * UI scanner implementation: 5 min timeout for tenant routes, gotoWithRetry; skips tenant/dashboard/API link GETs.
 * Entry: tests/ui-scanner-run.spec.ts (run with npm run test:e2e:ui-scanner).
 */
import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from './fixtures/all-routes';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const SHORT_NAV_TIMEOUT_MS = 180_000;
const EXTENDED_GOTO_TIMEOUT_MS = 300_000;
const EXTENDED_GOTO_ROUTES = new Set(['/', '/login', '/signup']);
const isTenantModuleRoute = (path: string) =>
  /^\/(crm|finance|hr|inventory|marketing|sales|projects|productivity|spreadsheet|industry-intelligence|ai-studio)\/[^/]+\//.test(path);

test.describe('ui-scanner', () => {
  test.describe.configure({ mode: 'serial' });

  test('[sanity] entry spec is loader only', () => {
    const path = require('path');
    const fs = require('fs');
    const entryPath = path.join(process.cwd(), 'tests', 'ui-scanner-run.spec.ts');
    const content = fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
    const hasOldPattern = content.split('\n').some(
      (l) => l.includes('page.goto(route') && l.includes('PAGE_TIMEOUT_MS') && !l.trim().startsWith('*') && !l.trim().startsWith('//')
    );
    expect(hasOldPattern, `${entryPath} must be loader only (import impl). Run: npm run test:e2e:ui-scanner`).toBe(false);
  });

  const CONNECTION_ERROR_MARKERS = [
    'net::ERR_CONNECTION_RESET', 'net::ERR_CONNECTION_REFUSED', 'net::ERR_CONNECTION_ABORTED',
    'net::ERR_CONNECTION_CLOSED', 'net::ERR_TIMED_OUT', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
  ];
  function isConnectionError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return CONNECTION_ERROR_MARKERS.some((m) => msg.includes(m));
  }
  async function gotoWithRetry(page: any, url: string, gotoTimeout: number) {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: gotoTimeout });
      } catch (err) {
        lastErr = err;
        if (attempt < 2 && isConnectionError(err)) {
          await new Promise((r) => setTimeout(r, 10_000));
          continue;
        }
        throw lastErr;
      }
    }
    throw lastErr;
  }

  for (const route of ALL_ROUTES) {
    test(`[LINKS] ${route}`, async ({ page }) => {
      const gotoTimeout =
        EXTENDED_GOTO_ROUTES.has(route) || isTenantModuleRoute(route) ? EXTENDED_GOTO_TIMEOUT_MS : SHORT_NAV_TIMEOUT_MS;
      test.setTimeout(gotoTimeout + 120_000);
      page.context().setDefaultNavigationTimeout(gotoTimeout);
      page.setDefaultNavigationTimeout(gotoTimeout);
      const fullUrl = new URL(route, baseURL).toString();
      await page.request.get(fullUrl, { timeout: gotoTimeout }).catch(() => {});
      const response = await gotoWithRetry(page, fullUrl, gotoTimeout);
      if (!response || response.status() === 404 || response.status() === 500) {
        expect(response?.status(), `Page ${route} should load (not 404/500)`).not.toBe(404);
        expect(response?.status()).not.toBe(500);
        return;
      }

      const links = await page.$$eval('a[href]', (els) =>
        (els as HTMLAnchorElement[])
          .map((el) => el.href)
          .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('javascript:'))
      );
      const sameOrigin = links.filter((href) => {
        try {
          return new URL(href).origin === new URL(baseURL).origin;
        } catch {
          return false;
        }
      });
      const seen = new Set<string>();
      const toCheck = sameOrigin.filter((href) => {
        try {
          const u = new URL(href);
          const key = u.pathname + u.search;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        } catch {
          return true;
        }
      });

      const LINK_REQUEST_TIMEOUT_MS = 25_000;
      const CONCURRENCY = 6;
      const broken: { url: string; status: number }[] = [];
      const baseOrigin = new URL(baseURL).origin;
      const isTenantModulePath = (pathname: string) =>
        /^\/(crm|finance|hr|inventory|marketing|sales|projects|productivity|spreadsheet|industry-intelligence|ai-studio|meet|settings)\/[^/]+\//.test(pathname);
      const isDashboardOrAppPath = (pathname: string) =>
        pathname.startsWith('/dashboard/') || pathname === '/dashboard' || /^\/(approvals|notifications)\//.test(pathname);
      const isApiPath = (pathname: string) => pathname.startsWith('/api/');

      async function checkOne(href: string): Promise<{ url: string; status: number } | null> {
        const u = new URL(href);
        const urlToRequest = u.origin === baseOrigin ? new URL(u.pathname + u.search, baseURL).toString() : href;
        // Never GET-check tenant module routes; they may require auth and will produce false -1/404s.
        if (isTenantModulePath(u.pathname)) return null;
        if (isDashboardOrAppPath(u.pathname)) return null;
        if (isApiPath(u.pathname)) return null;
        try {
          const res = await page.request.get(urlToRequest, { timeout: LINK_REQUEST_TIMEOUT_MS });
          if (res.status() >= 400) return { url: href, status: res.status() };
          return null;
        } catch {
          return { url: href, status: -1 };
        }
      }

      const batches = Math.ceil(toCheck.length / CONCURRENCY);
      test.setTimeout(gotoTimeout + batches * LINK_REQUEST_TIMEOUT_MS + 30_000);
      for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
        const results = await Promise.all(toCheck.slice(i, i + CONCURRENCY).map(checkOne));
        for (const r of results) if (r) broken.push(r);
      }
      const detail = broken.length
        ? `Page: ${route}. Broken links (${broken.length}): ${broken.map((b) => `${b.url} → ${b.status}`).join(' | ')}`
        : '';
      expect(broken, detail || `All links on ${route} should return < 400`).toEqual([]);
    });

    test(`[BUTTONS] ${route}`, async ({ page }) => {
      const gotoTimeout =
        EXTENDED_GOTO_ROUTES.has(route) || isTenantModuleRoute(route) ? EXTENDED_GOTO_TIMEOUT_MS : SHORT_NAV_TIMEOUT_MS;
      const MAX_BUTTONS_TO_CLICK = 12;
      const buttonPhaseMs = MAX_BUTTONS_TO_CLICK * 30_000;
      test.setTimeout(gotoTimeout + buttonPhaseMs + 30_000);
      page.context().setDefaultNavigationTimeout(gotoTimeout);
      page.setDefaultNavigationTimeout(gotoTimeout);
      const fullUrl = new URL(route, baseURL).toString();
      await page.request.get(fullUrl, { timeout: gotoTimeout }).catch(() => {});
      const response = await gotoWithRetry(page, fullUrl, gotoTimeout);
      if (!response || response.status() === 404 || response.status() === 500) {
        expect(response?.status(), `Page ${route} should load`).not.toBe(404);
        return;
      }
      const failed: string[] = [];
      const isPageClosed = (e: unknown) =>
        String(e).includes('Target page') || String(e).includes('context or browser has been closed');
      for (let i = 0; i < MAX_BUTTONS_TO_CLICK; i++) {
        try {
          // Re-resolve buttons each loop; clicking can re-render and detach previous handles.
          const buttons = page.locator('button:visible:not([disabled])');
          const count = await buttons.count();
          if (i >= count) break;

          const btn = buttons.nth(i);
          const label =
            (await btn
              .textContent({ timeout: 1500 })
              .then((t) => t?.trim()?.slice(0, 50))
              .catch(() => null)) ?? '(no text)';
          const beforeUrl = page.url();
          await btn.click({ force: true, timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(400);
          const hasError = await page.locator('text=Application error: a server-side exception').isVisible().catch(() => false);
          if (hasError) failed.push(`"${label}" (showed Application error)`);
          if (page.url() !== beforeUrl) await gotoWithRetry(page, fullUrl, gotoTimeout);
        } catch (e) {
          if (isPageClosed(e)) break;
          throw e;
        }
      }
      const detail = failed.length ? `Page: ${route}. Buttons that caused errors: ${failed.join('; ')}` : '';
      expect(failed, detail || `All buttons on ${route} should not crash`).toEqual([]);
    });
  }
});
