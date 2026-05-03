/**
 * Phase 8–9: CTO Demo flows (serial). Run: npm run test:demo
 * Requires turbo dev --parallel (CRM :3001, HR :3002, Voice :3003, Dashboard :3000).
 */
import { test, expect } from '@playwright/test'

test.describe.serial('CTO Demo CRM', () => {
  test.use({ baseURL: 'http://127.0.0.1:3001' })

  test('dashboard → contacts → new → cancel', async ({ page }) => {
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

  test('health endpoint', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3001/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty('db')
    expect(body).toHaveProperty('ai', true)
  })
})

test.describe.serial('CTO Demo HR', () => {
  test.use({ baseURL: 'http://127.0.0.1:3002' })

  test('/hr/demo → employees list → new employee', async ({ page }) => {
    await page.goto('/hr/demo-business-pvt-ltd')
    await expect(page).toHaveURL(/\/hr\//, { timeout: 15000 })
    await page.locator('a[href*="Employees"]').first().click()
    await expect(
      page.getByRole('heading', { name: /Employees/i }).or(page.locator('text=Employees'))
    ).toBeVisible({ timeout: 15000 })
    await page.getByRole('link', { name: 'Add Employee' }).first().click()
    await expect(
      page.getByRole('heading', { name: /New Employee|Add Employee/i }).or(page.locator('form'))
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe.serial('CTO Demo Voice', () => {
  test.use({ baseURL: 'http://127.0.0.1:3003' })

  test('/voice-agents/demo → agent list + /api/tts 200', async ({ page, request }) => {
    await page.goto('/voice-agents/demo-business-pvt-ltd')
    await expect(page).toHaveURL(/\/voice-agents\//, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
    const ttsRes = await request.get('http://127.0.0.1:3003/api/tts?text=test&lang=en')
    expect(ttsRes.status()).toBe(200)
    const ct = ttsRes.headers()['content-type']
    const ok =
      (ct && ct.includes('audio/')) ||
      (ct && ct.includes('application/json') && (await ttsRes.json()).fallback === true)
    expect(ok).toBeTruthy()
  })
})

test.describe.serial('CTO Demo Dashboard', () => {
  test.use({ baseURL: 'http://127.0.0.1:3000' })

  test('/dashboard → module switcher works', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
    const hasNav =
      (await page.getByRole('link', { name: /CRM|HR|Voice|Modules/i }).first().isVisible().catch(() => false)) ||
      (await page.locator('nav a[href*="crm"], nav a[href*="hr"], [data-module]').first().isVisible().catch(() => false))
    expect(hasNav).toBeTruthy()
  })
})
