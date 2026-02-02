/**
 * Module Organization - 6 Tier Structure
 * Based on enterprise software best practices and competitive analysis
 * Following patterns from Monday.com, ClickUp, SAP, and Salesforce
 */

import { ModuleConfig } from '@/lib/modules.config'

export type ModuleTier = 
  | 'tier1-top6' 
  | 'tier2-operational' 
  | 'tier3-ai-intelligence' 
  | 'tier4-productivity' 
  | 'tier5-specialized' 
  | 'tier6-creative'

export interface TieredModule extends ModuleConfig {
  tier: ModuleTier
  badge?: number // Notification count
  isPinned?: boolean
  lastUsed?: Date
}

/**
 * Tier 1: Top 6 - Daily-use business tools
 * These are the most frequently accessed modules
 */
export const TIER_1_MODULES: string[] = [
  'home',
  'crm',
  'finance',
  'hr',
  'sales',
  'marketing'
]

/**
 * Tier 2: Operational Tools
 * Business operations and workflow management
 */
export const TIER_2_MODULES: string[] = [
  'projects',
  'inventory',
  'analytics',
  'communication',
  'workflow',
  'appointments',
  'industry-intelligence',
  'help-center',
  'contracts',
  'compliance',
  'lms'
]

/**
 * Tier 3: AI Intelligence
 * AI-powered tools and automation
 */
export const TIER_3_MODULES: string[] = [
  'ai-cofounder',
  'ai-chat',
  'ai-insights',
  'knowledge-rag',
  'voice-agents'
]

/**
 * Tier 4: Productivity Suite
 * Office productivity tools
 */
export const TIER_4_MODULES: string[] = [
  'docs',
  'drive',
  'spreadsheet',
  'slides',
  'meet',
  'pdf'
]

/**
 * Tier 5: Specialized Tools
 * Industry-specific and specialized business tools
 */
export const TIER_5_MODULES: string[] = [
  'restaurant',
  'retail',
  'ecommerce',
  'manufacturing',
  'field-service',
  'asset-management',
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
  'wholesale'
]

/**
 * Tier 6: Creative Utilities
 * Creative and design tools
 */
export const TIER_6_MODULES: string[] = [
  'website-builder',
  'logo-generator'
]

/**
 * Get tier for a module ID
 */
export function getModuleTier(moduleId: string): ModuleTier {
  if (TIER_1_MODULES.includes(moduleId)) return 'tier1-top6'
  if (TIER_2_MODULES.includes(moduleId)) return 'tier2-operational'
  if (TIER_3_MODULES.includes(moduleId)) return 'tier3-ai-intelligence'
  if (TIER_4_MODULES.includes(moduleId)) return 'tier4-productivity'
  if (TIER_5_MODULES.includes(moduleId)) return 'tier5-specialized'
  if (TIER_6_MODULES.includes(moduleId)) return 'tier6-creative'
  return 'tier2-operational' // Default fallback
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: ModuleTier): string {
  const names: Record<ModuleTier, string> = {
    'tier1-top6': 'Top 6',
    'tier2-operational': 'Operational Tools',
    'tier3-ai-intelligence': 'AI Intelligence',
    'tier4-productivity': 'Productivity Suite',
    'tier5-specialized': 'Specialized Tools',
    'tier6-creative': 'Creative Utilities'
  }
  return names[tier]
}

/**
 * Get tier description
 */
export function getTierDescription(tier: ModuleTier): string {
  const descriptions: Record<ModuleTier, string> = {
    'tier1-top6': 'Daily-use business tools',
    'tier2-operational': 'Business operations and workflow',
    'tier3-ai-intelligence': 'AI-powered tools and automation',
    'tier4-productivity': 'Office productivity tools',
    'tier5-specialized': 'Industry-specific tools',
    'tier6-creative': 'Creative and design tools'
  }
  return descriptions[tier]
}

/**
 * Organize modules by tier
 */
export function organizeModulesByTier(
  modules: ModuleConfig[],
  pinnedModules: string[] = [],
  recentlyUsed: string[] = [],
  badges: Record<string, number> = {}
): Record<ModuleTier, TieredModule[]> {
  const organized: Record<ModuleTier, TieredModule[]> = {
    'tier1-top6': [],
    'tier2-operational': [],
    'tier3-ai-intelligence': [],
    'tier4-productivity': [],
    'tier5-specialized': [],
    'tier6-creative': []
  }

  modules.forEach(module => {
    const tier = getModuleTier(module.id)
    const tieredModule: TieredModule = {
      ...module,
      tier,
      isPinned: pinnedModules.includes(module.id),
      badge: badges[module.id] || 0,
      lastUsed: recentlyUsed.includes(module.id)
        ? (typeof window !== 'undefined' 
          ? new Date(localStorage.getItem(`module_last_used_${module.id}`) || Date.now())
          : undefined)
        : undefined
    }
    organized[tier].push(tieredModule)
  })

  // Sort each tier: pinned first, then by last used, then alphabetically
  Object.keys(organized).forEach(tier => {
    organized[tier as ModuleTier].sort((a, b) => {
      // Pinned modules first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // Recently used next
      if (a.lastUsed && !b.lastUsed) return -1
      if (!a.lastUsed && b.lastUsed) return 1
      if (a.lastUsed && b.lastUsed) {
        return b.lastUsed.getTime() - a.lastUsed.getTime()
      }
      
      // Alphabetical
      return a.name.localeCompare(b.name)
    })
  })

  return organized
}
