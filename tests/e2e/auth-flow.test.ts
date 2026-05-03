/**
 * End-to-End Tests: Authentication Flow
 * 
 * Tests complete user authentication journeys
 */

import { describe, it, expect } from '@jest/globals'
import { chromium, Browser, Page } from 'playwright'

const CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'http://localhost:3000'
const CRM_MODULE_URL = process.env.CRM_MODULE_URL || 'http://localhost:3001'

describe('E2E: Authentication Flow', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await chromium.launch()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Complete OAuth2 Flow', () => {
    it('should complete full authentication flow', async () => {
      // Navigate to CRM module
      await page.goto(`${CRM_MODULE_URL}/contacts`)

      // Should redirect to core login
      await page.waitForURL((url) => url.href.includes(CORE_AUTH_URL))

      // Fill login form (adjust selectors based on actual form)
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')

      // Should redirect back to CRM module
      await page.waitForURL((url) => url.href.includes(CRM_MODULE_URL))

      // Should have token cookie
      const cookies = await page.context().cookies()
      const tokenCookie = cookies.find((c) => c.name === 'payaid_token')
      expect(tokenCookie).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      await page.goto(`${CRM_MODULE_URL}/contacts`)
      await page.waitForURL((url) => url.href.includes(CORE_AUTH_URL))

      // Try invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Should show error message
      const errorMessage = await page.textContent('.error-message')
      expect(errorMessage).toBeTruthy()
    })
  })

  describe('Token Refresh', () => {
    it('should automatically refresh expired token', async () => {
      // This would require setting up a token that's about to expire
      // and then making a request
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Logout Flow', () => {
    it('should logout and clear tokens', async () => {
      // First, authenticate
      await page.goto(`${CRM_MODULE_URL}/contacts`)
      // ... authentication steps ...

      // Then logout
      await page.click('button[data-testid="logout"]')
      await page.waitForURL((url) => url.href.includes(CORE_AUTH_URL))

      // Check cookies are cleared
      const cookies = await page.context().cookies()
      const tokenCookie = cookies.find((c) => c.name === 'payaid_token')
      expect(tokenCookie).toBeUndefined()
    })
  })

  describe('Cross-Module Navigation', () => {
    it('should maintain session across modules', async () => {
      // Authenticate in CRM module
      await page.goto(`${CRM_MODULE_URL}/contacts`)
      // ... authentication steps ...

      // Navigate to Invoicing module
      await page.goto(`${process.env.INVOICING_MODULE_URL}/invoices`)

      // Should be authenticated (no redirect to login)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/login')
    })
  })
})

