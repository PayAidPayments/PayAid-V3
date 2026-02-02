/**
 * Client-Safe Decision Risk Utilities
 * Pure functions that don't require Prisma or server-side code
 * Safe to import in client components
 */

/**
 * Get risk category label
 */
export function getRiskCategory(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= 70) return 'critical'
  if (riskScore >= 40) return 'high'
  if (riskScore >= 10) return 'medium'
  return 'low'
}

/**
 * Get risk category color (for UI)
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore >= 70) return 'red'
  if (riskScore >= 40) return 'orange'
  if (riskScore >= 10) return 'yellow'
  return 'green'
}
