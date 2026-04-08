import { Page } from '@playwright/test';

export type WebVitals = {
  lcp: number;
  cls: number;
  inp: number;
};

export async function collectWebVitals(page: Page): Promise<WebVitals> {
  await page.evaluate(() => {
    (window as any).__perfVitals = { lcp: 0, cls: 0, inp: 0 };

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const last = entries[entries.length - 1];
      if (last) (window as any).__perfVitals.lcp = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          (window as any).__perfVitals.cls += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    let maxDuration = 0;
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        const duration = entry.duration || 0;
        if (duration > maxDuration) maxDuration = duration;
      }
      (window as any).__perfVitals.inp = maxDuration;
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);
  });

  await page.waitForTimeout(1200);
  return page.evaluate(() => (window as any).__perfVitals as WebVitals);
}

export async function resourceDurationByUrlPart(
  page: Page,
  urlPart: string
): Promise<number | null> {
  return page.evaluate((part) => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const target = entries.find((entry) => entry.name.includes(part));
    if (!target) return null;
    return target.responseEnd - target.startTime;
  }, urlPart);
}
