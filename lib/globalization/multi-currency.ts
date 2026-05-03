/**
 * Multi-Currency Support
 * Handle multiple currencies and conversions
 */

import 'server-only'

export interface Currency {
  code: string
  name: string
  symbol: string
  exchangeRate: number // Relative to base currency (INR)
}

const CURRENCIES: Record<string, Currency> = {
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.5 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 105.8 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 22.7 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRate: 62.1 },
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = CURRENCIES[fromCurrency.toUpperCase()]
  const to = CURRENCIES[toCurrency.toUpperCase()]

  if (!from || !to) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`)
  }

  // Convert to base currency (INR) first, then to target
  const inBaseCurrency = amount * from.exchangeRate
  return inBaseCurrency / to.exchangeRate
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode.toUpperCase()]
  if (!currency) {
    return `${amount} ${currencyCode}`
  }

  return `${currency.symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES)
}

/**
 * Update exchange rates (would fetch from API in production)
 */
export async function updateExchangeRates(): Promise<void> {
  // In production, fetch from exchange rate API
  // For now, rates are static
}
