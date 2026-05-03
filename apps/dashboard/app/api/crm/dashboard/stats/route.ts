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

// NOTE: In-memory rate limiting doesn't work well in serverless (Vercel)
// Each function invocation may be a new instance, so the Map won't persist
// Transaction mode (port 6543) should handle concurrent requests better
// Keeping this for logging purposes only, but not blocking requests
const activeRequests = new Map<string, number>()
const MAX_CONCURRENT_REQUESTS_PER_TENANT = 100 // Effectively disabled - rely on transaction mode

// GET /api/crm/dashboard/stats - Get CRM dashboard statistics
export async function GET(request: NextRequest) {
  let tenantId: string | undefined
  const startTime = Date.now()
  const statsVerbose =
    process.env.NODE_ENV !== 'production' || process.env.CRM_STATS_VERBOSE === '1'
  
  try {
    // Try to get module access - handle errors gracefully
    try {
      const access = await requireModuleAccess(request, 'crm')
      const jwtTenantId = access.tenantId
      const searchParams = request.nextUrl.searchParams
      const requestTenantId = searchParams.get('tenantId') || undefined

      // When viewing /crm/[tenantId]/Home, frontend can send that tenantId so stats match the Deals page
      if (requestTenantId && requestTenantId !== jwtTenantId) {
        const { prisma } = await import('@/lib/db/prisma')
        const user = await prisma.user.findUnique({
          where: { id: access.userId },
          select: { tenantId: true },
        })
        if (user?.tenantId === requestTenantId) {
          tenantId = requestTenantId
        } else {
          tenantId = jwtTenantId
        }
      } else {
        tenantId = jwtTenantId
      }
      
    if (statsVerbose) {
      console.log('[CRM_DASHBOARD] Fetching stats for tenantId:', tenantId)
    }
      
      if (!tenantId) {
        console.error('[CRM_DASHBOARD] No tenantId found in request')
        return NextResponse.json(
          { error: 'No tenantId found in request' },
          { status: 400 }
        )
      }
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
    const liteMode = searchParams.get('lite') === '1'
    // After lite=1 KPIs, client can request charts only to avoid re-running the same counts.
    const chartsOnly = !liteMode && searchParams.get('chartsOnly') === '1'
    
    // Check if seed is running (may cause connection pool exhaustion)
    // Only block if seed is VERY recent (less than 5 seconds) to avoid blocking during normal operation
    // In serverless, the seed status Map may not persist across invocations, so be lenient
    try {
      const { isSeedRunning } = await import('@/lib/utils/seed-status')
      const seedStatus = isSeedRunning(tenantId)
      if (seedStatus.running && seedStatus.elapsed && seedStatus.elapsed < 5000) { // Only block if less than 5 seconds
        const elapsedSeconds = Math.floor((seedStatus.elapsed || 0) / 1000)
        console.warn(`[CRM_STATS] Seed just started for tenant ${tenantId}, elapsed: ${elapsedSeconds} seconds. Blocking request briefly.`)
        return NextResponse.json(
          {
            error: 'Database seeding in progress',
            message: `A data seeding operation just started. Please wait a few seconds and refresh the page.`,
            seedRunning: true,
            elapsedSeconds,
            retryAfter: 5,
          },
          {
            status: 503,
            headers: {
              'Retry-After': '5',
              'Cache-Control': 'no-store',
            },
          }
        )
      } else if (seedStatus.running) {
        // Seed is running but > 5 seconds old - log warning but allow request through
        // This prevents blocking requests unnecessarily in serverless where status may not persist
        const elapsedSeconds = Math.floor((seedStatus.elapsed || 0) / 1000)
        console.log(`[CRM_STATS] Seed is running for tenant ${tenantId}, elapsed: ${elapsedSeconds} seconds. Allowing request through (lenient mode).`)
      }
    } catch (importError) {
      // If we can't import the function, continue normally
      console.warn('[CRM_STATS] Could not check seed status:', importError)
    }
    
    // Log concurrent requests (for debugging, but don't block in serverless)
    const activeCount = activeRequests.get(tenantId) || 0
    if (activeCount > 0) {
      console.log(`[CRM_STATS] Tenant ${tenantId} has ${activeCount} tracked active requests (serverless - may not be accurate)`)
    }
    
    // Increment active request count (for logging only)
    activeRequests.set(tenantId, activeCount + 1)
    
    try {
      // Skip extra tenant round-trip for fast paths (first paint + charts-only); real queries still validate access.
      const skipTenantWarmup = liteMode || chartsOnly
      // Verify tenantId exists in database and test connection
      // Note: During seeding, tenant might not exist yet, so we'll proceed anyway
      try {
        if (!skipTenantWarmup) {
          const tenantExists = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
          })

          if (!tenantExists) {
            console.warn('[CRM_DASHBOARD] Tenant not found in database, but proceeding (may be seeding):', tenantId)
          } else if (statsVerbose) {
            console.log('[CRM_DASHBOARD] Tenant verified:', tenantExists.name)
          }
        }
      } catch (tenantCheckError: any) {
        console.error('[CRM_DASHBOARD] Error checking tenant:', tenantCheckError)
        
        // Check if it's a database connection error
        const errorMessage = tenantCheckError?.message || String(tenantCheckError || '')
        const isConnectionError = tenantCheckError?.code?.startsWith('P1') ||
                                 errorMessage.toLowerCase().includes('can\'t reach') ||
                                 errorMessage.toLowerCase().includes('connect') ||
                                 errorMessage.toLowerCase().includes('enotfound') ||
                                 errorMessage.toLowerCase().includes('econnrefused')
        
        if (isConnectionError) {
          console.error('[CRM_DASHBOARD] Database connection failed during tenant check')
          const isVercel = process.env.VERCEL === '1'
          const hasDatabaseUrl = !!process.env.DATABASE_URL
          
          return NextResponse.json(
            { 
              error: 'Database connection failed',
              message: isVercel
                ? 'Unable to connect to database. Please check your DATABASE_URL configuration in Vercel. If using Supabase, check if your project is paused.'
                : hasDatabaseUrl
                  ? 'Unable to connect to database. Please check your DATABASE_URL in .env.local file. Verify your connection string and ensure Supabase project is active.'
                  : 'DATABASE_URL is not set. Please add DATABASE_URL to your .env.local file.',
              code: tenantCheckError?.code,
              environment: isVercel ? 'vercel' : 'localhost',
              hasDatabaseUrl,
              troubleshooting: {
                steps: isVercel ? [
                  '1. Check if DATABASE_URL is set in Vercel environment variables',
                  '2. If using Supabase, check if your project is paused: https://supabase.com/dashboard',
                  '3. Resume the Supabase project if paused (free tier pauses after inactivity)',
                  '4. Wait 1-2 minutes after resuming for the database to activate',
                  '5. Verify the database connection string is correct',
                ] : [
                  '1. Check if DATABASE_URL exists in .env.local file',
                  '2. Verify DATABASE_URL format: postgresql://user:password@host:port/database',
                  '3. If using Supabase, get connection string from: Project Settings → Database → Connection String',
                  '4. Ensure Supabase project is active (not paused)',
                  '5. Restart your development server after updating .env.local',
                  '6. Check console logs for detailed error messages',
                ],
                healthCheck: '/api/health/db',
              },
            },
            { status: 503 }
          )
        }
        
        // Continue anyway for other errors
      }
      
    const userFilter = await getUserFilter(tenantId, user?.userId)
    if (statsVerbose) {
      console.log('[CRM_DASHBOARD] User filter:', JSON.stringify(userFilter))
      console.log('[CRM_DASHBOARD] User:', user ? { userId: user.userId, email: user.email } : 'No user')
    }

    // Get current date for calculations
    const now = new Date()
    const periodBounds = getTimePeriodBounds(timePeriod)
    const periodStart = periodBounds.start
    const periodEnd = periodBounds.end

    // Build filter for deals/contacts (assignedToId references SalesRep.id)
    let salesRepId: string | undefined
    if (userFilter.assignedToId && user?.userId) {
      const salesRep = await prismaWithRetry(() =>
        prisma.salesRep.findUnique({
          where: { userId: user.userId },
          select: { id: true },
        })
      )
      salesRepId = salesRep?.id || undefined
    }

    let dealFilter: any = { tenantId }
    if (userFilter.assignedToId && user?.userId) {
      dealFilter.assignedToId = salesRepId || 'nonexistent-id'
    }
    
    let contactFilter: any = { tenantId }
    if (userFilter.assignedToId && user?.userId) {
      contactFilter.assignedToId = salesRepId || 'nonexistent-id'
    }

    // Lite: parallel reads for minimum time-to-first-byte (charts use chartsOnly to avoid duplicating this work).
    if (liteMode) {
      const [
        dealsCreatedInPeriod,
        dealsClosingInPeriod,
        overdueTasks,
        totalTasks,
        completedTasks,
        totalMeetings,
        totalLeads,
        convertedLeads,
        contactsCreatedInPeriod,
        revenueAgg,
        activeDealsCount,
        atRiskContacts,
      ] = await Promise.all([
        prisma.deal
          .count({
            where: { ...dealFilter, createdAt: { gte: periodStart, lte: periodEnd } },
          })
          .catch(() => 0),
        prisma.deal
          .count({
            where: {
              ...dealFilter,
              expectedCloseDate: { gte: periodStart, lte: periodEnd },
              stage: { not: 'lost' },
            },
          })
          .catch(() => 0),
        prisma.task
          .count({
            where: {
              ...userFilter,
              dueDate: { lt: now },
              status: { in: ['pending', 'in_progress'] },
            },
          })
          .catch(() => 0),
        prisma.task.count({ where: userFilter }).catch(() => 0),
        prisma.task
          .count({
            where: { ...userFilter, status: 'completed' },
          })
          .catch(() => 0),
        prisma.meeting.count({ where: { tenantId } }).catch(() => 0),
        prisma.contact
          .count({
            where: { ...contactFilter, stage: { in: ['prospect', 'contact'] } },
          })
          .catch(() => 0),
        prisma.contact
          .count({
            where: { ...contactFilter, stage: 'customer' },
          })
          .catch(() => 0),
        prisma.contact
          .count({
            where: { ...contactFilter, createdAt: { gte: periodStart, lte: periodEnd } },
          })
          .catch(() => 0),
        prisma.deal
          .aggregate({
            where: {
              ...dealFilter,
              stage: 'won',
              actualCloseDate: { gte: periodStart, lte: periodEnd },
            },
            _sum: { value: true },
          })
          .catch(() => ({ _sum: { value: 0 } })),
        prisma.deal
          .count({
            where: { ...dealFilter, stage: { not: 'lost' } },
          })
          .catch(() => 0),
        prisma.contact
          .count({
            where: { ...contactFilter, churnRisk: true },
          })
          .catch(() => 0),
      ])

      const tl = Number(totalLeads) || 0
      const cl = Number(convertedLeads) || 0
      const liteStats = {
        dealsCreatedThisMonth: dealsCreatedInPeriod,
        revenueThisMonth: Number((revenueAgg as { _sum?: { value?: unknown } })?._sum?.value || 0),
        dealsClosingThisMonth: dealsClosingInPeriod,
        overdueTasks: overdueTasks || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        totalMeetings: totalMeetings || 0,
        totalLeads: tl,
        convertedLeads: cl,
        contactsCreatedThisMonth: contactsCreatedInPeriod || 0,
        activeCustomers: cl,
        conversionRate: tl > 0 ? (cl / tl) * 100 : 0,
        atRiskContacts: Number(atRiskContacts) || 0,
        quarterlyPerformance: [],
        pipelineByStage: [{ stage: 'Active', count: Number(activeDealsCount || 0), value: 0 }],
        monthlyLeadCreation: [],
        topLeadSources: [],
        periodLabel: periodBounds.label,
      }

      const durationMs = Date.now() - startTime
      console.log(`[CRM_STATS] tenant=${tenantId} period=${timePeriod} mode=lite duration=${durationMs}ms`)
      return NextResponse.json(liteStats, {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
          Vary: 'Authorization',
          'Server-Timing': `app;dur=${durationMs}`,
        },
      })
    }

    // Full dashboard: fiscal quarters for charts (skipped in lite)
    const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const quarters = [
      { quarter: 1, year: currentYear, label: 'Q1', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
      { quarter: 2, year: currentYear, label: 'Q2', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
      { quarter: 3, year: currentYear, label: 'Q3', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) },
      { quarter: 4, year: currentYear, label: 'Q4', start: new Date(currentYear + 1, 0, 1), end: new Date(currentYear + 1, 2, 31) },
    ]

    let dealsCreatedInPeriod = 0
    let dealsClosingInPeriod = 0
    let overdueTasks = 0
    let totalTasks = 0
    let completedTasks = 0
    let totalMeetings = 0
    let totalLeads = 0
    let convertedLeads = 0
    let contactsCreatedInPeriod = 0
    let atRiskContacts = 0

    if (!chartsOnly) {
      const userRole = user?.userId
        ? (await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true } }))?.role
        : 'none'
      console.log('[CRM_DASHBOARD] Filters:', {
        userFilter: JSON.stringify(userFilter),
        dealFilter: JSON.stringify(dealFilter),
        contactFilter: JSON.stringify(contactFilter),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        userRole,
      })

      const [
        safeDealsCreatedInPeriod,
        safeDealsClosingInPeriod,
        safeOverdueTasks,
        safeTotalTasks,
        safeCompletedTasks,
        safeTotalMeetings,
        safeTotalLeads,
        safeConvertedLeads,
        safeContactsCreatedInPeriod,
        safeAtRiskContacts,
      ] = await Promise.all([
        prisma.deal
          .count({
            where: {
              ...dealFilter,
              createdAt: { gte: periodStart, lte: periodEnd },
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 1 failed:', error?.message, error?.code)
            return 0
          }),
        prisma.deal
          .count({
            where: {
              ...dealFilter,
              expectedCloseDate: { gte: periodStart, lte: periodEnd },
              stage: { not: 'lost' },
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 2 failed:', error?.message, error?.code)
            return 0
          }),
        prisma.task
          .count({
            where: {
              ...userFilter,
              dueDate: { lt: now },
              status: { in: ['pending', 'in_progress'] },
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 3 failed:', error?.message, error?.code)
            return 0
          }),
        prisma.task.count({ where: userFilter }).catch((error: any) => {
          console.error('[CRM_DASHBOARD] Query 4 failed:', error?.message)
          return 0
        }),
        prisma.task
          .count({
            where: {
              ...userFilter,
              status: 'completed',
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 5 failed:', error?.message)
            return 0
          }),
        prisma.meeting.count({ where: { tenantId } }).catch((error: any) => {
          console.error('[CRM_DASHBOARD] Query 6 failed:', error?.message)
          return 0
        }),
        prisma.contact
          .count({
            where: {
              ...contactFilter,
              stage: { in: ['prospect', 'contact'] },
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 7 failed:', error?.message, error?.code)
            return 0
          }),
        prisma.contact
          .count({
            where: {
              ...contactFilter,
              stage: 'customer',
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 8 failed:', error?.message)
            return 0
          }),
        prisma.contact
          .count({
            where: {
              ...contactFilter,
              createdAt: { gte: periodStart, lte: periodEnd },
            },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query 8b failed:', error?.message)
            return 0
          }),
        prisma.contact
          .count({
            where: { ...contactFilter, churnRisk: true },
          })
          .catch((error: any) => {
            console.error('[CRM_DASHBOARD] Query at-risk contacts failed:', error?.message)
            return 0
          }),
      ])

      dealsCreatedInPeriod = safeDealsCreatedInPeriod
      dealsClosingInPeriod = safeDealsClosingInPeriod
      overdueTasks = safeOverdueTasks
      totalTasks = safeTotalTasks
      completedTasks = safeCompletedTasks
      totalMeetings = safeTotalMeetings
      totalLeads = safeTotalLeads
      convertedLeads = safeConvertedLeads
      contactsCreatedInPeriod = safeContactsCreatedInPeriod
      atRiskContacts = safeAtRiskContacts
    } else {
      console.log('[CRM_STATS] chartsOnly=1 — skipping core KPI queries (merged from lite on client)')
      try {
        atRiskContacts = await prisma.contact.count({
          where: { ...contactFilter, churnRisk: true },
        })
      } catch (error: any) {
        console.error('[CRM_DASHBOARD] Query at-risk contacts (chartsOnly) failed:', error?.message)
      }
    }

    let topLeadSourcesRaw: any[] = []
    let pipelineByStageData: any[] = []
    let wonDealsForQuarters: any[] = []

    if (!liteMode) {
      try {
        const [ls, gb, won] = await Promise.all([
          prisma.leadSource
            .findMany({
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
            })
            .catch((error: any) => {
              console.error('[CRM_DASHBOARD] Lead source query failed:', error?.message, error?.code)
              return [] as any[]
            }),
          prisma.deal
            .groupBy({
              by: ['stage'],
              where: dealFilter,
              _count: { id: true },
              _sum: { value: true },
            })
            .catch((error: any) => {
              console.error('[CRM_DASHBOARD] Query 9 failed:', error?.message)
              return [] as any[]
            }),
          prisma.deal
            .findMany({
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
            .catch((error: any) => {
              console.error('[CRM_DASHBOARD] Query 11 failed:', error?.message)
              return [] as any[]
            }),
        ])
        topLeadSourcesRaw = ls
        pipelineByStageData = gb as any
        wonDealsForQuarters = won
        if (statsVerbose) {
          console.log('[CRM_DASHBOARD] Query 9 result:', pipelineByStageData.length, 'stages')
          console.log('[CRM_DASHBOARD] Query 11 result:', wonDealsForQuarters.length, 'won deals')
        }
      } catch (error: any) {
        console.error('[CRM_DASHBOARD] Chart-phase parallel queries failed:', error?.message)
      }
    }
    
    // Ensure topLeadSources is always an array
    let topLeadSources: any[] = []
    try {
      if (Array.isArray(topLeadSourcesRaw)) {
        topLeadSources = topLeadSourcesRaw
        if (statsVerbose) {
          console.log('[CRM_STATS] Fetched lead sources:', {
            count: topLeadSources.length,
            sources: topLeadSources.map((s) => ({ name: s?.name, leadsCount: s?.leadsCount })),
          })
        }
      } else if (statsVerbose) {
        console.warn('[CRM_STATS] topLeadSourcesRaw is not an array:', typeof topLeadSourcesRaw, topLeadSourcesRaw)
      }
    } catch (err) {
      console.error('[CRM_STATS] Error processing top lead sources:', err)
      topLeadSources = []
    }
    
    const monthRanges = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    })

    const quarterRangeStart = quarters[0].start
    const quarterRangeEnd = quarters[3].end
    const oldestMonthStart = monthRanges[11].start
    const newestMonthEnd = monthRanges[0].end
    const aggregateRangeStart = new Date(Math.min(quarterRangeStart.getTime(), oldestMonthStart.getTime()))
    const aggregateRangeEnd = new Date(Math.max(quarterRangeEnd.getTime(), newestMonthEnd.getTime()))

    const [dealCreatedRows, contactCreatedRows] = await Promise.all([
      prisma.deal
        .findMany({
          where: {
            ...dealFilter,
            createdAt: { gte: aggregateRangeStart, lte: aggregateRangeEnd },
          },
          select: { createdAt: true },
        })
        .catch((error: any) => {
          console.error('[CRM_DASHBOARD] Deal created-at aggregation query failed:', error?.message)
          return [] as Array<{ createdAt: Date }>
        }),
      prisma.contact
        .findMany({
          where: {
            ...contactFilter,
            createdAt: { gte: aggregateRangeStart, lte: aggregateRangeEnd },
          },
          select: { createdAt: true },
        })
        .catch((error: any) => {
          console.error('[CRM_DASHBOARD] Contact created-at aggregation query failed:', error?.message)
          return [] as Array<{ createdAt: Date }>
        }),
    ])

    const isWithinRange = (date: Date, start: Date, end: Date) =>
      date.getTime() >= start.getTime() && date.getTime() <= end.getTime()

    const quarterDealCounts = [0, 0, 0, 0]
    const quarterLeadCounts = [0, 0, 0, 0]
    const monthlyCounts = Array.from({ length: 12 }, () => 0)

    dealCreatedRows.forEach((row) => {
      const createdAt = row?.createdAt instanceof Date ? row.createdAt : new Date(row?.createdAt)
      if (Number.isNaN(createdAt.getTime())) {
        return
      }
      for (let i = 0; i < quarters.length; i++) {
        if (isWithinRange(createdAt, quarters[i].start, quarters[i].end)) {
          quarterDealCounts[i] += 1
          break
        }
      }
    })

    contactCreatedRows.forEach((row) => {
      const createdAt = row?.createdAt instanceof Date ? row.createdAt : new Date(row?.createdAt)
      if (Number.isNaN(createdAt.getTime())) {
        return
      }
      for (let i = 0; i < quarters.length; i++) {
        if (isWithinRange(createdAt, quarters[i].start, quarters[i].end)) {
          quarterLeadCounts[i] += 1
          break
        }
      }
      for (let i = 0; i < monthRanges.length; i++) {
        if (isWithinRange(createdAt, monthRanges[i].start, monthRanges[i].end)) {
          monthlyCounts[i] += 1
          break
        }
      }
    })

    const [q1DealsCreated, q2DealsCreated, q3DealsCreated, q4DealsCreated] = quarterDealCounts
    const [q1LeadsCreated, q2LeadsCreated, q3LeadsCreated, q4LeadsCreated] = quarterLeadCounts

    if (statsVerbose) {
      console.log('[CRM_DASHBOARD] Aggregated created-at series:', {
        dealRows: dealCreatedRows.length,
        contactRows: contactCreatedRows.length,
        quarterDealCounts,
        quarterLeadCounts,
        monthlyPoints: monthlyCounts.length,
      })
    }

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
    const filterWonDealsByQuarter = (wonDeals: any[], quarter: { start: Date; end: Date; label?: string }) => {
      if (!quarter || !quarter.start || !quarter.end) {
        return []
      }
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

    const hasRealData = chartsOnly
      ? (Array.isArray(pipelineByStage) && pipelineByStage.length > 0) ||
        (Array.isArray(quarterlyPerformance) &&
          quarterlyPerformance.some((q) => q.leadsCreated > 0 || q.dealsCreated > 0))
      : dealsCreatedInPeriod > 0 ||
        revenueInPeriod > 0 ||
        dealsClosingInPeriod > 0 ||
        (Array.isArray(pipelineByStage) && pipelineByStage.length > 0) ||
        (Array.isArray(quarterlyPerformance) &&
          quarterlyPerformance.some((q) => q.leadsCreated > 0 || q.dealsCreated > 0))
    
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
      contactsCreatedThisMonth: contactsCreatedInPeriod || 0,
      activeCustomers: convertedLeads || 0,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      atRiskContacts: atRiskContacts || 0,
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
          if (statsVerbose) {
            console.log('[CRM_STATS] Processing topLeadSources:', {
              isArray: Array.isArray(topLeadSources),
              length: topLeadSources?.length || 0,
              tenantId,
              sample: topLeadSources?.slice(0, 3).map((s: any) => ({
                name: s?.name,
                leadsCount: s?.leadsCount,
              })),
            })
          }

          if (Array.isArray(topLeadSources) && topLeadSources.length > 0) {
            const withLeads = topLeadSources.filter((source: any) => source && (source.leadsCount || 0) > 0)
            const withoutLeads = topLeadSources.filter((source: any) => source && (source.leadsCount || 0) === 0)

            if (statsVerbose) {
              console.log('[CRM_STATS] Filtered lead sources:', {
                withLeads: withLeads.length,
                withoutLeads: withoutLeads.length,
              })
            }

            const allSources = [...withLeads, ...withoutLeads].slice(0, 10)

            if (statsVerbose) {
              console.log('[CRM_STATS] Final lead sources count:', allSources.length)
            }

            if (allSources.length > 0) {
              const result = allSources.map((source: any) => ({
                name: String(source?.name || 'Unknown'),
                leadsCount: Number(source?.leadsCount || 0),
                conversionsCount: Number(source?.conversionsCount || 0),
                totalValue: Number(source?.totalValue || 0),
                conversionRate: Number(source?.conversionRate || 0),
              }))
              if (statsVerbose) {
                console.log('[CRM_STATS] Returning lead sources:', result.length, 'sources')
              }
              return result
            }
          } else if (statsVerbose) {
            console.warn('[CRM_STATS] topLeadSources is empty or not an array:', {
              isArray: Array.isArray(topLeadSources),
              length: topLeadSources?.length,
              type: typeof topLeadSources,
            })
          }
          return []
        } catch (err) {
          console.error('[CRM_STATS] Error processing topLeadSources:', err)
          return []
        }
      })(),
      periodLabel: periodBounds.label,
    }

    if (statsVerbose) {
      console.log('[CRM_DASHBOARD] Query results:', {
        dealsCreatedInPeriod,
        totalLeads,
        convertedLeads,
        contactsCreatedInPeriod,
        totalTasks,
        completedTasks,
        overdueTasks,
        revenueThisMonth: revenueInPeriod,
        tenantId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        hasRealData,
        topLeadSourcesCount: topLeadSources?.length || 0,
        dealFilterUsed: JSON.stringify(dealFilter),
        contactFilterUsed: JSON.stringify(contactFilter),
        userFilterUsed: JSON.stringify(userFilter),
      })
    }

    const durationMs = Date.now() - startTime
    console.log(
      `[CRM_STATS] tenant=${tenantId} period=${timePeriod} chartsOnly=${chartsOnly} duration=${durationMs}ms`
    )

    if (chartsOnly) {
      return NextResponse.json(
        {
          chartsOnly: true,
          quarterlyPerformance: stats.quarterlyPerformance,
          pipelineByStage: stats.pipelineByStage,
          monthlyLeadCreation: stats.monthlyLeadCreation,
          topLeadSources: stats.topLeadSources,
          periodLabel: stats.periodLabel,
          atRiskContacts: stats.atRiskContacts,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            Vary: 'Authorization',
            'Server-Timing': `app;dur=${durationMs}`,
          },
        }
      )
    }

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
    
    // Log detailed error information for debugging
    console.error('[CRM_STATS] Error details:', {
      message: errorMessage,
      code: errorCode,
      name: error?.name,
      isPoolExhausted,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    })
    
    if (isPoolExhausted) {
      const isVercel = process.env.VERCEL === '1'
      console.warn('[CRM_STATS] Database connection pool exhausted')
      console.warn('[CRM_STATS] This suggests DATABASE_URL may still be using port 5432 (session mode)')
      
      const troubleshootingSteps = isVercel ? [
        '1. Go to Vercel Dashboard → Project Settings → Environment Variables',
        '2. Find DATABASE_URL',
        '3. Change port from 5432 to 6543',
        '4. Redeploy the application',
      ] : [
        '1. Check your .env.local file',
        '2. Ensure DATABASE_URL uses port 6543 (transaction mode)',
        '3. Format: postgresql://user:password@host:6543/database?pgbouncer=true',
        '4. Restart your development server after updating',
        '5. If using Supabase, get connection string from Project Settings → Database',
      ]
      
      return NextResponse.json(
        { 
          error: 'Database connection pool exhausted',
          message: isVercel
            ? 'Too many concurrent database connections. The system is using transaction mode, but you may need to update DATABASE_URL in Vercel to use port 6543.'
            : 'Too many concurrent database connections. Please check your DATABASE_URL in .env.local - ensure it uses port 6543 (transaction mode) instead of 5432 (session mode).',
          retryAfter: 5,
          environment: isVercel ? 'vercel' : 'localhost',
          troubleshooting: {
            issue: 'Connection pool exhausted - likely still using session mode (port 5432)',
            solution: isVercel 
              ? 'Update DATABASE_URL in Vercel environment variables to use port 6543'
              : 'Update DATABASE_URL in .env.local to use port 6543 (transaction mode)',
            steps: troubleshootingSteps,
          },
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5',
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

