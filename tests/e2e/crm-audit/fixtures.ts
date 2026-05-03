import { expect, type Page } from '@playwright/test'
import { resolvePlaywrightBaseUrl } from '../../playwright-base-url'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type ApiLoginPayload = { token: string; user?: unknown; tenant?: unknown }
let cachedApiLogin: ApiLoginPayload | null = null

/**
 * Retries transient navigation failures common under parallel Playwright + heavy Next dev.
 */
export async function gotoWithRetry(
  page: Page,
  url: string,
  opts: {
    maxAttempts?: number
    navigationTimeout?: number
    waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle'
  } = {}
) {
  const maxAttempts = opts.maxAttempts ?? 3
  // Next dev + cold CRM route compile often exceeds 120s on first hit; leave headroom.
  const navigationTimeout = opts.navigationTimeout ?? 200_000
  const waitUntil = opts.waitUntil ?? 'domcontentloaded'
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(url, {
        waitUntil,
        timeout: navigationTimeout,
      })
      return
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      const msg = lastError.message
      const retryable =
        /ERR_ABORTED|ERR_CONNECTION|ERR_NETWORK|detached|Target page|context was closed|Navigation timeout/i.test(
          msg
        )
      if (!retryable || attempt === maxAttempts) {
        throw lastError
      }
      console.log(`[CRM-AUDIT][NAV] retry ${attempt + 1}/${maxAttempts} ${url.slice(0, 120)}… — ${msg.slice(0, 160)}`)
      await sleep(400 * attempt)
    }
  }
  throw lastError ?? new Error('gotoWithRetry: unknown failure')
}

