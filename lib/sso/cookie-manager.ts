/**
 * Cookie-Based SSO Manager
 * Handles SSO tokens via cookies for subdomain support
 */

/**
 * Set SSO token in cookie (works across subdomains)
 */
export function setSSOCookie(token: string, domain?: string): void {
  if (typeof document === 'undefined') return

  const cookieDomain = domain || getCookieDomain()
  const expires = new Date()
  expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  document.cookie = `sso_token=${token}; expires=${expires.toUTCString()}; path=/; domain=${cookieDomain}; SameSite=Lax; Secure`
}

/**
 * Get SSO token from cookie
 */
export function getSSOCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'sso_token') {
      return value
    }
  }
  return null
}

/**
 * Remove SSO token cookie
 */
export function removeSSOCookie(domain?: string): void {
  if (typeof document === 'undefined') return

  const cookieDomain = domain || getCookieDomain()
  document.cookie = `sso_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${cookieDomain}; SameSite=Lax; Secure`
}

/**
 * Get cookie domain from environment or current hostname
 */
function getCookieDomain(): string {
  if (typeof window === 'undefined') return ''

  const hostname = window.location.hostname
  
  // For localhost, return empty (no domain)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return ''
  }

  // For production, extract base domain (e.g., payaid.com from crm.payaid.com)
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}` // .payaid.com
  }

  return ''
}

/**
 * Validate SSO token from cookie
 */
export async function validateSSOCookie(): Promise<{ valid: boolean; token?: string }> {
  const token = getSSOCookie()
  if (!token) {
    return { valid: false }
  }

  try {
    // Validate token with backend
    const response = await fetch('/api/sso/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      return { valid: true, token }
    }
  } catch (error) {
    console.error('SSO cookie validation error:', error)
  }

  return { valid: false }
}

