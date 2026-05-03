/**
 * Single source of truth for Playwright `baseURL` and absolute CRM audit navigations.
 * Keep host exactly as configured to avoid cross-origin dev-mode behavior (localhost vs 127.0.0.1).
 */
export const PLAYWRIGHT_DEFAULT_BASE_URL = 'http://localhost:3000'

export function resolvePlaywrightBaseUrl(): string {
  const raw = process.env.PLAYWRIGHT_BASE_URL?.trim()
  return (raw ? raw : PLAYWRIGHT_DEFAULT_BASE_URL).replace(/\/$/, '')
}