export async function loginAsTenant(page: Page, tenantSlug = 'demo') {
  const email = process.env.CRM_AUDIT_EMAIL ?? process.env.E2E_EMAIL ?? 'admin@demo.com'
  const password =
    process.env.CRM_AUDIT_PASSWORD ?? process.env.E2E_PASSWORD ?? 'Test@1234'

  const origin = resolvePlaywrightBaseUrl()
  const mask = (s: string) => (s.length <= 3 ? '***' : `${s.slice(0, 2)}…@${s.split('@')[1] ?? ''}`)

  let apiLogin: ApiLoginPayload | null = null
  const uiLoginOnly = process.env.CRM_AUDIT_UI_LOGIN_ONLY === '1'

  console.log(
    `[CRM-AUDIT][AUTH] start origin=${origin} tenantSegment=${tenantSlug} email=${mask(email)}`
  )

  const applyApiLogin = async (payload: ApiLoginPayload) => {
    await page.context().addCookies([
      {
        name: 'token',
        value: payload.token,
        url: origin,
        sameSite: 'Lax',
        httpOnly: false,
        secure: origin.startsWith('https://'),
      },
    ])
    await page.addInitScript((authPayload: ApiLoginPayload) => {
      try {
        localStorage.setItem(
          'auth-storage',
          JSON.stringify({
            state: {
              user: authPayload.user ?? null,
              tenant: authPayload.tenant ?? null,
              token: authPayload.token,
              isAuthenticated: true,
            },
            version: 0,
          })
        )
      } catch {
        /* noop */
      }
    }, payload)
  }

  if (cachedApiLogin && !uiLoginOnly) {
    apiLogin = cachedApiLogin
    console.log('[CRM-AUDIT][AUTH] reusing cached API login token')
    await applyApiLogin(apiLogin)
  }

  // Deterministic auth bootstrap: API login first (faster/less flaky than UI login under heavy local load).
  if (!uiLoginOnly && !apiLogin) {
    for (let attempt = 1; attempt <= 3 && !apiLogin; attempt++) {
      try {
        const loginRes = await page.request.post(`${origin}/api/auth/login`, {
          timeout: 240_000,
          headers: { 'Content-Type': 'application/json' },
          data: { email, password },
        })
        const loginStatus = loginRes.status()
        if (!loginRes.ok()) {
          const txt = await loginRes.text().catch(() => '')
          console.error(
            `[CRM-AUDIT][AUTH] POST /api/auth/login attempt=${attempt} failed status=${loginStatus} body=${txt.slice(0, 400)}`
          )
        } else {
          const payload = (await loginRes.json()) as ApiLoginPayload & { token?: string }
          if (payload?.token) {
            apiLogin = { token: payload.token, user: payload.user, tenant: payload.tenant }
            cachedApiLogin = apiLogin
            const tenantDbg =
              payload.tenant != null ? JSON.stringify(payload.tenant).slice(0, 120) : 'null'
            console.log(`[CRM-AUDIT][AUTH] API login OK tokenLen=${payload.token.length} tenant=${tenantDbg}`)
            await applyApiLogin(apiLogin)
            break
          }
          console.error('[CRM-AUDIT][AUTH] API login JSON missing token; will retry/fallback if needed')
        }
      } catch (e) {
        console.error(
          `[CRM-AUDIT][AUTH] POST /api/auth/login attempt=${attempt} threw: ${e instanceof Error ? e.message : String(e)}`
        )
      }
      if (!apiLogin && attempt < 3) {
        await sleep(750 * attempt)
      }
    }
  } else {
    console.log('[CRM-AUDIT][AUTH] CRM_AUDIT_UI_LOGIN_ONLY=1 — skipping API login bootstrap')
  }

  // Fast-path: API login succeeded and cookie/init-script are in place.
  // Avoid /login navigation in beforeEach (it is often the slowest cold-compile route in local dev).
  if (apiLogin) {
    console.log('[CRM-AUDIT][AUTH] API bootstrap complete — skipping UI login flow')
    return
  }

  console.log('[CRM-AUDIT][AUTH] no API token — falling back to UI login flow')

  // Start from /login to keep auth flow deterministic and avoid heavy CRM-route cold compiles in beforeEach.
  console.log('[CRM-AUDIT][AUTH] goto /login (deterministic auth entry)…')
  await gotoWithRetry(page, `${origin}/login`, {
    navigationTimeout: 120_000,
    maxAttempts: 2,
    waitUntil: 'commit',
  })
  console.log(`[CRM-AUDIT][AUTH] after /login url=${page.url()}`)

  // Complete UI login when on /login.
  if (page.url().toLowerCase().includes('/login')) {
    const emailInput = page.locator('input[name="email"], input[type="email"], #email').first()
    const passwordInput = page.locator('input[name="password"], input[type="password"], #password').first()
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first()
    const shellProbe = page
      .getByTestId('module-switcher')
      .or(page.getByRole('searchbox').first())
      .or(page.getByRole('button', { name: /user menu/i }).first())
      .first()

    // Local dev can briefly route to /login even with an active session. If shell is visible, skip form submit.
    console.log('[CRM-AUDIT][AUTH] on /login — waiting for form or shell…')
    await expect(emailInput.or(shellProbe)).toBeVisible({ timeout: 45_000 })
    if (await emailInput.isVisible().catch(() => false)) {
      console.log('[CRM-AUDIT][AUTH] submitting UI login form…')
      await emailInput.fill(email)
      await passwordInput.fill(password)
      await submitBtn.click()
      await page.waitForURL((u) => !u.pathname.toLowerCase().includes('/login'), { timeout: 45_000 }).catch(() => {})
      console.log(`[CRM-AUDIT][AUTH] after UI submit url=${page.url()}`)
    } else {
      console.log('[CRM-AUDIT][AUTH] shell visible on /login — skipping form submit')
    }
  }

  // Optionally move to Home shell, but do not fail auth bootstrap if this route is compiling.
  console.log(`[CRM-AUDIT][AUTH] warm home shell /home/${tenantSlug} (best-effort)…`)
  await gotoWithRetry(page, `${origin}/home/${tenantSlug}`, {
    navigationTimeout: 45_000,
    maxAttempts: 1,
    waitUntil: 'domcontentloaded',
  }).catch((e) => {
    console.log(
      `[CRM-AUDIT][AUTH] home warm skipped: ${e instanceof Error ? e.message.slice(0, 160) : String(e)}`
    )
  })

  await page.getByText('Verifying authentication...').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {})
  await page.getByText('Loading...').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {})
  console.log(`[CRM-AUDIT][AUTH] waiting for app shell url=${page.url()}`)

  // Module switcher shows current module name (e.g. "CRM"); prefer stable test id + aria-label.
  const modulesBtn = page
    .getByTestId('module-switcher')
    .or(page.getByRole('button', { name: /^modules$/i }))
    .or(page.getByRole('button', { name: /open modules/i }))
    .first()
  const userMenuBtn = page.getByRole('button', { name: /user menu/i }).first()
  const mobileMenuBtn = page.getByRole('button', { name: /open menu/i }).first()
  const topbarSearch = page.getByRole('searchbox').first()
  const loginHeading = page.getByRole('heading', { name: /sign in|log in/i }).first()
  const authShell = modulesBtn.or(userMenuBtn).or(mobileMenuBtn).or(topbarSearch).first()

  // Consider dashboard shell a valid authenticated state for this workspace.
  // Some tenants route to /dashboard first before /crm pages become available.
  await expect(authShell.or(loginHeading)).toBeVisible({ timeout: 75_000 })

  // One recovery attempt for transient blank/cold shell states in local dev.
  if (!(await authShell.isVisible().catch(() => false)) && !(await loginHeading.isVisible().catch(() => false))) {
    await gotoWithRetry(page, `${origin}/home/${tenantSlug}`, {
      maxAttempts: 1,
      navigationTimeout: 45_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {})
    await expect(authShell.or(loginHeading)).toBeVisible({ timeout: 45_000 })
  }

  // If login is still visible, fail early with a clear assertion.
  await expect(loginHeading).not.toBeVisible()

  console.log(`[CRM-AUDIT][AUTH] done url=${page.url()}`)

  // Avoid forcing CRM route navigation in auth bootstrap; each test handles page-specific navigation itself.
}

export async function navigateToModule(page: Page, module: string) {
  const safeModule = module.replace(/^\//, '')
  const origin = resolvePlaywrightBaseUrl()
  await gotoWithRetry(page, `${origin}/${safeModule}`)
}
