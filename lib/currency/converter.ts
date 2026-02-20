/**
 * Currency Conversion Service
 * Handles currency conversion and exchange rate management
 */

export interface CurrencyInfo {
  code: string // ISO 4217 code (e.g., "USD", "INR", "EUR")
  name: string // Display name (e.g., "US Dollar", "Indian Rupee")
  symbol: string // Currency symbol (e.g., "$", "₹", "€")
  decimals: number // Decimal places (usually 2)
}

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  date: Date
  source: string
}

/**
 * Supported currencies (150+ currencies)
 */
export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  // Major currencies
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2 },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2 },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2 },
  ILS: { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimals: 2 },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  // Add more currencies as needed...
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo | null {
  return SUPPORTED_CURRENCIES[code.toUpperCase()] || null
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyInfo(currencyCode)
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  const formattedAmount = amount.toFixed(currency.decimals)
  return `${currency.symbol}${formattedAmount}`
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }
  return amount * exchangeRate
}

/**
 * Get exchange rate from API (OpenExchangeRates or Fixer.io)
 */
export async function fetchExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  apiKey?: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  try {
    // Try OpenExchangeRates first (free tier available)
    if (apiKey) {
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=${fromCurrency}&symbols=${toCurrency}`
      )
      if (response.ok) {
        const data = await response.json()
        return data.rates?.[toCurrency] || null
      }
    }

    // Fallback: Use a free API (exchangerate-api.com)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    )
    if (response.ok) {
      const data = await response.json()
      return data.rates?.[toCurrency] || null
    }

    return null
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return null
  }
}

/**
 * Get multiple exchange rates at once
 */
export async function fetchExchangeRates(
  baseCurrency: string,
  targetCurrencies: string[],
  apiKey?: string
): Promise<Record<string, number>> {
  const rates: Record<string, number> = {}

  for (const currency of targetCurrencies) {
    if (currency === baseCurrency) {
      rates[currency] = 1
    } else {
      const rate = await fetchExchangeRate(baseCurrency, currency, apiKey)
      if (rate) {
        rates[currency] = rate
      }
    }
  }

  return rates
}
