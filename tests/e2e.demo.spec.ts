/**
 * Phase 8: CTO Demo flows – dashboard → contacts → new → back.
 * Run: npm run test:demo (requires turbo dev --parallel or CRM on :3001).
 */
import { test, expect } from '@playwright/test'

test.describe.serial('CTO Demo', () => {
  test.use({ baseURL: 'http://127.0.0.1:3001' })

  test('CRM: dashboard → contacts → new → back', async ({ page }) => {
    await page.goto('/crm/demo-business-pvt-ltd/dashboard')
    await page.locator('a[href*="contacts"]').first().click()
    await expect(page.getByRole('heading', { name: /Contacts/i })).toBeVisible({ timeout: 15000 })
    await page.getByRole('link', { name: 'New Contact' }).first().click()
    await expect(
      page.getByRole('heading', { name: 'New Contact' }).or(page.locator('[data-testid="contact-form"]'))
    ).toBeVisible({ timeout: 10000 })
    await page.getByRole('link', { name: 'Cancel' }).first().click()
    await expect(page).toHaveURL(/\/Contacts(\?|$)/)
  })

  test('CRM: health endpoint', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3001/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty('db')
    expect(body).toHaveProperty('ai', true)
  })
})

test.describe.serial('CTO Demo HR', () => {
  test.use({ baseURL: 'http://127.0.0.1:3002' })

  test('HR: dashboard loads', async ({ page }) => {
    await page.goto('/hr/demo-business-pvt-ltd')
    await expect(page).toHaveURL(/\/hr\//)
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })
})

test.describe.serial('CTO Demo Voice', () => {
  test.use({ baseURL: 'http://127.0.0.1:3003' })

  test('Voice: TTS fallback', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3003/api/tts?text=test&lang=en')
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type']
    const ok = ct?.includes('audio/') || (ct?.includes('application/json') && (await res.json()).fallback === true)
    expect(ok).toBeTruthy()
  })
})
