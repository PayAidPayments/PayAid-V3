import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { getTimePeriodBounds, type TimePeriod } from '@/lib/utils/crm-filters'

// Helper function to get user role and build filter based on role
async function getUserFilter(tenantId: string, userId?: string) {
  if (!userId) {
    return { tenantId } // No user filter if no userId
  }

  const user = await prismaWithRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
  )

  if (!user) {
    return { tenantId }
  }

  // Admin/Owner: see all data
  if (user.role === 'owner' || user.role === 'admin') {
    return { tenantId }
  }

  // Manager: see team data (users they manage)
  if (user.role === 'manager') {
    // Get users managed by this manager (assuming there's a relationship)
    // For now, return tenantId - you can enhance this based on your user hierarchy
    return { tenantId }
  }

  // Regular user: see only their own data
  return {
    tenantId,
    assignedToId: userId,
  }
}

// Time period bounds now imported from shared utility

// Rate limiting: Track active requests per tenant
// For minimal data/users, allow 3 concurrent requests (dashboard may make multiple calls)
const activeRequests = new Map<string, number>()
const MAX_CONCURRENT_REQUESTS_PER_TENANT = 3 // Increased from 1 to 3 for minimal data

// GET /api/crm/dashboard/stats - Get CRM dashboard statistics
export async function GET(request: NextRequest) {
  let tenantId: string | undefined
  const startTime = Date.now()
  
  try {
    // Try to get module access - handle errors gracefully
    try {
      const access = await requireModuleAccess(request, 'crm')
      tenantId = access.tenantId
    } catch (licenseError) {
      // If it's a license error, return proper JSON response
      if (licenseError && typeof licenseError === 'object' && 'moduleId' in licenseError) {
        return handleLicenseError(licenseError)
      }
      // If token is invalid, return 401
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid or expired token. Please log in again.',
        },
        { status: 401 }
      )
    }
    
    const user = await authenticateRequest(request)
    
    // Get time period from query params (needed for sample data and rate limiting check)
    const searchParams = request.nextUrl.searchParams
    const timePeriod = (searchParams.get('period') || 'month') as TimePeriod
    
    // Rate limiting: if too many concurrent requests, return a real error (NO sample/demo data)
    const activeCount = activeRequests.get(tenantId) || 0
    if (activeCount >= MAX_CONCURRENT_REQUESTS_PER_TENANT) {
      console.warn(`[CRM_STATS] Rate limit: Tenant ${tenantId} has ${activeCount} active requests`)
      return NextResponse.json(
        {
          error: 'Too many concurrent requests',
          message: 'Please wait a moment and retry.',
          retryAfter: 2,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '2',
            'Cache-Control': 'no-store',
          },
        }
      )
    }
    
    // Increment active request count
    activeRequests.set(tenantId, activeCount + 1)
    
    try {
      const userFilter = await getUserFilter(tenantId, user?.userId)

    // Get current date for calculations
    const now = new Date()
    const periodBounds = getTimePeriodBounds(timePeriod)
    const periodStart = periodBounds.start
    const periodEnd = periodBounds.end

    // Calculate quarters - Q1 to Q4 of current fiscal year (April to March)
    const getQuarter = (date: Date) => {
      const month = date.getMonth()
      const year = date.getFullYear()
      // Fiscal year starts in April (month 3)
      let fiscalYear = year
      let quarter: number
      
      if (month >= 3) {
        // April (3) to March (2) of next year
        quarter = Math.floor((month - 3) / 3) + 1
      } else {
        // January to March belong to previous fiscal year's Q4
        fiscalYear = year - 1
        quarter = 4
      }
      
      return { quarter, year: fiscalYear, label: `Q${quarter}` }
    }

    // Get current fiscal year quarters (Q1-Q4)
    const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const quarters = [
      { quarter: 1, year: currentYear, label: 'Q1', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) }, // Apr-Jun
      { quarter: 2, year: currentYear, label: 'Q2', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) }, // Jul-Sep
      { quarter: 3, year: currentYear, label: 'Q3', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }, // Oct-Dec
      { quarter: 4, year: currentYear, label: 'Q4', start: new Date(currentYear + 1, 0, 1), end: new Date(currentYear + 1, 2, 31) }, // Jan-Mar
    ]

    // Build filter for deals (deals have assignedToId)
    const dealFilter = userFilter.assignedToId 
      ? { tenantId, assignedToId: userFilter.assignedToId }
      : { tenantId }
    
    // Build filter for contacts (contacts have assignedToId)
    const contactFilter = userFilter.assignedToId
      ? { tenantId, assignedToId: userFilter.assignedToId }
      : { tenantId }

    // PERFORMANCE OPTIMIZATION: Parallelize queries in batches for maximum speed
    // Removed all artificial delays - they were causing 4+ seconds of unnecessary wait time
    // Batch queries that can run independently in parallel
    
    // Batch 1: Core stats (all independent - run in parallel)
    const [
      dealsCreatedInPeriod,
      dealsClosingInPeriod,
      overdueTasks,
      totalTasks,
      completedTasks,
      totalMeetings,
      totalLeads,
      convertedLeads,
      pipelineByStageData,
      topLeadSourcesRaw,
      wonDealsForQuarters,
    ] = await Promise.all([
      // Query 1: Deals created
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        })
      ),
      // Query 2: Deals closing
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            expectedCloseDate: { gte: periodStart, lte: periodEnd },
            stage: { not: 'lost' },
          },
        })
      ),
      // Query 3: Overdue tasks
      prismaWithRetry(() =>
        prisma.task.count({
          where: {
            ...userFilter,
            dueDate: { lt: now },
            status: { in: ['pending', 'in_progress'] },
          },
        })
      ),
      // Query 4: Total tasks
      prismaWithRetry(() =>
        prisma.task.count({
          where: userFilter,
        })
      ),
      // Query 5: Completed tasks
      prismaWithRetry(() =>
        prisma.task.count({
          where: {
            ...userFilter,
            status: 'completed',
          },
        })
      ),
      // Query 6: Total meetings
      prismaWithRetry(() =>
        prisma.meeting.count({
          where: { tenantId },
        })
      ),
      // Query 7: Total leads
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            stage: { in: ['prospect', 'contact'] },
          },
        })
      ),
      // Query 8: Converted leads
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            stage: 'customer',
          },
        })
      ),
      // Query 9: Pipeline by stage (with values)
      prismaWithRetry(() =>
        prisma.deal.groupBy({
          by: ['stage'],
          where: dealFilter,
          _count: { id: true },
          _sum: { value: true },
        })
      ),
      // Query 10: Top lead sources
      prismaWithRetry(() =>
        prisma.leadSource.findMany({
          where: { tenantId },
          orderBy: { leadsCount: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            leadsCount: true,
            conversionsCount: true,
            totalValue: true,
            conversionRate: true,
          },
        }).catch(() => [])
      ),
      // Query 11: Won deals (for revenue calculation) - optimized to only fetch needed fields
      prismaWithRetry(() =>
        prisma.deal.findMany({
          where: {
            ...dealFilter,
            stage: 'won',
          },
          select: {
            value: true,
            actualCloseDate: true,
            updatedAt: true,
            createdAt: true,
          },
        })
      ),
    ])

    // Ensure topLeadSources is always an array
    let topLeadSources: any[] = []
    try {
      if (Array.isArray(topLeadSourcesRaw)) {
        topLeadSources = topLeadSourcesRaw
      }
    } catch (err) {
      console.error('[CRM_STATS] Error processing top lead sources:', err)
      topLeadSources = []
    }

    // Batch 2: Quarterly data (all 4 quarters in parallel - 8 queries total)
    const [
      q1DealsCreated,
      q1LeadsCreated,
      q2DealsCreated,
      q2LeadsCreated,
      q3DealsCreated,
      q3LeadsCreated,
      q4DealsCreated,
      q4LeadsCreated,
    ] = await Promise.all([
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            createdAt: { gte: quarters[0].start, lte: quarters[0].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            createdAt: { gte: quarters[0].start, lte: quarters[0].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            createdAt: { gte: quarters[1].start, lte: quarters[1].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            createdAt: { gte: quarters[1].start, lte: quarters[1].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            createdAt: { gte: quarters[2].start, lte: quarters[2].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            createdAt: { gte: quarters[2].start, lte: quarters[2].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.deal.count({
          where: {
            ...dealFilter,
            createdAt: { gte: quarters[3].start, lte: quarters[3].end },
          },
        })
      ),
      prismaWithRetry(() =>
        prisma.contact.count({
          where: {
            ...contactFilter,
            createdAt: { gte: quarters[3].start, lte: quarters[3].end },
          },
        })
      ),
    ])

    // Batch 3: Monthly lead creation - parallelize all 12 months at once
    const monthlyQueries = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      monthlyQueries.push(
        prismaWithRetry(() =>
          prisma.contact.count({
            where: {
              ...contactFilter,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          })
        )
      )
    }
    const monthlyCounts = await Promise.all(monthlyQueries)

    // Calculate revenue from won deals in the period
    // Reuse wonDealsForQuarters that we already fetched
    const revenueInPeriod = (Array.isArray(wonDealsForQuarters) ? wonDealsForQuarters : [])
      .filter(deal => {
        if (!deal) return false
        const closeDate = deal.actualCloseDate || deal.updatedAt || deal.createdAt
        if (!closeDate) return false
        const date = new Date(closeDate)
        if (isNaN(date.getTime())) return false
        const dateTime = date.getTime()
        return dateTime >= periodStart.getTime() && dateTime <= periodEnd.getTime()
      })
      .reduce((sum, deal) => sum + (deal?.value || 0), 0)

    // Helper function to filter won deals by quarter date
    const filterWonDealsByQuarter = (wonDeals: any[], quarter: typeof quarters[0]) => {
      const qStart = new Date(quarter.start.getFullYear(), quarter.start.getMonth(), quarter.start.getDate(), 0, 0, 0, 0)
      const qEnd = new Date(quarter.end.getFullYear(), quarter.end.getMonth(), quarter.end.getDate(), 23, 59, 59, 999)
      
      return wonDeals.filter(deal => {
        // Priority: actualCloseDate > updatedAt > createdAt
        const closeDate = deal.actualCloseDate || deal.updatedAt || deal.createdAt
        if (!closeDate) return false
        const date = new Date(closeDate)
        if (isNaN(date.getTime())) return false
        const dateTime = date.getTime()
        return dateTime >= qStart.getTime() && dateTime <= qEnd.getTime()
      })
    }

    // Build quarterly performance from database results
    // Reuse wonDealsForQuarters for all quarters (fetched once, filtered in memory)
    // Ensure wonDealsForQuarters is always an array
    const safeWonDeals = Array.isArray(wonDealsForQuarters) ? wonDealsForQuarters : []
    
    // Ensure quarters is an array with at least 4 elements
    const safeQuarters = Array.isArray(quarters) && quarters.length >= 4 ? quarters : [
      { label: 'Q1', start: startOfQuarter(new Date(now.getFullYear(), 0, 1)), end: endOfQuarter(new Date(now.getFullYear(), 0, 1)) },
      { label: 'Q2', start: startOfQuarter(new Date(now.getFullYear(), 3, 1)), end: endOfQuarter(new Date(now.getFullYear(), 3, 1)) },
      { label: 'Q3', start: startOfQuarter(new Date(now.getFullYear(), 6, 1)), end: endOfQuarter(new Date(now.getFullYear(), 6, 1)) },
      { label: 'Q4', start: startOfQuarter(new Date(now.getFullYear(), 9, 1)), end: endOfQuarter(new Date(now.getFullYear(), 9, 1)) },
    ]
    
    const quarterlyPerformanceArray = [
      {
        quarter: safeQuarters[0]?.label || 'Q1',
        leadsCreated: q1LeadsCreated || 0,
        dealsCreated: q1DealsCreated || 0,
        dealsWon: filterWonDealsByQuarter(safeWonDeals, safeQuarters[0]).length,
        revenue: filterWonDealsByQuarter(safeWonDeals, safeQuarters[0]).reduce((sum, d) => sum + (d?.value || 0), 0),
      },
      {
        quarter: safeQuarters[1]?.label || 'Q2',
        leadsCreated: q2LeadsCreated || 0,
        dealsCreated: q2DealsCreated || 0,
        dealsWon: filterWonDealsByQuarter(safeWonDeals, safeQuarters[1]).length,
        revenue: filterWonDealsByQuarter(safeWonDeals, safeQuarters[1]).reduce((sum, d) => sum + (d?.value || 0), 0),
      },
      {
        quarter: safeQuarters[2]?.label || 'Q3',
        leadsCreated: q3LeadsCreated || 0,
        dealsCreated: q3DealsCreated || 0,
        dealsWon: filterWonDealsByQuarter(safeWonDeals, safeQuarters[2]).length,
        revenue: filterWonDealsByQuarter(safeWonDeals, safeQuarters[2]).reduce((sum, d) => sum + (d?.value || 0), 0),
      },
      {
        quarter: safeQuarters[3]?.label || 'Q4',
        leadsCreated: q4LeadsCreated || 0,
        dealsCreated: q4DealsCreated || 0,
        dealsWon: filterWonDealsByQuarter(safeWonDeals, safeQuarters[3]).length,
        revenue: filterWonDealsByQuarter(safeWonDeals, safeQuarters[3]).reduce((sum, d) => sum + (d?.value || 0), 0),
      },
    ]
    
    // Ensure quarterlyPerformanceArray is an array before mapping (NO sample/demo fallback)
    const quarterlyPerformance = Array.isArray(quarterlyPerformanceArray)
      ? quarterlyPerformanceArray.map((data) => ({
          quarter: data?.quarter || '',
          leadsCreated: data?.leadsCreated || 0,
          dealsCreated: data?.dealsCreated || 0,
          dealsWon: data?.dealsWon || 0,
          revenue: data?.revenue || 0,
        }))
      : []

    // Calculate pipeline by stage from groupBy result (with values)
    const pipelineStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    const pipelineByStage = (Array.isArray(pipelineByStageData) ? pipelineByStageData : [])
      .filter(item => item && item.stage && pipelineStages.includes(item.stage))
      .map(item => ({
        stage: item.stage.charAt(0).toUpperCase() + item.stage.slice(1),
        count: item._count?.id || 0,
        value: Number(item._sum?.value || 0),
      }))
      .filter(item => item.count > 0)

    // Build monthly lead creation from database results
    // Generate 12 months: from 11 months ago to current month (or future months if needed)
    // Ensure monthlyCounts is always an array before processing
    let safeMonthlyCounts: number[] = []
    try {
      if (Array.isArray(monthlyCounts)) {
        safeMonthlyCounts = monthlyCounts.filter((c: any) => typeof c === 'number' || (typeof c === 'string' && !isNaN(Number(c))))
          .map((c: any) => Number(c) || 0)
      } else if (monthlyCounts && typeof monthlyCounts === 'object') {
        // If it's an object, try to extract array values
        console.warn('[CRM_STATS] monthlyCounts is not an array:', typeof monthlyCounts, monthlyCounts)
        safeMonthlyCounts = []
      }
    } catch (err) {
      console.error('[CRM_STATS] Error processing monthlyCounts:', err)
      safeMonthlyCounts = []
    }
    
    const monthlyLeadCreation = safeMonthlyCounts
      .slice() // Create a copy before reversing to avoid mutating
      .reverse() // Reverse to get chronological order (oldest to newest)
      .map((count, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: count || 0,
        }
      })
    
    // NOTE: No sample/demo monthly data. If some months are missing, UI should handle gaps/zeros.

    // Note: March 2025 data is already included in monthly queries above

    // Check if we have any real data - if not, use sample data for better UX
    const hasRealData = dealsCreatedInPeriod > 0 || revenueInPeriod > 0 || dealsClosingInPeriod > 0 || 
                        (Array.isArray(pipelineByStage) && pipelineByStage.length > 0) ||
                        (Array.isArray(quarterlyPerformance) && quarterlyPerformance.some(q => q.leadsCreated > 0 || q.dealsCreated > 0))
    
    // CRITICAL: NO HARDCODED VALUES - Only return real database data
    // If there's no data, return 0. The UI should handle empty states gracefully.
    const stats = {
      dealsCreatedThisMonth: dealsCreatedInPeriod,
      revenueThisMonth: revenueInPeriod,
      dealsClosingThisMonth: dealsClosingInPeriod,
      overdueTasks: overdueTasks || 0,
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      totalMeetings: totalMeetings || 0,
      totalLeads: totalLeads || 0,
      convertedLeads: convertedLeads || 0,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      quarterlyPerformance: (() => {
        // CRITICAL: NO HARDCODED VALUES - Only return real database data
        if (Array.isArray(quarterlyPerformance) && quarterlyPerformance.length > 0) {
          return quarterlyPerformance.map(q => ({
            quarter: String(q?.quarter || ''),
            leadsCreated: Number(q?.leadsCreated || 0),
            dealsCreated: Number(q?.dealsCreated || 0),
            dealsWon: Number(q?.dealsWon || 0),
            revenue: Number(q?.revenue || 0),
          }))
        }
        return []
      })(),
      pipelineByStage: (() => {
        // CRITICAL: NO HARDCODED VALUES - Only return real database data
        if (Array.isArray(pipelineByStage) && pipelineByStage.length > 0) {
          return pipelineByStage.map(item => ({
            stage: String(item?.stage || 'Unknown'),
            count: Number(item?.count || 0),
            value: Number(item?.value || 0),
          }))
        }
        return []
      })(),
      monthlyLeadCreation: (() => {
        // CRITICAL: NO HARDCODED VALUES - Only return real database data
        if (Array.isArray(monthlyLeadCreation) && monthlyLeadCreation.length > 0) {
          return monthlyLeadCreation.map(item => ({
            month: String(item?.month || ''),
            count: Number(item?.count || 0),
          }))
        }
        return []
      })(),
      topLeadSources: (() => {
        // CRITICAL: NO HARDCODED VALUES - Only return real database data
        try {
          if (Array.isArray(topLeadSources) && topLeadSources.length > 0) {
            const filtered = topLeadSources.filter((source: any) => source && (source.leadsCount || 0) > 0)
            if (filtered.length > 0) {
              return filtered.map((source: any) => ({
                name: String(source?.name || 'Unknown'),
                leadsCount: Number(source?.leadsCount || 0),
                conversionsCount: Number(source?.conversionsCount || 0),
                totalValue: Number(source?.totalValue || 0),
                conversionRate: Number(source?.conversionRate || 0),
              }))
            }
          }
          return []
        } catch (err) {
          console.error('[CRM_STATS] Error processing topLeadSources:', err)
          return []
        }
      })(),
      periodLabel: periodBounds.label,
    }

    const durationMs = Date.now() - startTime
    console.log(`[CRM_STATS] tenant=${tenantId} period=${timePeriod} duration=${durationMs}ms`)

    // Safe caching: response is user-context sensitive. Use private cache + Vary: Authorization.
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        Vary: 'Authorization',
        'Server-Timing': `app;dur=${durationMs}`,
      },
    })
    } finally {
      // Decrement active request count
      const currentCount = activeRequests.get(tenantId) || 0
      if (currentCount > 0) {
        activeRequests.set(tenantId, currentCount - 1)
      } else {
        activeRequests.delete(tenantId)
      }
    }
  } catch (error: any) {
    // Decrement active request count on error
    if (tenantId) {
      const currentCount = activeRequests.get(tenantId) || 0
      if (currentCount > 0) {
        activeRequests.set(tenantId, currentCount - 1)
      } else {
        activeRequests.delete(tenantId)
      }
    }
    
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('[CRM_STATS] Error:', error)
    
    // Handle connection pool exhaustion specifically
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || ''
    const isPoolExhausted = errorMessage.includes('MaxClientsInSessionMode') || 
                            errorMessage.includes('max clients reached') ||
                            errorMessage.includes('connection pool is full') ||
                            errorCode === 'P1002' ||
                            errorCode === 'CIRCUIT_OPEN' ||
                            error?.isCircuitBreaker
    
    if (isPoolExhausted) {
      console.warn('[CRM_STATS] Database connection pool exhausted')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          message: 'Too many concurrent requests. Please try again in a moment.',
          retryAfter: 5,
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
    // Always return valid JSON with fallback stats structure, even on unexpected errors
    // This prevents frontend from crashing with "t.map is not a function"
    const fallbackStats = {
      dealsCreatedThisMonth: 0,
      revenueThisMonth: 0,
      dealsClosingThisMonth: 0,
      overdueTasks: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalMeetings: 0,
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      quarterlyPerformance: [],
      pipelineByStage: [],
      monthlyLeadCreation: [],
      topLeadSources: [],
      periodLabel: 'This Month',
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard stats',
        message: errorMessage || 'An unexpected error occurred',
        ...fallbackStats, // Include fallback stats to prevent frontend crashes
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

