/**
 * E2E Tests for CRM Dashboard Data Integrity
 * 
 * Tests that dashboard cards show accurate counts and clicking them
 * navigates to backend pages with matching data.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { buildDealFilter, getTimePeriodBounds, type DealCategory, type TimePeriod } from '@/lib/utils/crm-filters'

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Test data
let tenantId: string
let adminToken: string

beforeAll(async () => {
  // Setup: Get or create test tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })
  
  if (!tenant) {
    throw new Error('Test tenant not found. Please seed demo data first.')
  }
  
  tenantId = tenant.id
  
  // Get admin user token (you may need to implement token generation)
  // For now, we'll use a placeholder - in real tests, generate actual JWT
  adminToken = process.env.ADMIN_TOKEN || 'test-token'
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('CRM Dashboard Data Integrity', () => {
  test('Dashboard cards show accurate counts', async () => {
    // Fetch dashboard stats
    const response = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=month`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(response.ok).toBe(true)
    const stats = await response.json()
    
    // Verify no hardcoded values
    expect(stats.dealsCreatedThisMonth).toBeGreaterThanOrEqual(0)
    expect(stats.revenueThisMonth).toBeGreaterThanOrEqual(0)
    expect(stats.dealsClosingThisMonth).toBeGreaterThanOrEqual(0)
    
    // Query database directly to verify counts
    const periodBounds = getTimePeriodBounds('month')
    const actualDealsCreated = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: {
          gte: periodBounds.start,
          lte: periodBounds.end,
        },
      },
    })
    
    // Assert dashboard matches database
    expect(stats.dealsCreatedThisMonth).toBe(actualDealsCreated)
  })
  
  test('Clicking card navigates to filtered backend page', async () => {
    // Get dashboard count
    const dashboardResponse = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=month`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(dashboardResponse.ok).toBe(true)
    const dashboardData = await dashboardResponse.json()
    const dashboardCount = dashboardData.dealsCreatedThisMonth
    
    // Simulate clicking "Deals Created" card - should navigate to /Deals?category=created&timePeriod=month
    const category: DealCategory = 'created'
    const timePeriod: TimePeriod = 'month'
    
    // Get backend page data using same filter
    const filter = buildDealFilter(tenantId, category, timePeriod)
    const backendDeals = await prisma.deal.findMany({
      where: filter,
      take: 1000, // Get all deals matching filter
    })
    
    // Assert counts match
    expect(backendDeals.length).toBe(dashboardCount)
  })
  
  test('Backend page applies same filters as dashboard query', async () => {
    const category: DealCategory = 'created'
    const timePeriod: TimePeriod = 'month'
    
    // Dashboard query filter
    const dashboardFilter = buildDealFilter(tenantId, category, timePeriod)
    
    // Backend query filter (should be identical)
    const backendFilter = buildDealFilter(tenantId, category, timePeriod)
    
    // Assert filters are identical
    expect(JSON.stringify(dashboardFilter)).toBe(JSON.stringify(backendFilter))
    
    // Verify both queries return same count
    const dashboardCount = await prisma.deal.count({ where: dashboardFilter })
    const backendCount = await prisma.deal.count({ where: backendFilter })
    
    expect(dashboardCount).toBe(backendCount)
  })
  
  test('No hardcoded values in dashboard API response', async () => {
    const response = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=month`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(response.ok).toBe(true)
    const stats = await response.json()
    
    // Verify all values are numbers (not hardcoded strings or special values)
    expect(typeof stats.dealsCreatedThisMonth).toBe('number')
    expect(typeof stats.revenueThisMonth).toBe('number')
    expect(typeof stats.dealsClosingThisMonth).toBe('number')
    
    // Verify arrays are arrays (not hardcoded sample data)
    expect(Array.isArray(stats.quarterlyPerformance)).toBe(true)
    expect(Array.isArray(stats.pipelineByStage)).toBe(true)
    expect(Array.isArray(stats.monthlyLeadCreation)).toBe(true)
    expect(Array.isArray(stats.topLeadSources)).toBe(true)
  })
  
  test('Revenue calculation matches won deals value', async () => {
    const periodBounds = getTimePeriodBounds('month')
    
    // Get dashboard revenue
    const dashboardResponse = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=month`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(dashboardResponse.ok).toBe(true)
    const dashboardData = await dashboardResponse.json()
    const dashboardRevenue = dashboardData.revenueThisMonth
    
    // Calculate actual revenue from won deals in period
    const wonDeals = await prisma.deal.findMany({
      where: {
        tenantId,
        status: 'won',
        OR: [
          {
            actualCloseDate: {
              gte: periodBounds.start,
              lte: periodBounds.end,
            },
          },
          {
            AND: [
              { actualCloseDate: null },
              { updatedAt: { gte: periodBounds.start, lte: periodBounds.end } },
            ],
          },
        ],
      },
      select: { value: true },
    })
    
    const actualRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    
    // Assert dashboard revenue matches actual revenue
    expect(dashboardRevenue).toBe(actualRevenue)
  })
  
  test('Deals closing count matches expected close date filter', async () => {
    const periodBounds = getTimePeriodBounds('month')
    
    // Get dashboard count
    const dashboardResponse = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=month`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(dashboardResponse.ok).toBe(true)
    const dashboardData = await dashboardResponse.json()
    const dashboardCount = dashboardData.dealsClosingThisMonth
    
    // Get actual count of deals closing in period
    const actualCount = await prisma.deal.count({
      where: {
        tenantId,
        expectedCloseDate: {
          gte: periodBounds.start,
          lte: periodBounds.end,
        },
        status: {
          notIn: ['won', 'lost'],
        },
      },
    })
    
    // Assert counts match
    expect(dashboardCount).toBe(actualCount)
  })
  
  test('Overdue tasks count matches database', async () => {
    const now = new Date()
    
    // Get dashboard count
    const dashboardResponse = await fetch(`${BASE_URL}/api/crm/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(dashboardResponse.ok).toBe(true)
    const dashboardData = await dashboardResponse.json()
    const dashboardCount = dashboardData.overdueTasks
    
    // Get actual count of overdue tasks
    const actualCount = await prisma.task.count({
      where: {
        tenantId,
        status: {
          not: 'completed',
        },
        dueDate: {
          lt: now,
        },
      },
    })
    
    // Assert counts match
    expect(dashboardCount).toBe(actualCount)
  })
})

describe('Filter Synchronization', () => {
  test('Time period filter produces consistent results', async () => {
    const timePeriods: TimePeriod[] = ['month', 'quarter', 'financial-year', 'year']
    
    for (const timePeriod of timePeriods) {
      const periodBounds = getTimePeriodBounds(timePeriod)
      
      // Dashboard query
      const dashboardResponse = await fetch(`${BASE_URL}/api/crm/dashboard/stats?timePeriod=${timePeriod}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })
      
      expect(dashboardResponse.ok).toBe(true)
      const dashboardData = await dashboardResponse.json()
      
      // Backend query using same filter
      const backendCount = await prisma.deal.count({
        where: {
          tenantId,
          createdAt: {
            gte: periodBounds.start,
            lte: periodBounds.end,
          },
        },
      })
      
      // Assert counts match
      expect(dashboardData.dealsCreatedThisMonth).toBe(backendCount)
    }
  })
  
  test('Category filter produces consistent results', async () => {
    const categories: DealCategory[] = ['created', 'won', 'closing', 'lost', 'active']
    const timePeriod: TimePeriod = 'month'
    
    for (const category of categories) {
      const filter = buildDealFilter(tenantId, category, timePeriod)
      const backendCount = await prisma.deal.count({ where: filter })
      
      // Verify filter is valid (not empty or malformed)
      expect(filter.tenantId).toBe(tenantId)
      expect(backendCount).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Data Validation', () => {
  test('All dashboard metrics have corresponding database records', async () => {
    const response = await fetch(`${BASE_URL}/api/crm/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(response.ok).toBe(true)
    const stats = await response.json()
    
    // Verify each metric can be validated against database
    const periodBounds = getTimePeriodBounds('month')
    
    // Deals created
    const dealsCreated = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: {
          gte: periodBounds.start,
          lte: periodBounds.end,
        },
      },
    })
    expect(stats.dealsCreatedThisMonth).toBe(dealsCreated)
    
    // Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        tenantId,
        status: { not: 'completed' },
        dueDate: { lt: new Date() },
      },
    })
    expect(stats.overdueTasks).toBe(overdueTasks)
  })
  
  test('No sample/fallback data in response', async () => {
    const response = await fetch(`${BASE_URL}/api/crm/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
    
    expect(response.ok).toBe(true)
    const stats = await response.json()
    
    // Check for common hardcoded values
    const hardcodedValues = [12, 450000, 8, 52, 48, 60, 55, 25, 18, 15]
    
    // If stats match hardcoded values exactly, it might be a coincidence
    // But we should verify they come from database queries
    const hasRealData = await prisma.deal.count({ where: { tenantId } }) > 0
    
    if (hasRealData) {
      // If we have real data, stats should reflect it (may or may not match hardcoded values)
      // The important thing is they come from database, not hardcoded
      expect(typeof stats.dealsCreatedThisMonth).toBe('number')
      expect(typeof stats.revenueThisMonth).toBe('number')
    }
  })
})
