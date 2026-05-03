/**
 * Exchange Rate Service
 * Wrapper service for fetching and managing exchange rates from external APIs
 */

import { prisma } from '@/lib/db/prisma'
import { fetchExchangeRate, fetchExchangeRates } from './converter'

export interface ExchangeRateConfig {
  apiKey?: string
  provider?: 'openexchangerates' | 'fixer' | 'exchangerate-api'
  autoUpdate?: boolean
  updateInterval?: number // hours
}

/**
 * Get or fetch exchange rate for a currency pair
 * Checks database first, then fetches from API if needed
 */
export async function getExchangeRate(
  tenantId: string,
  fromCurrency: string,
  toCurrency: string,
  config?: ExchangeRateConfig
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  // Check database for existing rate
  const existingRate = await prisma.currencyExchangeRate.findFirst({
    where: {
      tenantId,
      fromCurrency,
      toCurrency,
      isActive: true,
      rateDate: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: { rateDate: 'desc' },
  })

  if (existingRate) {
    return existingRate.rate
  }

  // Fetch from API
  const apiKey = config?.apiKey || process.env.OPENEXCHANGERATES_API_KEY
  const rate = await fetchExchangeRate(fromCurrency, toCurrency, apiKey)

  if (!rate) {
    throw new Error(`Failed to fetch exchange rate for ${fromCurrency} to ${toCurrency}`)
  }

  // Save to database
  await prisma.currencyExchangeRate.create({
    data: {
      tenantId,
      fromCurrency,
      toCurrency,
      rate,
      rateDate: new Date(),
      source: config?.provider || 'openexchangerates',
      isActive: true,
    },
  })

  return rate
}

/**
 * Update exchange rates for all supported currencies
 */
export async function updateExchangeRates(
  tenantId: string,
  baseCurrency: string,
  targetCurrencies: string[],
  config?: ExchangeRateConfig
): Promise<Record<string, number>> {
  const apiKey = config?.apiKey || process.env.OPENEXCHANGERATES_API_KEY
  
  const rates = await fetchExchangeRates(baseCurrency, targetCurrencies, apiKey)

  // Save all rates to database
  const rateDate = new Date()
  await Promise.all(
    Object.entries(rates).map(([currency, rate]) =>
      prisma.currencyExchangeRate.create({
        data: {
          tenantId,
          fromCurrency: baseCurrency,
          toCurrency: currency,
          rate,
          rateDate,
          source: config?.provider || 'openexchangerates',
          isActive: true,
        },
      }).catch(() => {
        // Ignore duplicate errors
      })
    )
  )

  return rates
}

/**
 * Get exchange rate with fallback
 */
export async function getExchangeRateWithFallback(
  tenantId: string,
  fromCurrency: string,
  toCurrency: string,
  config?: ExchangeRateConfig
): Promise<number> {
  try {
    return await getExchangeRate(tenantId, fromCurrency, toCurrency, config)
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    // Return 1 as fallback (no conversion)
    return 1
  }
}
