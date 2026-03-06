import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from './fixtures/all-routes';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
// Match route-health: Next.js dev compiles on first request; 3 min avoids timeouts.
const PAGE_TIMEOUT_MS = 180_000;
// Landing page "/" is heavy (animations, images, many modules); allow 5 min for first load.
const LANDING_PAGE_TIMEOUT_MS = 300_000;

/** Check every page: links and buttons. Fail with detailed list so Cursor can fix. */
for (const route of ALL_ROUTES) {
  test(`[LINKS] ${route}`, async ({ page }) => {
    const gotoTimeout = route === '/' ? LANDING_PAGE_TIMEOUT_MS : PAGE_TIMEOUT_MS;
    const linkCheckHeadroom = 120_000; // 2 min for parallel link checks
    test.setTimeout(gotoTimeout + linkCheckHeadroom);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: gotoTimeout });
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

    // Dedupe by pathname+search so hash-only links (/#features, /#pricing) are requested once
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
    const CONCURRENCY = 6; // parallel checks so 18+ links don't exceed test timeout
    const broken: { url: string; status: number }[] = [];

    async function checkOne(href: string): Promise<{ url: string; status: number } | null> {
      try {
        const res = await page.request.get(href, { timeout: LINK_REQUEST_TIMEOUT_MS });
        if (res.status() >= 400) return { url: href, status: res.status() };
        return null;
      } catch {
        return { url: href, status: -1 };
      }
    }

    for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
      const batch = toCheck.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(checkOne));
      for (const r of results) if (r) broken.push(r);
    }

    const detail = broken.length
      ? `Page: ${route}. Broken links (${broken.length}): ${broken.map((b) => `${b.url} → ${b.status}`).join(' | ')}`
      : '';
    expect(broken, detail || `All links on ${route} should return < 400`).toEqual([]);
  });

  test(`[BUTTONS] ${route}`, async ({ page }) => {
    const gotoTimeout = route === '/' ? LANDING_PAGE_TIMEOUT_MS : PAGE_TIMEOUT_MS;
    test.setTimeout(gotoTimeout + 60_000);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: gotoTimeout });
    if (!response || response.status() === 404 || response.status() === 500) {
      expect(response?.status(), `Page ${route} should load`).not.toBe(404);
      return;
    }

    const buttons = page.locator('button:visible:not([disabled])');
    const count = await buttons.count();
    const failed: string[] = [];

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const label = (await btn.textContent())?.trim()?.slice(0, 50) ?? '(no text)';
      const beforeUrl = page.url();

      await btn.click({ force: true, timeout: 3000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));

      const hasError = await page.locator('text=Application error: a server-side exception').isVisible().catch(() => false);
      if (hasError) failed.push(`"${label}" (showed Application error)`);

      if (page.url() !== beforeUrl) await page.goto(route, { waitUntil: 'domcontentloaded', timeout: gotoTimeout });
    }

    const detail = failed.length ? `Page: ${route}. Buttons that caused errors: ${failed.join('; ')}` : '';
    expect(failed, detail || `All buttons on ${route} should not crash`).toEqual([]);
  });
}
