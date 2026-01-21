/**
 * PayAid V3 Pricing Configuration
 * Module-based pricing with industry package discounts
 */

export interface ModulePricing {
  starter: number
  professional: number
  enterprise?: number // Custom pricing
}

export interface IndustryPackagePricing {
  modules: string[]
  individualPrice: number
  packagePrice: number
  savings: number
  savingsPercentage: number
}

// Individual Module Pricing (per month)
// Uniform pricing: ₹1999 for Starter, ₹3999 for Professional
export const MODULE_PRICING: Record<string, ModulePricing> = {
  'crm': {
    starter: 1999,
    professional: 3999,
  },
  'finance': {
    starter: 1999,
    professional: 3999,
  },
  'sales': {
    starter: 1999,
    professional: 3999,
  },
  'inventory': {
    starter: 1999,
    professional: 3999,
  },
  'hr': {
    starter: 1999,
    professional: 3999,
  },
  'marketing': {
    starter: 0, // NOW BASE MODULE - Included with all plans (2026 Revised Standards)
    professional: 0, // NOW BASE MODULE - Included with all plans
  },
  'projects': {
    starter: 1999,
    professional: 3999,
  },
  'analytics': {
    starter: 0, // FREE with any module
    professional: 0, // FREE with any module
  },
  'ai-studio': {
    starter: 0, // Always FREE (AI Co-founder, AI Specialists)
    professional: 0, // Always FREE
  },
  'communication': {
    starter: 1999,
    professional: 3999,
  },
  'invoicing': {
    starter: 0, // Deprecated - part of Finance & Accounting
    professional: 0,
  },
  'accounting': {
    starter: 0, // Deprecated - part of Finance & Accounting
    professional: 0,
  },
  'productivity': {
    starter: 1999, // Combined price for all productivity tools (spreadsheet, docs, drive, slides, meet) + PDF features
    professional: 3999,
  },
  // Individual productivity modules (kept for backward compatibility, but should use 'productivity' instead)
  'spreadsheet': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'docs': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'drive': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'slides': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'meet': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'pdf': {
    starter: 0, // Part of productivity suite
    professional: 0,
  },
  'workflow': {
    starter: 1999,
    professional: 3999,
  },
  'appointments': {
    starter: 1999,
    professional: 3999,
  },
  'help-center': {
    starter: 1999,
    professional: 3999,
  },
  'contracts': {
    starter: 1999,
    professional: 3999,
  },
  // Phase 3: Industry-Specific Modules
  'field-service': {
    starter: 1999,
    professional: 3999,
  },
  'manufacturing': {
    starter: 1999,
    professional: 3999,
  },
  'asset-management': {
    starter: 1999,
    professional: 3999,
  },
  'ecommerce': {
    starter: 1999,
    professional: 3999,
  },
  // Phase 4: Advanced Features
  'compliance': {
    starter: 1999,
    professional: 3999,
  },
  'lms': {
    starter: 1999,
    professional: 3999,
  },
}

// Industry Package Pricing (20% discount)
// Based on uniform pricing: ₹1999 Starter, ₹3999 Professional
export const INDUSTRY_PACKAGE_PRICING: Record<string, IndustryPackagePricing> = {
  'restaurant': {
    modules: ['crm', 'finance', 'inventory', 'sales', 'ai-studio'],
    individualPrice: 15996, // 4 modules × ₹3999 (Professional)
    packagePrice: 12797, // 20% discount
    savings: 3199,
    savingsPercentage: 20,
  },
  'retail': {
    modules: ['crm', 'finance', 'inventory', 'sales', 'marketing', 'ai-studio'],
    individualPrice: 19995, // 5 modules × ₹3999 (Professional)
    packagePrice: 15996, // 20% discount
    savings: 3999,
    savingsPercentage: 20,
  },
  'service-business': {
    modules: ['crm', 'finance', 'projects', 'marketing', 'hr', 'ai-studio'],
    individualPrice: 19995, // 5 modules × ₹3999 (Professional)
    packagePrice: 15996, // 20% discount
    savings: 3999,
    savingsPercentage: 20,
  },
  'ecommerce': {
    modules: ['crm', 'finance', 'inventory', 'sales', 'marketing', 'analytics', 'ai-studio'],
    individualPrice: 19995, // 5 paid modules × ₹3999 (analytics is free)
    packagePrice: 15996, // 20% discount
    savings: 3999,
    savingsPercentage: 20,
  },
  'professional-services': {
    modules: ['crm', 'finance', 'projects', 'hr', 'communication', 'ai-studio'],
    individualPrice: 19995, // 5 modules × ₹3999 (Professional)
    packagePrice: 15996, // 20% discount
    savings: 3999,
    savingsPercentage: 20,
  },
  'manufacturing': {
    modules: ['crm', 'finance', 'inventory', 'projects', 'hr', 'ai-studio'],
    individualPrice: 19995, // 5 modules × ₹3999 (Professional)
    packagePrice: 15996, // 20% discount
    savings: 3999,
    savingsPercentage: 20,
  },
}

/**
 * Get pricing for a module
 */
export function getModulePricing(moduleId: string, tier: 'starter' | 'professional' | 'enterprise' = 'professional'): number {
  const pricing = MODULE_PRICING[moduleId]
  if (!pricing) return 0
  
  if (tier === 'starter') return pricing.starter
  if (tier === 'professional') return pricing.professional
  return pricing.enterprise || pricing.professional
}

