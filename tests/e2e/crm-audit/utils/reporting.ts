import { expect, type Page } from '@playwright/test'

function fileSafe(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function auditFeature(name: string, passed: boolean, page: Page) {
  const status = passed ? 'PASS' : 'FAIL'
  console.log(`[CRM-AUDIT] ${status} - ${name}`)

  if (!passed) {
    try {
      await page.screenshot({
        path: `test-results/crm-audit-failed-${fileSafe(name)}.png`,
        fullPage: true,
      })
    } catch (error) {
      // Avoid masking the original audit failure when the page/context is already closed.
      console.log(
        `[CRM-AUDIT][DIAG] screenshot skipped: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  expect(
    passed,
    `${name} is missing or not detectable (url=${page.url().slice(0, 200)})`
  ).toBeTruthy()
}

export async function auditAICapability(name: string, passed: boolean, page: Page) {
  console.log(`[CRM-AUDIT][AI] ${passed ? 'PASS' : 'FAIL'} - ${name}`)
  await auditFeature(name, passed, page)
}

export async function auditIntegration(name: string, passed: boolean, page: Page) {
  console.log(`[CRM-AUDIT][INTEGRATION] ${passed ? 'PASS' : 'FAIL'} - ${name}`)
  await auditFeature(name, passed, page)
}
