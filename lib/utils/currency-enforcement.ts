/**
 * PayAid Currency Enforcement Utilities
 * STRICT RULE: Indian Rupee (₹) ONLY - Zero tolerance for $ symbols
 * 
 * This module provides:
 * 1. Currency formatting with strict ₹ enforcement
 * 2. Validation to catch $ symbols
 * 3. Pre-commit hook helpers
 * 4. ESLint rule helpers
 */

/**
 * Format currency in Indian Rupees with Lakh/Crore notation
 * @param amount - Amount in INR (number)
 * @param options - Formatting options
 * @returns Formatted string (e.g., "₹45.2L", "₹1.5Cr", "₹1,00,000")
 */
export function formatCurrency(
  amount: number,
  options: {
    compact?: boolean // Use Lakh/Crore notation
    decimals?: number // Number of decimal places
    locale?: string // Locale (default: en-IN)
  } = {}
): string {
  const { compact = false, decimals = 2, locale = 'en-IN' } = options

  if (compact) {
    // Lakh/Crore notation
    if (amount >= 10000000) {
      // Crore (1Cr = 1,00,00,000)
      const crores = amount / 10000000
      return `₹${crores.toFixed(decimals)}Cr`
    } else if (amount >= 100000) {
      // Lakh (1L = 1,00,000)
      const lakhs = amount / 100000
      return `₹${lakhs.toFixed(decimals)}L`
    }
  }

  // Standard formatting with Indian number system
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Format currency with compact notation (Lakh/Crore)
 * @param amount - Amount in INR
 * @returns Formatted string (e.g., "₹45.2L", "₹1.5Cr")
 */
export function formatCurrencyCompact(amount: number): string {
  return formatCurrency(amount, { compact: true })
}

/**
 * Format currency with standard notation
 * @param amount - Amount in INR
 * @returns Formatted string (e.g., "₹1,00,000.00")
 */
export function formatCurrencyStandard(amount: number): string {
  return formatCurrency(amount, { compact: false })
}

/**
 * Validate that a string does not contain dollar symbols
 * @param text - Text to validate
 * @returns true if valid (no $), false if invalid (contains $)
 */
export function validateNoDollarSymbol(text: string): boolean {
  // Check for $ followed by numbers or in currency contexts
  const dollarPattern = /\$[0-9]|USD|\$\s*[0-9]|dollar/i
  return !dollarPattern.test(text)
}

/**
 * Find dollar symbols in text
 * @param text - Text to search
 * @returns Array of matches with line numbers (if text is multiline)
 */
export function findDollarSymbols(text: string): Array<{ line: number; match: string }> {
  const lines = text.split('\n')
  const matches: Array<{ line: number; match: string }> = []
  
  lines.forEach((line, index) => {
    const dollarPattern = /\$[0-9]|USD|\$\s*[0-9]|dollar/gi
    const lineMatches = line.match(dollarPattern)
    if (lineMatches) {
      lineMatches.forEach(match => {
        matches.push({ line: index + 1, match })
      })
    }
  })
  
  return matches
}

/**
 * Validate currency code (must be INR)
 * @param currencyCode - Currency code to validate
 * @throws Error if currency is not INR
 */
export function validateCurrencyCode(currencyCode: string): void {
  if (currencyCode.toUpperCase() !== 'INR') {
    throw new Error(`Invalid currency: ${currencyCode}. Only INR (Indian Rupee) is supported.`)
  }
}

/**
 * Constants for currency enforcement
 */
export const CURRENCY_SYMBOL = '₹'
export const CURRENCY_CODE = 'INR'
export const LOCALE = 'en-IN'

/**
 * Pre-commit hook helper: Check for dollar symbols in files
 * Usage: node -e "require('./lib/utils/currency-enforcement').checkFilesForDollarSymbols(['src/.../*.ts', 'src/.../*.tsx'])"
 */
export async function checkFilesForDollarSymbols(filePatterns: string[]): Promise<{
  valid: boolean
  errors: Array<{ file: string; line: number; match: string }>
}> {
  // This would be implemented with file system access
  // For now, return structure for implementation
  return {
    valid: true,
    errors: [],
  }
}
