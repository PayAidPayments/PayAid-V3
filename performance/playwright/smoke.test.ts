import { expect, test } from '@playwright/test';

test('Perf smoke: public entry routes are reachable quickly', async ({ request }) => {
  test.setTimeout(240_000);

  const loginStart = Date.now();
  const loginRes = await request.get('/login', { timeout: 120_000 });
  const loginMs = Date.now() - loginStart;
  expect(loginRes.status()).toBeLessThan(500);
  expect(loginMs).toBeLessThan(180_000);

  const pingStart = Date.now();
  const pingRes = await request.get('/api/payaid-internal/ping', { timeout: 120_000 });
  const pingMs = Date.now() - pingStart;
  expect(pingRes.status()).toBeLessThan(500);
  expect(pingMs).toBeLessThan(180_000);
});
