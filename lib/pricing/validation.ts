/**
 * Pricing Validation Utilities
 * Ensures pricing calculations are correct and consistent
 */

import { calculateTotalPrice, getBestPricing, getModulePricing } from './config'

/**
 * Validate pricing calculation
 */
export function validatePricing(
  selectedModules: string[],
  tier: 'starter' | 'professional',
  industryId: string | null
): {
  isValid: boolean
  errors: string[]
  individualTotal: number
  bestPricing: ReturnType<typeof getBestPricing>
} {
  const errors: string[] = []
  
  // Calculate individual total
  const individualTotal = calculateTotalPrice(selectedModules, tier)
  
  // Get best pricing
  const bestPricing = getBestPricing(industryId, selectedModules, tier)
  
  // Validation checks
  if (individualTotal < 0) {
    errors.push('Individual total cannot be negative')
  }
  
  if (bestPricing.price < 0) {
    errors.push('Final price cannot be negative')
  }
  
  if (bestPricing.type !== 'individual' && bestPricing.originalPrice) {
    if (bestPricing.price > bestPricing.originalPrice) {
      errors.push('Discounted price cannot be greater than original price')
    }
    
    if (bestPricing.savings && bestPricing.savings < 0) {
      errors.push('Savings cannot be negative')
    }
    
    if (bestPricing.savings && bestPricing.originalPrice) {
      const expectedSavings = bestPricing.originalPrice - bestPricing.price
      if (Math.abs(bestPricing.savings - expectedSavings) > 1) {
        errors.push(`Savings mismatch: expected ${expectedSavings}, got ${bestPricing.savings}`)
      }
    }
  }
  
  // Check each module has valid pricing
  for (const moduleId of selectedModules) {
    const price = getModulePricing(moduleId, tier)
    if (price < 0) {
      errors.push(`Module ${moduleId} has negative pricing`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    individualTotal,
    bestPricing,
  }
}

