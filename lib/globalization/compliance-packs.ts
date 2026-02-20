/**
 * Country-Specific Compliance Packs
 * Pre-configured compliance rules for different countries
 */

import 'server-only'

export interface CompliancePack {
  country: string
  name: string
  regulations: string[]
  features: string[]
}

const COMPLIANCE_PACKS: CompliancePack[] = [
  {
    country: 'IN',
    name: 'India Compliance Pack',
    regulations: ['GST', 'TDS', 'PF', 'ESI', 'Labour Laws'],
    features: [
      'GST filing (GSTR-1, GSTR-3B)',
      'TDS calculation and filing',
      'PF/ESI compliance',
      'Invoice numbering as per GST rules',
    ],
  },
  {
    country: 'US',
    name: 'US Compliance Pack',
    regulations: ['IRS', 'State Tax', 'Sales Tax'],
    features: [
      '1099 generation',
      'Sales tax calculation',
      'W-9 management',
      'State-specific tax rules',
    ],
  },
  {
    country: 'GB',
    name: 'UK Compliance Pack',
    regulations: ['VAT', 'HMRC', 'GDPR'],
    features: [
      'VAT return filing',
      'MTD (Making Tax Digital)',
      'GDPR compliance',
      'VAT invoice format',
    ],
  },
  {
    country: 'AE',
    name: 'UAE Compliance Pack',
    regulations: ['VAT', 'Emirates ID'],
    features: [
      'VAT return filing',
      'Emirates ID validation',
      'Arabic invoice support',
    ],
  },
]

/**
 * Get compliance pack for a country
 */
export function getCompliancePack(country: string): CompliancePack | null {
  return COMPLIANCE_PACKS.find((p) => p.country === country) || null
}

/**
 * Get all available compliance packs
 */
export function getAllCompliancePacks(): CompliancePack[] {
  return COMPLIANCE_PACKS
}
