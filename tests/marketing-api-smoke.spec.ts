import { test, expect } from '@playwright/test'

/**
 * Marketing API smoke: unauthenticated calls should not return 200 with tenant data.
 * Run: npx playwright test tests/marketing-api-smoke.spec.ts --project=dashboard
 */
test.describe('Marketing API (unauthenticated)', () => {
  test('playbooks GET is not open', async ({ request }) => {
    const res = await request.get('/api/marketing/playbooks')
    expect(res.status(), 'expect 401 or 403 without auth').toBeGreaterThanOrEqual(400)
  })

  test('dashboard enriched GET is not open', async ({ request }) => {
    const res = await request.get('/api/marketing/dashboard/enriched')
    expect(res.status(), 'expect 401 or 403 without auth').toBeGreaterThanOrEqual(400)
  })

  test('text generate POST is not open', async ({ request }) => {
    const res = await request.post('/api/ai/text/generate', {
      data: { prompt: 'test' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status(), 'expect 401 or 403 without auth').toBeGreaterThanOrEqual(400)
  })
})
