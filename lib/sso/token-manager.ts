/**
 * SSO Token Manager for Decoupled Architecture
 * Handles cross-module authentication and token passing
 */

import { JWTPayload } from '../auth/jwt'

export interface SSOToken {
  token: string
  expiresAt: number
  modules: string[] // List of modules user has access to
  tenantId: string
  userId: string
}

/**
 * Generate SSO token for cross-module navigation
 * This token can be passed between subdomains
 */
export function generateSSOToken(payload: JWTPayload & { token?: string }): SSOToken {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000 // 8 hours

  return {
    token: (payload as any).token || '', // Use existing JWT token if available
    expiresAt,
    modules: payload.licensedModules || [],
    tenantId: payload.tenantId,
    userId: payload.userId,
  }
}

/**
 * Store SSO token in localStorage (for cross-subdomain access)
 */
export function storeSSOToken(ssoToken: SSOToken): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('payaid_sso_token', JSON.stringify(ssoToken))
    // Also store in sessionStorage for current session
    sessionStorage.setItem('payaid_sso_token', JSON.stringify(ssoToken))
  }
}

/**
 * Get SSO token from storage
 */
export function getSSOToken(): SSOToken | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('payaid_sso_token')
    if (!stored) return null

    const ssoToken: SSOToken = JSON.parse(stored)
    
    // Check if token is expired
    if (Date.now() > ssoToken.expiresAt) {
      localStorage.removeItem('payaid_sso_token')
      sessionStorage.removeItem('payaid_sso_token')
      return null
    }

    return ssoToken
  } catch (error) {
    return null
  }
}

/**
 * Clear SSO token
 */
export function clearSSOToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('payaid_sso_token')
    sessionStorage.removeItem('payaid_sso_token')
  }
}

/**
 * Get module URL for navigation
 * If tenantId is provided, returns full path with tenantId
 * Otherwise returns entry point URL
 */
export function getModuleUrl(moduleId: string, tenantId?: string): string {
  // If tenantId is provided and valid, return full path
  if (tenantId && typeof tenantId === 'string' && tenantId.trim()) {
    // AI modules redirect to ai-studio sub-pages, but we still create the Home route for consistency
    const aiModuleMap: Record<string, string> = {
      'ai-cofounder': `/ai-studio/${tenantId}/Cofounder`,
      'ai-chat': `/ai-studio/${tenantId}/Chat`,
      'ai-insights': `/ai-studio/${tenantId}/Insights`,
      'website-builder': `/ai-studio/${tenantId}/Websites`,
      'logo-generator': `/ai-studio/${tenantId}/Logos`,
      'knowledge-rag': `/ai-studio/${tenantId}/Knowledge`,
    }
    
    // If it's an AI module, return the ai-studio path directly (Home route will redirect)
    if (aiModuleMap[moduleId]) {
      // Return the Home route which will redirect to the actual page
      return `/${moduleId}/${tenantId}/Home/`
    }
    
    // For other modules, use the standard Home route
    return `/${moduleId}/${tenantId}/Home/`
  }

  // Otherwise return entry point (will redirect)
  const moduleUrls: Record<string, string> = {
    crm: process.env.NEXT_PUBLIC_CRM_URL || '/crm',
    sales: process.env.NEXT_PUBLIC_SALES_URL || '/sales',
    finance: process.env.NEXT_PUBLIC_FINANCE_URL || '/finance',
    marketing: process.env.NEXT_PUBLIC_MARKETING_URL || '/marketing',
    hr: process.env.NEXT_PUBLIC_HR_URL || '/hr',
    projects: process.env.NEXT_PUBLIC_PROJECTS_URL || '/projects',
    inventory: process.env.NEXT_PUBLIC_INVENTORY_URL || '/inventory',
    'ai-cofounder': process.env.NEXT_PUBLIC_AI_COFOUNDER_URL || '/ai-studio',
    'ai-chat': process.env.NEXT_PUBLIC_AI_CHAT_URL || '/ai-studio',
    'ai-insights': process.env.NEXT_PUBLIC_AI_INSIGHTS_URL || '/ai-studio',
    'website-builder': process.env.NEXT_PUBLIC_WEBSITE_BUILDER_URL || '/ai-studio',
    'logo-generator': process.env.NEXT_PUBLIC_LOGO_GENERATOR_URL || '/ai-studio',
    'knowledge-rag': process.env.NEXT_PUBLIC_KNOWLEDGE_RAG_URL || '/ai-studio',
  }

  // For now, use current domain with module prefix
  // In production, these will be separate subdomains
  if (typeof window !== 'undefined') {
    const currentHost = window.location.host
    const isLocalhost = currentHost.includes('localhost') || currentHost.includes('127.0.0.1')
    
    if (isLocalhost) {
      // Development: use same domain with path prefix
      return `/${moduleId}`
    }
  }

  return moduleUrls[moduleId] || `/${moduleId}`
}

/**
 * Navigate to another module with SSO token
 */
export function navigateToModule(moduleId: string, ssoToken?: SSOToken): void {
  if (typeof window === 'undefined') return

  const token = ssoToken || getSSOToken()
  if (!token) {
    console.error('No SSO token available')
    return
  }

  const moduleUrl = getModuleUrl(moduleId)
  const url = new URL(moduleUrl, window.location.origin)
  
  // Pass token as query parameter (for now)
  // In production with separate subdomains, use cookie-based SSO
  url.searchParams.set('sso_token', token.token)
  url.searchParams.set('tenant_id', token.tenantId)
  url.searchParams.set('user_id', token.userId)

  window.location.href = url.toString()
}

/**
 * Validate SSO token from query parameter
 */
export function validateSSOTokenFromQuery(): SSOToken | null {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('sso_token')
  const tenantId = urlParams.get('tenant_id')
  const userId = urlParams.get('user_id')

  if (!token || !tenantId || !userId) {
    // Try to get from cookie if not in query
    try {
      const { getSSOCookie } = require('./cookie-manager')
      const cookieToken = getSSOCookie()
      if (cookieToken) {
        // Create SSO token from cookie
        const ssoToken: SSOToken = {
          token: cookieToken,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
          modules: [],
          tenantId: '',
          userId: '',
        }
        storeSSOToken(ssoToken)
        return ssoToken
      }
    } catch (error) {
      // Cookie manager not available
    }
    return null
  }

  // Store the token for future use
  const ssoToken: SSOToken = {
    token,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    modules: [], // Will be populated from token payload
    tenantId,
    userId,
  }

  storeSSOToken(ssoToken)
  
  // Also set cookie for subdomain support
  try {
    const { setSSOCookie } = require('./cookie-manager')
    setSSOCookie(token)
  } catch (error) {
    // Cookie manager not available, continue with localStorage
  }
  
  // Clean URL
  const cleanUrl = new URL(window.location.href)
  cleanUrl.searchParams.delete('sso_token')
  cleanUrl.searchParams.delete('tenant_id')
  cleanUrl.searchParams.delete('user_id')
  window.history.replaceState({}, '', cleanUrl.toString())

  return ssoToken
}

