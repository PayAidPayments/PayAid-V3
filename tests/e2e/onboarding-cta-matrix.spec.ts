import { expect, test } from '@playwright/test'

type CtaCheck = {
  label: string
  selector: string
}

async function expectCtaRoutesToIndustrySelector(
  page: import('@playwright/test').Page,
  path: string,
  checks: CtaCheck[]
) {
  for (const check of checks) {
    await test.step(`${path} → ${check.label}`, async () => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      const cta = page.locator(check.selector).first()
      await expect(cta, `CTA not found: ${check.label}`).toBeVisible()

      await Promise.all([
        page.waitForURL(/#industry-selector/),
        cta.click(),
      ])

      await expect(page.locator('#industry-selector')).toBeVisible()
      await expect(page).toHaveURL(/#industry-selector/)
    })
  }
}

test('Onboarding CTA matrix routes to industry selector', async ({ page }) => {
  await expectCtaRoutesToIndustrySelector(page, '/', [
    { label: 'home header CTA', selector: 'header a[href="/#industry-selector"]' },
    { label: 'home hero CTA', selector: 'section a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/pricing', [
    { label: 'pricing header CTA', selector: 'header a[href="/#industry-selector"]' },
    { label: 'pricing plan CTA', selector: '.pricing-card a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/features', [
    { label: 'features header CTA', selector: 'header a[href="/#industry-selector"]' },
    { label: 'features final CTA', selector: 'section a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/blog', [
    { label: 'blog header CTA', selector: 'header a[href="/#industry-selector"]' },
    { label: 'blog final CTA', selector: 'section a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/login', [
    { label: 'login signup prompt', selector: 'a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/about', [
    { label: 'about header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/contact', [
    { label: 'contact header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/privacy-policy', [
    { label: 'privacy header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/terms-of-service', [
    { label: 'terms header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/security', [
    { label: 'security header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])

  await expectCtaRoutesToIndustrySelector(page, '/careers', [
    { label: 'careers header CTA', selector: 'header a[href="/#industry-selector"]' },
  ])
})

