/**
 * Currency Conversion Utilities
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  tenantId: string | null,
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Get exchange rates
  const from = await prisma.currency.findFirst({
    where: {
      OR: [
        { tenantId, code: fromCurrency },
        { tenantId: null, code: fromCurrency },
      ],
      isActive: true,
    },
  })

  const to = await prisma.currency.findFirst({
    where: {
      OR: [
        { tenantId, code: toCurrency },
        { tenantId: null, code: toCurrency },
      ],
      isActive: true,
    },
  })

  if (!from || !to) {
    throw new Error('Currency not found')
  }

  // Convert via base currency (INR)
  // Amount in base = amount * from.exchangeRate
  // Amount in target = (amount in base) / to.exchangeRate
  const amountInBase = amount * Number(from.exchangeRate)
  const convertedAmount = amountInBase / Number(to.exchangeRate)

  return Math.round(convertedAmount * 10000) / 10000 // Round to 4 decimal places
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = 'en-IN'
): string {
  const currencyMap: Record<string, string> = {
    INR: 'INR',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
  }

  const currency = currencyMap[currencyCode] || currencyCode

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Get currency symbol
 */
export async function getCurrencySymbol(
  tenantId: string | null,
  currencyCode: string
): Promise<string> {
  const currency = await prisma.currency.findFirst({
    where: {
      OR: [
        { tenantId, code: currencyCode },
        { tenantId: null, code: currencyCode },
      ],
      isActive: true,
    },
  })

  return currency?.symbol || currencyCode
}

