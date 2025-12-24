/**
 * Module Navigation Utilities
 * 
 * Handles cross-module navigation with OAuth2 SSO
 * Routes to module subdomains when modules are deployed separately
 */

export interface ModuleConfig {
  moduleId: string
  subdomain?: string
  baseUrl?: string
  dashboardPath: string
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  crm: {
    moduleId: 'crm',
    subdomain: 'crm',
    baseUrl: process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001',
    dashboardPath: '/dashboard',
  },
  finance: {
    moduleId: 'finance',
    subdomain: 'finance',
    baseUrl: process.env.NEXT_PUBLIC_FINANCE_URL || 'http://localhost:3002',
    dashboardPath: '/dashboard',
  },
  hr: {
    moduleId: 'hr',
    subdomain: 'hr',
    baseUrl: process.env.NEXT_PUBLIC_HR_URL || 'http://localhost:3003',
    dashboardPath: '/dashboard',
  },
  marketing: {
    moduleId: 'marketing',
    subdomain: 'marketing',
    baseUrl: process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3004',
    dashboardPath: '/dashboard',
  },
  whatsapp: {
    moduleId: 'whatsapp',
    subdomain: 'whatsapp',
    baseUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || 'http://localhost:3005',
    dashboardPath: '/dashboard',
  },
  analytics: {
    moduleId: 'analytics',
    subdomain: 'analytics',
    baseUrl: process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3006',
    dashboardPath: '/dashboard',
  },
  'ai-studio': {
    moduleId: 'ai-studio',
    subdomain: 'ai',
    baseUrl: process.env.NEXT_PUBLIC_AI_STUDIO_URL || 'http://localhost:3007',
    dashboardPath: '/dashboard',
  },
  communication: {
    moduleId: 'communication',
    subdomain: 'communication',
    baseUrl: process.env.NEXT_PUBLIC_COMMUNICATION_URL || 'http://localhost:3008',
    dashboardPath: '/dashboard',
  },
  core: {
    moduleId: 'core',
    subdomain: undefined, // Core is on main domain
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    dashboardPath: '/dashboard',
  },
}

/**
 * Get module URL for navigation
 * 
 * In development: Uses localhost URLs
 * In production: Uses subdomain URLs (e.g., crm.payaid.com)
 */
export function getModuleUrl(moduleId: string, path: string = ''): string {
  const config = MODULE_CONFIGS[moduleId]
  if (!config) {
    // Fallback to current domain
    return path.startsWith('/') ? path : `/${path}`
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true'

  if (isProduction && useSubdomains && config.subdomain) {
    // Production: Use subdomain
    const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ? 'https' : 'http'
    const mainDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'payaid.com'
    return `${protocol}://${config.subdomain}.${mainDomain}${path}`
  }

  // Development or monolith: Use baseUrl or current domain
  if (config.baseUrl && config.baseUrl !== process.env.NEXT_PUBLIC_APP_URL) {
    // Different module URL (for separate deployments)
    return `${config.baseUrl}${path}`
  }

  // Same domain (monolith mode)
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Navigate to a module page
 * 
 * Handles OAuth2 SSO redirect if needed
 */
export function navigateToModule(moduleId: string, path: string = ''): void {
  const moduleUrl = getModuleUrl(moduleId, path)
  
  // Check if we're navigating to a different domain
  if (moduleUrl.startsWith('http')) {
    // External navigation - will trigger OAuth2 SSO if not authenticated
    window.location.href = moduleUrl
  } else {
    // Same domain - use Next.js router
    if (typeof window !== 'undefined') {
      window.location.href = moduleUrl
    }
  }
}

/**
 * Get navigation link for a module
 * 
 * Returns href for use in Link components
 */
export function getModuleLink(moduleId: string, path: string = ''): string {
  return getModuleUrl(moduleId, path)
}

/**
 * Check if navigation requires OAuth2 SSO
 */
export function requiresSSO(moduleId: string): boolean {
  const config = MODULE_CONFIGS[moduleId]
  if (!config) return false

  const isProduction = process.env.NODE_ENV === 'production'
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true'

  // Requires SSO if:
  // 1. Production mode
  // 2. Subdomains enabled
  // 3. Module has subdomain
  // 4. Module is not core (core is on main domain)
  return isProduction && useSubdomains && !!config.subdomain && moduleId !== 'core'
}

