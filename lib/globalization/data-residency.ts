/**
 * Data Residency Options
 * Control where data is stored geographically
 */

import 'server-only'

export interface DataResidencyConfig {
  region: 'IN' | 'US' | 'EU' | 'SG' | 'AE'
  storageLocation: string
  compliance: string[]
}

const RESIDENCY_OPTIONS: DataResidencyConfig[] = [
  {
    region: 'IN',
    storageLocation: 'Mumbai, India',
    compliance: ['Data Localization', 'IT Act 2000'],
  },
  {
    region: 'US',
    storageLocation: 'Virginia, USA',
    compliance: ['SOC 2', 'GDPR (for EU data)'],
  },
  {
    region: 'EU',
    storageLocation: 'Frankfurt, Germany',
    compliance: ['GDPR', 'EU Data Protection'],
  },
  {
    region: 'SG',
    storageLocation: 'Singapore',
    compliance: ['PDPA'],
  },
  {
    region: 'AE',
    storageLocation: 'Dubai, UAE',
    compliance: ['UAE Data Protection'],
  },
]

/**
 * Get data residency options
 */
export function getDataResidencyOptions(): DataResidencyConfig[] {
  return RESIDENCY_OPTIONS
}

/**
 * Validate data residency compliance
 */
export function validateDataResidency(
  tenantRegion: string,
  dataRegion: string
): { compliant: boolean; reason?: string } {
  if (tenantRegion === dataRegion) {
    return { compliant: true }
  }

  // Cross-region rules
  if (tenantRegion === 'EU' && dataRegion !== 'EU') {
    return {
      compliant: false,
      reason: 'EU data must be stored in EU region',
    }
  }

  return { compliant: true }
}
