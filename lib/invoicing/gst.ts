/**
 * GST Calculation and Compliance
 * Handles all GST-related calculations for Indian businesses
 */

export interface GSTRate {
  category: string
  rate: number // 0%, 5%, 12%, 18%, 28%
  description: string
}

export const GST_RATES: Record<string, GSTRate> = {
  'essential': {
    category: 'Essential Items',
    rate: 0,
    description: 'Food grains, fresh vegetables, milk, etc.',
  },
  'fast-moving': {
    category: 'Fast Moving Consumer Goods',
    rate: 5,
    description: 'Clothes, books, packaged food items',
  },
  'standard': {
    category: 'Standard Rate',
    rate: 18,
    description: 'Most goods and services',
  },
  'luxury': {
    category: 'Luxury Items',
    rate: 28,
    description: 'Luxury goods, sin goods, etc.',
  },
}

export interface GSTCalculation {
  baseAmount: number
  gstRate: number
  cgst: number // Central GST (half of GST rate)
  sgst: number // State GST (half of GST rate)
  igst: number // Integrated GST (for inter-state)
  totalGST: number
  totalAmount: number
  isInterState: boolean
}

/**
 * Calculate GST for an amount
 */
export function calculateGST(
  baseAmount: number,
  gstRate: number,
  isInterState: boolean = false
): GSTCalculation {
  const totalGST = (baseAmount * gstRate) / 100

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (isInterState) {
    // Inter-state: IGST applies
    igst = totalGST
  } else {
    // Intra-state: CGST + SGST applies (each half of GST rate)
    cgst = totalGST / 2
    sgst = totalGST / 2
  }

  return {
    baseAmount,
    gstRate,
    cgst,
    sgst,
    igst,
    totalGST,
    totalAmount: baseAmount + totalGST,
    isInterState,
  }
}

/**
 * Get GST rate for a product category
 */
export function getGSTRate(category: string): number {
  const rate = GST_RATES[category.toLowerCase()]
  return rate ? rate.rate : GST_RATES['standard'].rate // Default to 18%
}

/**
 * Calculate HSN code based on product category
 */
export function getHSNCode(category: string): string {
  // Simplified HSN code mapping
  // In production, use a comprehensive HSN code database
  const hsnMap: Record<string, string> = {
    'essential': '0101',
    'fast-moving': '6109',
    'standard': '8471',
    'luxury': '8703',
  }

  return hsnMap[category.toLowerCase()] || '8471' // Default HSN code
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  // GSTIN format: 15 characters
  // First 2: State code
  // Next 10: PAN number
  // Next 1: Entity number
  // Next 1: 'Z' by default
  // Last 1: Check digit

  if (!gstin || gstin.length !== 15) {
    return false
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

/**
 * Format amount in Indian currency
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

