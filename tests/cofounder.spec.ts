/**
 * AI Co-founder page E2E: boardroom layout, specialists, suggestion chips, context.
 * Run: npx playwright test tests/cofounder.spec.ts
 */
import { test, expect } from '@playwright/test'
import { T } from './fixtures/all-routes'

const COFOUNDER_ROUTE = `/ai-studio/${T}/Cofounder`
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

/** Wait until page shows either Co-founder boardroom content or login form (or timeout) */
async function waitForPageContent(page: import('@playwright/test').Page) {
  await page.goto(new URL(COFOUNDER_ROUTE, BASE_URL).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  })
  // Wait for app to settle: either boardroom or login
  await Promise.race([
    page.getByText(/Plan your next move|Specialists|Co-founder|Choose a question/i).first().waitFor({ state: 'visible', timeout: 60_000 }),
    page.getByText(/Sign in|Log in|Email|Password|PayAid/i).first().waitFor({ state: 'visible', timeout: 60_000 }),
  ]).catch(() => {})
}

/** Only treat as login when URL is /login (avoids false positive from "Email"/"PayAid" in app shell when logged in) */
function isLoginPage(page: import('@playwright/test').Page) {
  return page.url().toLowerCase().includes('/login')
}

function isBoardroomPage(body: string | null) {
  if (body == null) return false
  // Co‑founder may use Unicode hyphen (U+2011); Co-Founder is ASCII
  return (
    /Plan your next move|Specialists|Co[\u2011-]?founder|Choose a question|Ask.*Co-Founder/i.test(body)
  )
}

test.describe('AI Co-founder page', () => {
  test.setTimeout(120_000)

  test('loads boardroom layout or redirects to login', async ({ page }) => {
    await waitForPageContent(page)
    const body = await page.locator('body').textContent()
    const hasBoardroom = isBoardroomPage(body)
    const isLogin = isLoginPage(page)
    expect(hasBoardroom || isLogin, 'Page should show Co-founder boardroom or login').toBe(true)
  })

  test('suggestion chips are present when on Co-founder page', async ({ page }) => {
    await waitForPageContent(page)
    const body = await page.locator('body').textContent()
    if (isLoginPage(page)) {
      test.skip()
      return
    }

    // Wait for empty state and at least one chip (button containing suggestion text)
    const chip = page.getByRole('button').filter({ hasText: /focus on today|Summarise|pipeline|cash flow|churn|improve my business/i }).first()
    await expect(chip).toBeVisible({ timeout: 20_000 })
  })

  test('clicking a suggestion chip does not show application error', async ({ page }) => {
    await waitForPageContent(page)
    const body = await page.locator('body').textContent()
    if (isLoginPage(page)) {
      test.skip()
      return
    }

    const chip = page.getByRole('button').filter({ hasText: /focus on today|Summarise|pipeline|cash flow|churn|improve my business/i }).first()
    await chip.click({ timeout: 15_000 })

    await expect(page.getByText('Application error')).not.toBeVisible({ timeout: 5_000 })
  })
})
