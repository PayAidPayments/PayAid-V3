/**
 * Currency Utilities - PayAid V3
 * STRICT RULE: Indian Rupee (₹) ONLY - No multi-currency support
 * All monetary values must be displayed and stored in INR
 */

/**
 * Format amount in Indian Rupees
 * @param amount - Amount in INR (number)
 * @returns Formatted string with ₹ symbol (e.g., "₹1,00,000.00")
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount in Indian Rupees (compact notation)
 * @param amount - Amount in INR (number)
 * @returns Formatted string (e.g., "₹1.5L", "₹10Cr")
 */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  return formatINR(amount)
}

/**
 * Parse INR string to number
 * @param amountStr - String like "₹1,00,000.00" or "100000"
 * @returns Number in INR
 */
export function parseINR(amountStr: string): number {
  // Remove ₹ symbol and commas
  const cleaned = amountStr.replace(/₹|,/g, '').trim()
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid INR amount: ${amountStr}`)
  }
  
  return parsed
}

/**
 * Currency symbol constant - Always ₹
 */
export const INR_SYMBOL = '₹'

/**
 * Currency code constant - Always INR
 */
export const CURRENCY_CODE = 'INR' as const

/**
 * Validate that currency is INR
 * @param currency - Currency code to validate
 * @throws Error if currency is not INR
 */
export function validateINR(currency: string): void {
  if (currency !== 'INR') {
    throw new Error(`Only Indian Rupee (INR) is supported. Received: ${currency}`)
  }
}

/**
 * Convert paise to rupees
 * PayAid Payments API uses paise (₹1 = 100 paise)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Convert rupees to paise
 * PayAid Payments API uses paise (₹1 = 100 paise)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
