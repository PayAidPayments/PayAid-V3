/**
 * Canonical Next.js app per product domain (modular monolith).
 * Wave 1: crm, finance, marketing. Wave 2+: hr, …
 */
export type Wave1CanonicalModule = 'crm' | 'finance' | 'marketing'

export type Wave2CanonicalModule =
  | 'hr'
  | 'projects'
  | 'sales'
  | 'leads'
  | 'website-builder'
  | 'social'
  | 'voice'

export type CanonicalProductModule = Wave1CanonicalModule | Wave2CanonicalModule

export type Wave1ProductDomain =
  | 'platform'
  | 'crm-revenue'
  | 'finance-compliance'
  | 'marketing-growth'

export type Wave2ProductDomain =
  | 'people-operations'
  | 'delivery-operations'
  | 'revenue-capture'
  | 'marketing-growth'
  | 'voice-engagement'
export interface CanonicalAppHostConfig {
  domain: Wave1ProductDomain | Wave2ProductDomain
  canonicalApp: string
  pathPrefix: string
  envOriginKey: string
  loginPaths: string[]
  devDefaultOrigin?: string
}

export const CANONICAL_APP_HOSTS: Record<CanonicalProductModule, CanonicalAppHostConfig> = {
  crm: {
    domain: 'crm-revenue',
    canonicalApp: 'crm',
    pathPrefix: '/crm',
    envOriginKey: 'NEXT_PUBLIC_CRM_APP_URL',
    loginPaths: ['/crm/login'],
    devDefaultOrigin: 'http://localhost:3001',
  },
  finance: {
    domain: 'finance-compliance',
    canonicalApp: 'finance',
    pathPrefix: '/finance',
    envOriginKey: 'NEXT_PUBLIC_FINANCE_APP_URL',
    loginPaths: ['/finance/login'],
    devDefaultOrigin: 'http://localhost:3011',
  },
  marketing: {
    domain: 'marketing-growth',
    canonicalApp: 'marketing',
    pathPrefix: '/marketing',
    envOriginKey: 'NEXT_PUBLIC_MARKETING_APP_URL',
    loginPaths: [],
    devDefaultOrigin: 'http://localhost:3005',
  },
  hr: {
    domain: 'people-operations',
    canonicalApp: 'hr',
    pathPrefix: '/hr',
    envOriginKey: 'NEXT_PUBLIC_HR_APP_URL',
    loginPaths: ['/hr/login'],
    devDefaultOrigin: 'http://localhost:3002',
  },
  projects: {
    domain: 'delivery-operations',
    canonicalApp: 'projects',
    pathPrefix: '/projects',
    envOriginKey: 'NEXT_PUBLIC_PROJECTS_APP_URL',
    loginPaths: ['/projects/login'],
    devDefaultOrigin: 'http://localhost:3007',
  },
  sales: {
    domain: 'revenue-capture',
    canonicalApp: 'sales',
    pathPrefix: '/sales',
    envOriginKey: 'NEXT_PUBLIC_SALES_APP_URL',
    loginPaths: ['/sales/login'],
    devDefaultOrigin: 'http://localhost:3008',
  },
  leads: {
    domain: 'crm-revenue',
    canonicalApp: 'leads',
    pathPrefix: '/lead-intelligence',
    envOriginKey: 'NEXT_PUBLIC_LEADS_APP_URL',
    loginPaths: [],
    devDefaultOrigin: 'http://localhost:3010',
  },
  'website-builder': {
    domain: 'marketing-growth',
    canonicalApp: 'website-builder',
    pathPrefix: '/website-builder',
    envOriginKey: 'NEXT_PUBLIC_WEBSITE_BUILDER_APP_URL',
    loginPaths: [],
    devDefaultOrigin: 'http://localhost:3009',
  },
  social: {
    domain: 'marketing-growth',
    canonicalApp: 'social',
    pathPrefix: '/studio',
    envOriginKey: 'NEXT_PUBLIC_SOCIAL_APP_URL',
    loginPaths: ['/login', '/signup'],
    devDefaultOrigin: 'http://localhost:3006',
  },
  voice: {
    domain: 'voice-engagement',
    canonicalApp: 'voice',
    pathPrefix: '/voice-agents',
    envOriginKey: 'NEXT_PUBLIC_VOICE_APP_URL',
    loginPaths: [],
    // Prefer dedicated public origin; VOICE_MODULE_URL is also set for API rewrites.
    devDefaultOrigin: 'http://localhost:3003',
  },
}

/** @deprecated Use CANONICAL_APP_HOSTS */
export const WAVE1_CANONICAL_HOSTS = CANONICAL_APP_HOSTS

export const PLATFORM_CANONICAL_APP = {
  domain: 'platform' as const,
  canonicalApp: 'dashboard',
  envOriginKey: 'NEXT_PUBLIC_DASHBOARD_APP_URL',
}
