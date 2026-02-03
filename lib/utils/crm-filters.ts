/**
 * Shared CRM Filter Utilities
 * 
 * This module provides consistent filter logic for both dashboard and backend pages.
 * Ensures that when a user clicks a dashboard card, the backend page shows exactly
 * the same data that was displayed on the dashboard.
 * 
 * MANDATORY REQUIREMENT: All dashboard queries and backend page queries MUST use
 * these functions to ensure filter synchronization.
 */

import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

export type TimePeriod = 'month' | 'quarter' | 'financial-year' | 'year'
export type DealCategory = 'all' | 'created' | 'closing' | 'won' | 'lost' | 'active'

export interface TimePeriodBounds {
  start: Date
  end: Date
  label: string
}

/**
 * Get time period bounds - used by both dashboard and backend pages
 */
export function getTimePeriodBounds(timePeriod: TimePeriod = 'month'): TimePeriodBounds {
  const now = new Date()
  
  switch (timePeriod) {
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month'
      }
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
        label: 'This Quarter'
      }
    case 'financial-year':
      // Financial year in India runs from April 1 to March 31
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() // 0-indexed (0=Jan, 3=Apr, 11=Dec)
      const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1
      const fyEndYear = fyStartYear + 1
      return {
        start: new Date(fyStartYear, 3, 1), // April 1
        end: new Date(fyEndYear, 2, 31, 23, 59, 59, 999), // March 31
        label: 'This Financial Year'
      }
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'This Year'
      }
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month'
      }
  }
}

/**
 * Build deal filter based on category and time period
 * This is the SINGLE SOURCE OF TRUTH for deal filtering
 */
export function buildDealFilter(
  tenantId: string,
  category: DealCategory = 'all',
  timePeriod: TimePeriod = 'month',
  assignedToId?: string
): any {
  const baseFilter: any = { tenantId }
  
  if (assignedToId) {
    baseFilter.assignedToId = assignedToId
  }
  
  const periodBounds = getTimePeriodBounds(timePeriod)
  
  switch (category) {
    case 'created':
      // Deals created in the time period
      return {
        ...baseFilter,
        createdAt: {
          gte: periodBounds.start,
          lte: periodBounds.end
        }
      }
    
    case 'closing':
      // Deals expected to close in the time period (not won or lost)
      return {
        ...baseFilter,
        expectedCloseDate: {
          gte: periodBounds.start,
          lte: periodBounds.end
        },
        status: {
          notIn: ['won', 'lost']
        }
      }
    
    case 'won':
      // Deals won in the time period
      return {
        ...baseFilter,
        status: 'won',
        OR: [
          {
            actualCloseDate: {
              gte: periodBounds.start,
              lte: periodBounds.end
            }
          },
          {
            // Fallback to updatedAt if actualCloseDate is not set
            AND: [
              { actualCloseDate: null },
              { updatedAt: { gte: periodBounds.start, lte: periodBounds.end } }
            ]
          }
        ]
      }
    
    case 'lost':
      // Deals lost in the time period
      return {
        ...baseFilter,
        status: 'lost',
        OR: [
          {
            actualCloseDate: {
              gte: periodBounds.start,
              lte: periodBounds.end
            }
          },
          {
            // Fallback to updatedAt if actualCloseDate is not set
            AND: [
              { actualCloseDate: null },
              { updatedAt: { gte: periodBounds.start, lte: periodBounds.end } }
            ]
          }
        ]
      }
    
    case 'active':
      // Active deals (not won or lost)
      return {
        ...baseFilter,
        status: {
          notIn: ['won', 'lost']
        }
      }
    
    case 'all':
    default:
      // All deals (no time filter)
      return baseFilter
  }
}

/**
 * Build task filter based on category and time period
 */
export function buildTaskFilter(
  tenantId: string,
  category: 'all' | 'overdue' | 'upcoming' | 'completed' = 'all',
  timePeriod?: TimePeriod,
  assignedToId?: string
): any {
  const baseFilter: any = { tenantId }
  
  if (assignedToId) {
    baseFilter.assignedToId = assignedToId
  }
  
  const now = new Date()
  
  switch (category) {
    case 'overdue':
      return {
        ...baseFilter,
        status: {
          not: 'completed'
        },
        dueDate: {
          lt: now
        }
      }
    
    case 'upcoming':
      const periodBounds = timePeriod ? getTimePeriodBounds(timePeriod) : getTimePeriodBounds('month')
      return {
        ...baseFilter,
        status: {
          not: 'completed'
        },
        dueDate: {
          gte: now,
          lte: periodBounds.end
        }
      }
    
    case 'completed':
      const completedPeriodBounds = timePeriod ? getTimePeriodBounds(timePeriod) : getTimePeriodBounds('month')
      return {
        ...baseFilter,
        status: 'completed',
        completedAt: {
          gte: completedPeriodBounds.start,
          lte: completedPeriodBounds.end
        }
      }
    
    case 'all':
    default:
      return baseFilter
  }
}

/**
 * Validate that filter parameters are valid
 */
export function validateFilterParams(
  category?: string,
  timePeriod?: string
): { category: DealCategory; timePeriod: TimePeriod } {
  const validCategories: DealCategory[] = ['all', 'created', 'closing', 'won', 'lost', 'active']
  const validTimePeriods: TimePeriod[] = ['month', 'quarter', 'financial-year', 'year']
  
  const validatedCategory = (validCategories.includes(category as DealCategory) 
    ? category 
    : 'all') as DealCategory
  
  const validatedTimePeriod = (validTimePeriods.includes(timePeriod as TimePeriod)
    ? timePeriod
    : 'month') as TimePeriod
  
  return {
    category: validatedCategory,
    timePeriod: validatedTimePeriod
  }
}
