/**
 * CRM Data Validation Layer
 * 
 * Ensures data consistency between dashboard and backend pages.
 * Validates that filters produce matching results across different queries.
 */

import { prisma } from '@/lib/db/prisma'
import { buildDealFilter, buildTaskFilter, getTimePeriodBounds, type DealCategory, type TimePeriod } from './crm-filters'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    dashboardCount: number
    backendCount: number
    difference: number
  }
}

/**
 * Validate that dashboard stats match backend page counts
 */
export async function validateDashboardBackendConsistency(
  tenantId: string,
  category: DealCategory,
  timePeriod: TimePeriod
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Get dashboard stats
    const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/dashboard/stats?timePeriod=${timePeriod}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}`,
      },
    })
    
    if (!dashboardResponse.ok) {
      errors.push(`Dashboard API returned ${dashboardResponse.status}`)
      return {
        isValid: false,
        errors,
        warnings,
        stats: { dashboardCount: 0, backendCount: 0, difference: 0 },
      }
    }
    
    const dashboardData = await dashboardResponse.json()
    
    // Get backend count using same filter
    const filter = buildDealFilter(tenantId, category, timePeriod)
    const backendCount = await prisma.deal.count({ where: filter })
    
    // Get dashboard count based on category
    let dashboardCount = 0
    switch (category) {
      case 'created':
        dashboardCount = dashboardData.dealsCreatedThisMonth || 0
        break
      case 'won':
        // Calculate from revenue or won deals count
        dashboardCount = dashboardData.dealsClosingThisMonth || 0 // This might need adjustment
        break
      case 'closing':
        dashboardCount = dashboardData.dealsClosingThisMonth || 0
        break
      default:
        dashboardCount = 0
    }
    
    const difference = Math.abs(dashboardCount - backendCount)
    const isValid = difference === 0
    
    if (difference > 0) {
      errors.push(
        `Mismatch: Dashboard shows ${dashboardCount} ${category} deals, but backend shows ${backendCount} (difference: ${difference})`
      )
    }
    
    if (difference > 5) {
      warnings.push(`Large difference detected: ${difference} records. This may indicate a filter synchronization issue.`)
    }
    
    return {
      isValid,
      errors,
      warnings,
      stats: {
        dashboardCount,
        backendCount,
        difference,
      },
    }
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`)
    return {
      isValid: false,
      errors,
      warnings,
      stats: { dashboardCount: 0, backendCount: 0, difference: 0 },
    }
  }
}

/**
 * Validate that all dashboard cards have corresponding backend data
 */
export async function validateAllDashboardCards(tenantId: string): Promise<ValidationResult[]> {
  const categories: DealCategory[] = ['created', 'won', 'closing']
  const timePeriods: TimePeriod[] = ['month', 'quarter', 'financial-year']
  
  const results: ValidationResult[] = []
  
  for (const category of categories) {
    for (const timePeriod of timePeriods) {
      const result = await validateDashboardBackendConsistency(tenantId, category, timePeriod)
      results.push(result)
    }
  }
  
  return results
}

/**
 * Validate task counts match between dashboard and backend
 */
export async function validateTaskCounts(
  tenantId: string,
  category: 'all' | 'overdue' | 'upcoming' | 'completed' = 'all',
  timePeriod?: TimePeriod
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const filter = buildTaskFilter(tenantId, category, timePeriod)
    const backendCount = await prisma.task.count({ where: filter })
    
    // Get dashboard stats
    const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}`,
      },
    })
    
    if (!dashboardResponse.ok) {
      errors.push(`Dashboard API returned ${dashboardResponse.status}`)
      return {
        isValid: false,
        errors,
        warnings,
        stats: { dashboardCount: 0, backendCount, difference: backendCount },
      }
    }
    
    const dashboardData = await dashboardResponse.json()
    let dashboardCount = 0
    
    switch (category) {
      case 'overdue':
        dashboardCount = dashboardData.overdueTasks || 0
        break
      case 'completed':
        dashboardCount = dashboardData.completedTasks || 0
        break
      default:
        dashboardCount = dashboardData.totalTasks || 0
    }
    
    const difference = Math.abs(dashboardCount - backendCount)
    const isValid = difference === 0
    
    if (difference > 0) {
      errors.push(
        `Task count mismatch: Dashboard shows ${dashboardCount} ${category} tasks, but backend shows ${backendCount} (difference: ${difference})`
      )
    }
    
    return {
      isValid,
      errors,
      warnings,
      stats: {
        dashboardCount,
        backendCount,
        difference,
      },
    }
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`)
    return {
      isValid: false,
      errors,
      warnings,
      stats: { dashboardCount: 0, backendCount: 0, difference: 0 },
    }
  }
}

/**
 * Comprehensive validation - checks all data consistency
 */
export async function validateCRMDataIntegrity(tenantId: string): Promise<{
  isValid: boolean
  results: ValidationResult[]
  summary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
  }
}> {
  const results: ValidationResult[] = []
  
  // Validate all dashboard cards
  const cardResults = await validateAllDashboardCards(tenantId)
  results.push(...cardResults)
  
  // Validate task counts
  const taskResults = await Promise.all([
    validateTaskCounts(tenantId, 'overdue'),
    validateTaskCounts(tenantId, 'completed'),
    validateTaskCounts(tenantId, 'all'),
  ])
  results.push(...taskResults)
  
  const summary = {
    totalChecks: results.length,
    passed: results.filter(r => r.isValid).length,
    failed: results.filter(r => !r.isValid).length,
    warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
  }
  
  return {
    isValid: summary.failed === 0,
    results,
    summary,
  }
}
