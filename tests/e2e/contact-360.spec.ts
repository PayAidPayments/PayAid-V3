import { expect, test } from '@playwright/test'
import { resolvePlaywrightBaseUrl } from '../playwright-base-url'
import { gotoWithRetry, loginAsTenant } from './crm-audit/fixtures'

/** Align with `tests/e2e/crm-audit/crm-audit.spec.ts` for tenant/contact resolution. */
const tenantSlug = process.env.CRM_AUDIT_TENANT ?? 'cmjptk2mw0000aocw31u48n64'
const configuredTenantId = process.env.CRM_AUDIT_TENANT_ID ?? 'cmjptk2mw0000aocw31u48n64'
const configuredContactId = process.env.CRM_AUDIT_CONTACT_ID ?? 'cmnifs4o8000tf2s427rthqoc'

async function crmTenantSegmentFromStorage(page: import('@playwright/test').Page): Promise<string> {
  const u = page.url()
  const m = u.match(/\/crm\/([^/]+)\//)
  if (m?.[1]) {
    const segment = decodeURIComponent(m[1])
    if (segment && !/login/i.test(segment)) return segment
  }
  try {
    const id = await page.evaluate(() => {
      try {
        const raw = window.localStorage.getItem('auth-storage')
        if (!raw) return null
        const p = JSON.parse(raw) as { state?: { tenant?: { id?: string } } }
        return p?.state?.tenant?.id ?? null
      } catch {
        return null
      }
    })
    if (id) return id
  } catch {
    /* noop */
  }
  return configuredTenantId
}

async function installLightStubs(page: import('@playwright/test').Page) {
  await page.route('**/api/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notifications: [], unreadCount: 0, total: 0 }),
    })
  })
  await page.route('**/api/news**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ news: [], items: [] }),
    })
  })
}

test.describe('Contact 360', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 })

  test.beforeEach(async ({ page }) => {
    await installLightStubs(page)
    await loginAsTenant(page, tenantSlug)
    const loginHeading = page.getByRole('heading', { name: /sign in|log in/i }).first()
    if (await loginHeading.isVisible().catch(() => false)) {
      throw new Error('Contact 360 E2E: still on login page after loginAsTenant')
    }
  })

  test('contact detail renders 360 card and profile', async ({ page }) => {
    const base = resolvePlaywrightBaseUrl()
    const seg = configuredTenantId || (await crmTenantSegmentFromStorage(page))
    const contactId = configuredContactId
    const url = `${base}/crm/${seg}/Contacts/${contactId}`

    await gotoWithRetry(page, url, {
      waitUntil: 'commit',
      navigationTimeout: 300_000,
    })
    await page.waitForURL(new RegExp(`/crm/[^/]+/Contacts/${contactId}(/|$)`), { timeout: 60_000 }).catch(() => {})

    await expect(page.getByTestId('crm-contact-detail')).toBeVisible({ timeout: 120_000 })
    await expect(page.getByTestId('crm-contact-360')).toBeVisible({ timeout: 120_000 })
    await expect(page.getByText('Contact Profile', { exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('optional rollup sections expose stable test ids when data exists', async ({ page }) => {
    const base = resolvePlaywrightBaseUrl()
    const seg = configuredTenantId || (await crmTenantSegmentFromStorage(page))
    const contactId = configuredContactId

    await gotoWithRetry(page, `${base}/crm/${seg}/Contacts/${contactId}`, {
      waitUntil: 'commit',
      navigationTimeout: 300_000,
    })

    await expect(page.getByTestId('crm-contact-360')).toBeVisible({ timeout: 120_000 })

    const optional = [
      ['crm-contact-360-quotes', page.getByTestId('crm-contact-360-quotes')],
      ['crm-contact-360-finance', page.getByTestId('crm-contact-360-finance')],
      ['crm-contact-360-activity', page.getByTestId('crm-contact-360-activity')],
      ['crm-contact-360-insights', page.getByTestId('crm-contact-360-insights')],
      ['crm-contact-360-duplicates', page.getByTestId('crm-contact-360-duplicates')],
    ] as const

    const visible = await Promise.all(
      optional.map(async ([, loc]) => loc.isVisible().catch(() => false))
    )
    const anySection = visible.some(Boolean)
    if (!anySection) {
      test.info().annotations.push({
        type: 'note',
        description:
          'No optional 360 sections visible (no data for this contact). Seed quotes/invoices or use a richer contact.',
      })
    }

    const activity = page.getByTestId('crm-contact-360-activity')
    if (await activity.isVisible().catch(() => false)) {
      const inboxLink = page.getByTestId('crm-contact-360-inbox-link')
      await expect(inboxLink).toBeVisible()
      await expect(inboxLink).toHaveAttribute('href', `/crm/${seg}/inbox`)
    }
  })

  test('account detail page', async ({ page }) => {
    const accountId = process.env.CRM_AUDIT_ACCOUNT_ID
    test.skip(!accountId, 'Set CRM_AUDIT_ACCOUNT_ID to run account detail E2E')

    const base = resolvePlaywrightBaseUrl()
    const seg = configuredTenantId || (await crmTenantSegmentFromStorage(page))

    await gotoWithRetry(page, `${base}/crm/${seg}/Accounts/${accountId}`, {
      waitUntil: 'commit',
      navigationTimeout: 300_000,
    })

    await expect(page.getByTestId('crm-account-detail')).toBeVisible({ timeout: 120_000 })
  })
})