/**
 * Calculate total price for selected modules
 * Handles productivity suite consolidation (if individual productivity tools are selected, they're included in productivity suite)
 */
export function calculateTotalPrice(
  moduleIds: string[],
  tier: 'starter' | 'professional' = 'professional'
): number {
  // Consolidate productivity modules
  const productivityModules = ['spreadsheet', 'docs', 'drive', 'slides', 'meet', 'pdf']
  const hasProductivitySuite = moduleIds.includes('productivity')
  const hasIndividualProductivity = moduleIds.some(id => productivityModules.includes(id))
  
  // If user has both productivity suite and individual tools, or just individual tools, consolidate
  let consolidatedModules = [...moduleIds]
  if (hasIndividualProductivity && !hasProductivitySuite) {
    // Remove individual productivity modules and add productivity suite
    consolidatedModules = moduleIds.filter(id => !productivityModules.includes(id))
    consolidatedModules.push('productivity')
  } else if (hasProductivitySuite && hasIndividualProductivity) {
    // Remove individual productivity modules (already included in suite)
    consolidatedModules = moduleIds.filter(id => !productivityModules.includes(id))
    if (!consolidatedModules.includes('productivity')) {
      consolidatedModules.push('productivity')
    }
  }
  
  // Remove duplicates
  consolidatedModules = [...new Set(consolidatedModules)]
  
  return consolidatedModules.reduce((total, moduleId) => {
    return total + getModulePricing(moduleId, tier)
  }, 0)
}

/**
 * Check if modules qualify for industry package discount
 */
export function getIndustryPackageDiscount(
  industryId: string | null,
  selectedModules: string[],
  tier: 'starter' | 'professional' = 'professional'
): IndustryPackagePricing | null {
  if (!industryId || !INDUSTRY_PACKAGE_PRICING[industryId]) {
    return null
  }

  const packageConfig = INDUSTRY_PACKAGE_PRICING[industryId]
  
  // Check if all package modules are selected
  const packageModulesSet = new Set(packageConfig.modules)
  const selectedModulesSet = new Set(selectedModules)
  
  // If 3+ package modules are selected, apply package discount
  const selectedPackageModules = packageConfig.modules.filter(m => selectedModulesSet.has(m))
  if (selectedPackageModules.length >= 3) {
    // Calculate actual price based on selected modules and tier
    const individualPrice = calculateTotalPrice(selectedPackageModules, tier)
    const packagePrice = Math.round(individualPrice * (1 - packageConfig.savingsPercentage / 100))
    
    return {
      ...packageConfig,
      modules: selectedPackageModules,
      individualPrice,
      packagePrice,
      savings: individualPrice - packagePrice,
      savingsPercentage: packageConfig.savingsPercentage,
    }
  }

  return null
}

/**
 * Calculate bundle discount for mixed modules (15-20% off)
 */
export function calculateBundleDiscount(selectedModules: string[], tier: 'starter' | 'professional' = 'professional'): {
  individualPrice: number
  bundlePrice: number
  savings: number
  savingsPercentage: number
} | null {
  if (selectedModules.length < 3) {
    return null
  }

  const individualPrice = calculateTotalPrice(selectedModules, tier)
  
  // Bundle discount: 15% for 3-4 modules, 20% for 5+ modules
  const savingsPercentage = selectedModules.length >= 5 ? 20 : 15
  const bundlePrice = Math.round(individualPrice * (1 - savingsPercentage / 100))
  const savings = individualPrice - bundlePrice

  return {
    individualPrice,
    bundlePrice,
    savings,
    savingsPercentage,
  }
}

/**
 * Get best pricing option (individual, bundle, or package)
 */
export function getBestPricing(
  industryId: string | null,
  selectedModules: string[],
  tier: 'starter' | 'professional' = 'professional'
): {
  type: 'individual' | 'bundle' | 'package'
  price: number
  savings?: number
  savingsPercentage?: number
  originalPrice?: number
} {
  // Check for industry package first
  const packageDiscount = getIndustryPackageDiscount(industryId, selectedModules, tier)
  if (packageDiscount) {
    // Calculate total for ALL selected modules (not just package modules)
    const allModulesIndividualPrice = calculateTotalPrice(selectedModules, tier)
    // Apply package discount only to package modules, then add other modules at full price
    const otherModules = selectedModules.filter(m => !packageDiscount.modules.includes(m))
    const otherModulesPrice = calculateTotalPrice(otherModules, tier)
    const finalPrice = packageDiscount.packagePrice + otherModulesPrice
    const totalSavings = allModulesIndividualPrice - finalPrice
    // Calculate actual savings percentage based on total (not just package modules)
    const actualSavingsPercentage = allModulesIndividualPrice > 0 
      ? Math.round((totalSavings / allModulesIndividualPrice) * 100) 
      : 0
    
    return {
      type: 'package',
      price: finalPrice,
      savings: totalSavings,
      savingsPercentage: actualSavingsPercentage,
      originalPrice: allModulesIndividualPrice,
    }
  }

  // Check for general bundle discount
  const bundleDiscount = calculateBundleDiscount(selectedModules, tier)
  if (bundleDiscount) {
    return {
      type: 'bundle',
      price: bundleDiscount.bundlePrice,
      savings: bundleDiscount.savings,
      savingsPercentage: bundleDiscount.savingsPercentage,
      originalPrice: bundleDiscount.individualPrice,
    }
  }

  // Individual pricing
  const individualPrice = calculateTotalPrice(selectedModules, tier)
  return {
    type: 'individual',
    price: individualPrice,
  }
}

