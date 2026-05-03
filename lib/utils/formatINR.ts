/**
 * Universal Indian Currency Formatting Utility
 * PayAid V3 - STRICT: ₹ (INR) ONLY - No $ symbols anywhere
 * 
 * This utility provides comprehensive INR formatting with Lakhs/Crores notation
 * for all 28 modules across PayAid V3 platform.
 */

/**
 * Format amount in Indian Rupees with Lakhs/Crores notation
 * @param amount - Amount in INR (number)
 * @param options - Formatting options
 * @returns Formatted string (e.g., "₹4.5L", "₹1.2Cr", "₹1,00,000.00")
 * 
 * @example
 * formatINR(450000) // "₹4.5L"
 * formatINR(12000000) // "₹1.2Cr"
 * formatINR(100000, { compact: false }) // "₹1,00,000.00"
 */
export function formatINR(
  amount: number,
  options: {
    compact?: boolean // Use Lakh/Crore notation (default: true for amounts >= 1L)
    decimals?: number // Number of decimal places (default: 1 for compact, 2 for standard)
    showSymbol?: boolean // Show ₹ symbol (default: true)
    locale?: string // Locale (default: 'en-IN')
  } = {}
): string {
  const {
    compact = undefined, // Auto-detect: use compact if >= 1L
    decimals = undefined, // Auto-detect: 1 for compact, 2 for standard
    showSymbol = true,
    locale = 'en-IN',
  } = options

  // Handle zero and negative amounts
  if (amount === 0) {
    return showSymbol ? '₹0' : '0'
  }

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)

  // Auto-detect compact mode: use compact if >= 1L and not explicitly disabled
  const useCompact = compact !== false && (compact === true || absAmount >= 100000)

  if (useCompact) {
    // Lakh/Crore notation
    if (absAmount >= 10000000) {
      // Crore (1Cr = 1,00,00,000)
      const crores = absAmount / 10000000
      const decimalPlaces = decimals ?? 1
      const formatted = crores.toFixed(decimalPlaces)
      return `${isNegative ? '-' : ''}${showSymbol ? '₹' : ''}${formatted}Cr`
    } else if (absAmount >= 100000) {
      // Lakh (1L = 1,00,000)
      const lakhs = absAmount / 100000
      const decimalPlaces = decimals ?? 1
      const formatted = lakhs.toFixed(decimalPlaces)
      return `${isNegative ? '-' : ''}${showSymbol ? '₹' : ''}${formatted}L`
    }
  }

  // Standard formatting with Indian number system
  const decimalPlaces = decimals ?? 2
  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(absAmount)

  return isNegative ? `-${formatted}` : formatted
}

/**
 * Format currency with compact notation (Lakh/Crore) - Always uses compact
 * @param amount - Amount in INR
 * @returns Formatted string (e.g., "₹4.5L", "₹1.2Cr")
 */
export function formatINRCompact(amount: number): string {
  return formatINR(amount, { compact: true, decimals: 1 })
}

/**
 * Format currency with standard notation - Always uses standard
 * @param amount - Amount in INR
 * @returns Formatted string (e.g., "₹1,00,000.00")
 */
export function formatINRStandard(amount: number): string {
  return formatINR(amount, { compact: false, decimals: 2 })
}

/**
 * Format currency for display in cards/metrics (auto-detects best format)
 * @param amount - Amount in INR
 * @returns Formatted string optimized for UI display
 */
export function formatINRForDisplay(amount: number): string {
  // For display, prefer compact for large numbers, standard for smaller
  if (amount >= 100000) {
    return formatINR(amount, { compact: true, decimals: 1 })
  }
  return formatINR(amount, { compact: false, decimals: 0 })
}

/**
 * Parse INR string to number
 * Handles both compact (₹4.5L, ₹1.2Cr) and standard (₹1,00,000.00) formats
 * @param amountStr - String like "₹4.5L", "₹1.2Cr", "₹1,00,000.00", or "100000"
 * @returns Number in INR
 * @throws Error if string cannot be parsed
 */
export function parseINR(amountStr: string): number {
  // Remove ₹ symbol, spaces, and commas
  const cleaned = amountStr.replace(/₹|,|\s/g, '').trim().toUpperCase()

  // Check for Crore notation
  if (cleaned.endsWith('CR')) {
    const crores = parseFloat(cleaned.replace('CR', ''))
    if (isNaN(crores)) {
      throw new Error(`Invalid INR amount: ${amountStr}`)
    }
    return crores * 10000000
  }

  // Check for Lakh notation
  if (cleaned.endsWith('L')) {
    const lakhs = parseFloat(cleaned.replace('L', ''))
    if (isNaN(lakhs)) {
      throw new Error(`Invalid INR amount: ${amountStr}`)
    }
    return lakhs * 100000
  }

  // Standard number format
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
  if (currency.toUpperCase() !== 'INR') {
    throw new Error(`Only Indian Rupee (INR) is supported. Received: ${currency}`)
  }
}

/**
 * Check for forbidden dollar symbol usage in a string
 * @param text - The string to check
 * @returns true if dollar symbol is found, false otherwise
 */
export function containsDollarSymbol(text: string): boolean {
  return /\$[0-9]|\$[0-9,]+|USD|dollar/i.test(text)
}

/**
 * Format large numbers with Indian numbering system
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,00,000" instead of "100,000")
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}
