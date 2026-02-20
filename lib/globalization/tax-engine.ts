/**
 * Tax Engine Abstraction (Avalara-style)
 * Abstract tax calculation for different countries/regions
 */

import 'server-only'

export interface TaxRule {
  country: string
  region?: string
  taxType: 'GST' | 'VAT' | 'Sales Tax' | 'Service Tax'
  rate: number
  appliesTo: string[]
}

export interface TaxCalculation {
  subtotal: number
  taxes: Array<{
    name: string
    rate: number
    amount: number
  }>
  total: number
}

const TAX_RULES: TaxRule[] = [
  {
    country: 'IN',
    taxType: 'GST',
    rate: 18,
    appliesTo: ['goods', 'services'],
  },
  {
    country: 'US',
    region: 'CA',
    taxType: 'Sales Tax',
    rate: 7.25,
    appliesTo: ['goods'],
  },
  {
    country: 'GB',
    taxType: 'VAT',
    rate: 20,
    appliesTo: ['goods', 'services'],
  },
]

/**
 * Calculate tax for an amount
 */
export function calculateTax(
  amount: number,
  country: string,
  region?: string,
  taxType?: 'GST' | 'VAT' | 'Sales Tax' | 'Service Tax'
): TaxCalculation {
  const rule = TAX_RULES.find((r) => {
    return (
      r.country === country &&
      (!region || r.region === region) &&
      (!taxType || r.taxType === taxType)
    )
  })

  if (!rule) {
    return {
      subtotal: amount,
      taxes: [],
      total: amount,
    }
  }

  const taxAmount = (amount * rule.rate) / 100

  return {
    subtotal: amount,
    taxes: [
      {
        name: rule.taxType,
        rate: rule.rate,
        amount: taxAmount,
      },
    ],
    total: amount + taxAmount,
  }
}

/**
 * Get tax rules for a country
 */
export function getTaxRules(country: string, region?: string): TaxRule[] {
  return TAX_RULES.filter(
    (r) => r.country === country && (!region || r.region === region)
  )
}
