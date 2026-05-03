/**
 * PayAid V3 – Module keys for entitlements & plan limits
 * Single source of truth for which modules exist (used by Super Admin plans and tenant entitlements).
 */

export const MODULE_KEYS = [
  'crm',
  'sales',
  'marketing',
  'finance',
  'projects',
  'hr',
  'communication',
  'marketplace',
  'ai-cofounder',
  'ai-chat',
  'ai-insights',
  'website-builder',
  'logo-generator',
  'knowledge-rag',
  'voice-agents',
  'analytics',
  'industry-intelligence',
  'appointments',
  'inventory',
  'workflow',
  'help-center',
  'contracts',
  'spreadsheet',
  'docs',
  'drive',
  'slides',
  'meet',
  'pdf',
  'restaurant',
  'retail',
  'service',
  'ecommerce',
  'manufacturing',
  'field-service',
  'asset-management',
  'compliance',
  'lms',
  'professional-services',
  'healthcare',
  'education',
  'real-estate',
  'logistics',
  'agriculture',
  'construction',
  'beauty',
  'automotive',
  'hospitality',
  'legal',
  'financial-services',
  'events',
  'wholesale',
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

/** Aliases for spec names (Billing = finance, Support = help-center, WhatsApp = communication subset) */
export const MODULE_ALIASES: Record<string, ModuleKey> = {
  CRM: 'crm',
  Billing: 'finance',
  Marketing: 'marketing',
  Support: 'help-center',
  WhatsApp: 'communication',
  AI_DASHBOARD: 'ai-insights',
  AI_COPILOT: 'ai-cofounder',
  Workflows: 'workflow',
}

export function normalizeModuleKey(key: string): ModuleKey | null {
  const k = key.toLowerCase().replace(/_/g, '-')
  if ((MODULE_KEYS as readonly string[]).includes(k)) return k as ModuleKey
  return MODULE_ALIASES[key] ?? null
}
