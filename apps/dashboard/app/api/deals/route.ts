import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { triggerWorkflowsByEvent } from '@/lib/workflow/trigger'
import { getTimePeriodBounds, type TimePeriod } from '@/lib/utils/crm-filters'
import { z } from 'zod'
import { dbOverloadResponse, isTransientDbOverloadError } from '@/lib/api/db-overload'
import { processInboundLead } from '@/lib/crm/inbound-orchestration'

function isValidTimePeriod(t: string | null): t is TimePeriod {
  return t === 'month' || t === 'quarter' || t === 'financial-year' || t === 'year'
}

const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  value: z.number().positive('Deal value must be greater than 0'),
  probability: z.number().min(0).max(100).default(50),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('lead'),
  // Contact can be provided by ID or by name/email/phone (for auto-creation)
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactCompany: z.string().optional(),
  expectedCloseDate: z.preprocess(
    (val) => {
      // Transform empty string, null, or undefined to undefined
      if (!val || val === null || val === undefined) {
        return undefined
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined
      }
      // If it's already a datetime string, return as is
      if (typeof val === 'string' && (val.includes('T') || val.includes('Z'))) {
        return val
      }
      // If it's a date string (YYYY-MM-DD), convert to ISO datetime
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const date = new Date(val + 'T00:00:00.000Z')
        if (isNaN(date.getTime())) {
          return undefined // Invalid date
        }
        return date.toISOString()
      }
      return undefined // Invalid format, treat as optional
    },
    z.string().datetime().optional().or(z.undefined())
  ).optional(),
}).refine(
  (data) => {
    // Either contactId must be provided, OR contactName must be provided
    return !!(data.contactId || data.contactName)
  },
  {
    message: 'Either select an existing contact or provide contact name to create a new one',
    path: ['contactId'],
  }
)

// GET /api/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const requestTenantId = searchParams.get('tenantId') || undefined

    // Prefer the tenant from the URL (page context) so /crm/[tenantId]/Deals always shows that tenant's deals.
    let tenantId = jwtTenantId
    const user = await prismaRead.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, email: true },
    }).catch(() => null)
    const userTenantId = user?.tenantId ?? null
    const hasAccess = requestTenantId && (jwtTenantId === requestTenantId || userTenantId === requestTenantId)
    // Demo fallback: when viewing Demo Business tenant as admin@demo.com, always use requested tenant so demos never show empty
    const allowDemoTenantOverride = process.env.NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED === '1'
    const isDemoTenantRequest =
      allowDemoTenantOverride &&
      requestTenantId &&
      user?.email === 'admin@demo.com' &&
      (await prismaRead.tenant.findUnique({
        where: { id: requestTenantId },
        select: { name: true },
      }).then((t) => t?.name?.toLowerCase().includes('demo') ?? false).catch(() => false))
    if (requestTenantId && (hasAccess || isDemoTenantRequest)) {
      tenantId = requestTenantId
      if (jwtTenantId !== requestTenantId) {
        console.log('[DEALS_API] Using requested tenantId:', tenantId, isDemoTenantRequest ? '(demo fallback)' : '(user has access)')
      }
    }
    console.log('[DEALS_API] Request received for tenantId:', tenantId, 'jwtTenantId:', jwtTenantId, 'requestTenantId:', requestTenantId, 'userTenantId:', userTenantId)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const stage = searchParams.get('stage')
    const contactId = searchParams.get('contactId')
    const contactIdsParam = searchParams.get('contactIds')
    const accountIdParam = searchParams.get('accountId')
    const timePeriodParam = searchParams.get('timePeriod') as TimePeriod | null
    const periodCategoryParam = searchParams.get('periodCategory')
    const periodBounds =
      timePeriodParam && isValidTimePeriod(timePeriodParam) ? getTimePeriodBounds(timePeriodParam) : null
    // stats=false: list + pagination only (skip tenant-wide stage groupBy and period aggregates). CRM UI defaults to full stats.
    const wantStats = searchParams.get('stats') !== 'false'
    const periodCategoryActive =
      periodCategoryParam &&
      ['created', 'closing', 'won', 'lost'].includes(periodCategoryParam)
        ? periodCategoryParam
        : null
    const periodCatKey = periodCategoryActive || 'all'
    const timeKey = timePeriodParam && isValidTimePeriod(timePeriodParam) ? timePeriodParam : 'none'

    // Build cache key (include period context so list + KPIs stay consistent when cached)
    const contactIdsKey = contactIdsParam ? contactIdsParam.slice(0, 120) : 'none'
    const accountKey = accountIdParam || 'none'
    const cacheKey = `deals:${tenantId}:${page}:${limit}:${stage || 'all'}:${contactId || 'all'}:cids:${contactIdsKey}:acc:${accountKey}:${timeKey}:${periodCatKey}:stats:${wantStats ? '1' : '0'}`
    const bypassCache = searchParams.get('bypassCache') === 'true'
    console.log('[DEALS_API] Query parameters:', {
      page,
      limit,
      stage,
      contactId,
      contactIds: contactIdsParam,
      accountId: accountIdParam,
      bypassCache,
      cacheKey,
    })

    // Check cache (multi-layer: L1 memory -> L2 Redis) unless bypassed
    if (!bypassCache) {
      const cached = await multiLayerCache.get(cacheKey)
      if (cached && typeof cached === 'object' && 'deals' in cached) {
        console.log('[DEALS_API] Returning cached data:', { 
          dealsCount: (cached as any)?.deals?.length || 0, 
          total: (cached as any)?.pagination?.total || 0,
          cacheKey
        })
        return NextResponse.json(cached)
      }
    } else {
      console.log('[DEALS_API] Cache bypassed, querying database directly')
      // Also clear cache when bypassing to ensure fresh data
      try {
        await multiLayerCache.delete(cacheKey)
        console.log('[DEALS_API] Cleared cache for key:', cacheKey)
      } catch (cacheError) {
        console.warn('[DEALS_API] Failed to clear cache:', cacheError)
      }
    }

    const where: any = {
      tenantId: tenantId,
    }

    const cuidLike = (id: string) => /^c[a-z0-9]{8,}$/i.test(id.trim())
    if (contactIdsParam) {
      const ids = [
        ...new Set(
          contactIdsParam
            .split(',')
            .map((s) => s.trim())
            .filter((id) => cuidLike(id))
        ),
      ].slice(0, 100)
      if (ids.length > 0) {
        where.contactId = { in: ids }
      }
    } else if (accountIdParam && cuidLike(accountIdParam)) {
      where.contact = { is: { accountId: accountIdParam } }
    } else if (contactId && cuidLike(contactId)) {
      where.contactId = contactId
    }

    if (periodCategoryActive && periodBounds) {
      const { start, end } = periodBounds
      switch (periodCategoryActive) {
        case 'created':
          where.createdAt = { gte: start, lte: end }
          break
        case 'closing':
          where.expectedCloseDate = { gte: start, lte: end }
          where.stage = { notIn: ['won', 'lost'] }
          break
        case 'won':
          where.stage = 'won'
          where.OR = [
            { actualCloseDate: { gte: start, lte: end } },
            { AND: [{ actualCloseDate: null }, { updatedAt: { gte: start, lte: end } }] },
          ]
          break
        case 'lost':
          where.stage = 'lost'
          where.OR = [
            { actualCloseDate: { gte: start, lte: end } },
            { AND: [{ actualCloseDate: null }, { updatedAt: { gte: start, lte: end } }] },
          ]
          break
      }
    } else if (stage) {
      where.stage = stage
    }

    // GET reads use prismaRead (replica when DATABASE_READ_URL is set; else primary URL).
    let deals: any[] = []
    let total = 0
    let pipelineSummary: any[] = []
    
    // Count for diagnostics / retry paths only — do NOT clear the whole tenant cache on every GET
    // (that prevented caching, hammered Redis, and slowed CRM Deals/Leads audit navigations).
    const quickCheck = wantStats
      ? await prismaRead.deal.count({ where: { tenantId } }).catch(() => 0)
      : 0

    const runPeriodStats = async (): Promise<{
      periodStats: {
        created: { count: number; value: number }
        closing: { count: number; value: number }
        won: { count: number; value: number }
        lost: { count: number; value: number }
      } | null
      topClosingDeals: any[]
    }> => {
      if (!periodBounds) {
        return { periodStats: null, topClosingDeals: [] }
      }
      const { start, end } = periodBounds
      const base = { tenantId }
      const [createdAgg, closingAgg, wonAgg, lostAgg, topClosing] = await Promise.all([
        prismaRead.deal.aggregate({
          where: { ...base, createdAt: { gte: start, lte: end } },
          _count: { _all: true },
          _sum: { value: true },
        }),
        prismaRead.deal.aggregate({
          where: {
            ...base,
            expectedCloseDate: { gte: start, lte: end },
            stage: { notIn: ['won', 'lost'] },
          },
          _count: { _all: true },
          _sum: { value: true },
        }),
        prismaRead.deal.aggregate({
          where: {
            ...base,
            stage: 'won',
            OR: [
              { actualCloseDate: { gte: start, lte: end } },
              { AND: [{ actualCloseDate: null }, { updatedAt: { gte: start, lte: end } }] },
            ],
          },
          _count: { _all: true },
          _sum: { value: true },
        }),
        prismaRead.deal.aggregate({
          where: {
            ...base,
            stage: 'lost',
            OR: [
              { actualCloseDate: { gte: start, lte: end } },
              { AND: [{ actualCloseDate: null }, { updatedAt: { gte: start, lte: end } }] },
            ],
          },
          _count: { _all: true },
          _sum: { value: true },
        }),
        prismaRead.deal.findMany({
          where: {
            ...base,
            expectedCloseDate: { gte: start, lte: end },
            stage: { notIn: ['won', 'lost'] },
          },
          orderBy: [{ expectedCloseDate: 'asc' }, { value: 'desc' }],
          take: 10,
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            probability: true,
            expectedCloseDate: true,
            actualCloseDate: true,
            createdAt: true,
            updatedAt: true,
            contact: {
              select: { id: true, name: true, email: true, phone: true, company: true },
            },
          },
        }),
      ])
      return {
        periodStats: {
          created: {
            count: createdAgg._count._all,
            value: Number(createdAgg._sum.value ?? 0),
          },
          closing: {
            count: closingAgg._count._all,
            value: Number(closingAgg._sum.value ?? 0),
          },
          won: {
            count: wonAgg._count._all,
            value: Number(wonAgg._sum.value ?? 0),
          },
          lost: {
            count: lostAgg._count._all,
            value: Number(lostAgg._sum.value ?? 0),
          },
        },
        topClosingDeals: topClosing,
      }
    }

    const runDealsQuery = async () => {
      const listSelect = {
        id: true,
        name: true,
        value: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        actualCloseDate: true,
        createdAt: true,
        updatedAt: true,
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
      } as const

      if (!wantStats) {
        const [found, count] = await Promise.all([
          prismaRead.deal.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: listSelect,
          }),
          prismaRead.deal.count({ where }),
        ])
        return [Array.isArray(found) ? found : [], typeof count === 'number' ? count : 0, []] as const
      }

      const [found, count, summary] = await Promise.all([
        prismaRead.deal.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: listSelect,
        }),
        prismaRead.deal.count({ where }),
        prismaRead.deal.groupBy({
          by: ['stage'],
          where: { tenantId: tenantId },
          _sum: {
            value: true,
          },
          _count: {
            id: true,
          },
        }),
      ])
      return [
        Array.isArray(found) ? found : [],
        typeof count === 'number' ? count : 0,
        Array.isArray(summary) ? summary : [],
      ] as const
    }

    let periodStats: {
      created: { count: number; value: number }
      closing: { count: number; value: number }
      won: { count: number; value: number }
      lost: { count: number; value: number }
    } | null = null
    let topClosingDeals: any[] = []

    try {
      console.log('[DEALS_API] Querying deals with where clause:', JSON.stringify(where, null, 2))
      console.log(`[DEALS_API] Quick check: ${quickCheck} deals exist for tenant ${tenantId}`)
      if (!wantStats) {
        const dealResult = await runDealsQuery()
        deals = dealResult[0]
        total = dealResult[1]
        pipelineSummary = dealResult[2]
        periodStats = null
        topClosingDeals = []
      } else {
        const [dealResult, periodResult] = await Promise.all([
          runDealsQuery(),
          runPeriodStats().catch((e) => {
            console.warn('[DEALS_API] Period stats query failed:', e)
            return { periodStats: null, topClosingDeals: [] as any[] }
          }),
        ])
        deals = dealResult[0]
        total = dealResult[1]
        pipelineSummary = dealResult[2]
        periodStats = periodResult.periodStats
        topClosingDeals = periodResult.topClosingDeals
      }
    } catch (readError) {
      console.warn('[DEALS_API] Read replica failed, falling back to primary database:', readError)
      try {
        if (!wantStats) {
          const dealResult = await runDealsQuery()
          deals = dealResult[0]
          total = dealResult[1]
          pipelineSummary = dealResult[2]
          periodStats = null
          topClosingDeals = []
        } else {
          const [dealResult, periodResult] = await Promise.all([
            runDealsQuery(),
            runPeriodStats().catch((e) => {
              console.warn('[DEALS_API] Period stats query failed (fallback):', e)
              return { periodStats: null, topClosingDeals: [] as any[] }
            }),
          ])
          deals = dealResult[0]
          total = dealResult[1]
          pipelineSummary = dealResult[2]
          periodStats = periodResult.periodStats
          topClosingDeals = periodResult.topClosingDeals
        }
      } catch (fallbackError) {
        console.error('[DEALS_API] Fallback query also failed:', fallbackError)
        deals = []
        total = 0
        pipelineSummary = []
        periodStats = null
        topClosingDeals = []
      }
    }

    // Get diagnostic info only for unfiltered tenant-wide queries that return 0.
    // When a contactId (or stage) filter is applied, 0 results is a valid outcome —
    // skip the expensive extra queries and do not log false-positive CRITICAL errors.
    let diagnostics: any = null
    const isFilterScoped = !!(contactId || stage || periodCategoryActive)
    if ((deals.length === 0 || total === 0) && !isFilterScoped) {
      // Check actual count in database for this tenant (quick check)
      try {
        const actualCount = await prismaRead.deal.count({ 
          where: { tenantId },
        })
        const allTenantsCount = await prismaRead.deal.count({}).catch(() => 0)
        
        // Also get a sample deal to see what tenantId it has
        const sampleDeal = await prismaRead.deal.findFirst({
          where: { tenantId },
          select: { id: true, name: true, tenantId: true, createdAt: true },
        }).catch(() => null)
        
        // Check if there are deals with different tenantIds
        const allDeals = await prismaRead.deal.findMany({
          take: 5,
          select: { id: true, tenantId: true, name: true },
        }).catch(() => [])
        
        diagnostics = {
          tenantId,
          total,
          queryWhere: where,
          cacheKey,
          timestamp: new Date().toISOString(),
          actualDealCountForTenant: actualCount,
          totalDealsInDatabase: allTenantsCount,
          bypassCache,
          sampleDeal,
          allDealsSample: allDeals,
        }
        
        console.warn('[DEALS_API] ⚠️ No deals found for tenantId:', tenantId)
        console.warn('[DEALS_API] Diagnostics:', JSON.stringify(diagnostics, null, 2))
        
        if (actualCount > 0 && total === 0) {
          console.error('[DEALS_API] ❌ CRITICAL: Database has deals but query returned 0!')
          console.error(`[DEALS_API] Database shows ${actualCount} deals for tenant ${tenantId}`)
          console.error(`[DEALS_API] Sample deal:`, sampleDeal)
          console.error('[DEALS_API] This suggests a query filter issue, cache problem, or tenantId mismatch')
        } else if (actualCount === 0 && allTenantsCount > 0) {
          console.error(`[DEALS_API] ❌ CRITICAL: Database has ${allTenantsCount} deals total, but 0 for tenant ${tenantId}`)
          console.error(`[DEALS_API] Sample deals in database:`, allDeals)
          console.error('[DEALS_API] This suggests deals were created for a different tenantId!')
        }
      } catch (diagError) {
        console.error('[DEALS_API] Error getting diagnostics:', diagError)
        diagnostics = {
          tenantId,
          total,
          queryWhere: where,
          cacheKey,
          timestamp: new Date().toISOString(),
          diagnosticError: String(diagError),
        }
      }
    }

    // CRITICAL: If we have deals in DB but query returned 0, clear cache and retry.
    // Do NOT use this fallback when the request is for a specific contact (contactId):
    // 0 deals for that contact is correct; we must never return all tenant deals instead.
    const isContactScoped = !!contactId
    if (total === 0 && quickCheck > 0 && !isContactScoped) {
      console.error(`[DEALS_API] ❌ CRITICAL: Database has ${quickCheck} deals but query returned 0!`)
      console.error(`[DEALS_API] Query where clause:`, JSON.stringify(where, null, 2))
      console.error(`[DEALS_API] This is a cache or query issue. Clearing cache and retrying...`)
      
      // Clear all cache for this tenant
      try {
        await multiLayerCache.deletePattern(`deals:${tenantId}:*`)
        console.log(`[DEALS_API] Cleared all cache patterns for tenant ${tenantId}`)
      } catch (e) {
        console.warn(`[DEALS_API] Failed to clear cache:`, e)
      }
      
      // Get a sample deal to debug
      const sampleDealDebug = await prismaRead.deal.findFirst({
        where: { tenantId },
        select: { id: true, name: true, tenantId: true, stage: true, contactId: true, createdAt: true },
      }).catch(() => null)
      console.log(`[DEALS_API] Sample deal from DB:`, sampleDealDebug)
      
      // Retry the query once with minimal where clause to test (tenant-wide only)
      try {
        const minimalWhere = { tenantId }
        const [testDeals, testTotal] = await Promise.all([
          prismaRead.deal.findMany({
            where: minimalWhere,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              value: true,
              stage: true,
              probability: true,
              expectedCloseDate: true,
              actualCloseDate: true,
              createdAt: true,
              updatedAt: true,
              contact: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  company: true,
                },
              },
            },
          }),
          prismaRead.deal.count({ where: minimalWhere }),
        ])
        
        console.log(`[DEALS_API] Test query (minimal where): Found ${testTotal} deals`)
        
        if (testTotal > 0) {
          // Minimal query worked, now try with original where clause
          const [retryDeals, retryTotal] = await Promise.all([
            prismaRead.deal.findMany({
              where,
              skip: (page - 1) * limit,
              take: limit,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                value: true,
                stage: true,
                probability: true,
                expectedCloseDate: true,
                actualCloseDate: true,
                createdAt: true,
                updatedAt: true,
                contact: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    company: true,
                  },
                },
              },
            }),
            prismaRead.deal.count({ where }),
          ])
          
          if (retryTotal > 0) {
            console.log(`[DEALS_API] ✅ Retry successful! Found ${retryTotal} deals after cache clear`)
            deals = retryDeals
            total = retryTotal
          } else if (testTotal > 0) {
            // Minimal query worked but filtered query didn't - filter is the issue (tenant-wide only)
            console.error(`[DEALS_API] ❌ Filter issue: ${testTotal} deals with minimal where, but 0 with filtered where`)
            console.error(`[DEALS_API] Filter that's excluding deals:`, JSON.stringify(where, null, 2))
            deals = testDeals
            total = testTotal
          }
        } else {
          console.error(`[DEALS_API] ❌ Even minimal query returned 0 deals, but quickCheck shows ${quickCheck}`)
        }
      } catch (retryError: any) {
        console.error(`[DEALS_API] Retry failed:`, retryError?.message || retryError)
        console.error(`[DEALS_API] Retry error stack:`, retryError?.stack)
      }
    }

    const result = {
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      pipelineSummary,
      ...(periodStats ? { periodStats, topClosingDeals } : { topClosingDeals }),
      ...(diagnostics && { _debug: diagnostics }), // Include diagnostics in response for debugging
      // Only include mismatch debug info for unfiltered tenant-wide queries
      ...(quickCheck > 0 && total === 0 && !isFilterScoped && { 
        _debug: {
          ...diagnostics,
          quickCheck,
          queryWhere: where,
          retryAttempted: true,
          message: `Database has ${quickCheck} deals but query returned 0. Retry logic should have fixed this.`
        }
      }),
    }

    console.log('[DEALS_API] Returning result:', { 
      dealsCount: deals.length, 
      total, 
      tenantId,
      cacheKey,
      quickCheck,
      sampleDeal: deals[0] ? { id: deals[0].id, name: deals[0].name, tenantId: deals[0].tenantId } : null,
      hasDiagnostics: !!diagnostics
    })

    // Only cache if we have results (don't cache empty results that might be wrong)
    if (total > 0) {
      // Cache for 3 minutes (multi-layer: L1 + L2)
      await multiLayerCache.set(cacheKey, result, 180)
    } else if (quickCheck > 0 && !isFilterScoped) {
      // Don't cache empty results for tenant-wide queries when deals exist in DB
      console.warn(`[DEALS_API] ⚠️ Not caching empty result - ${quickCheck} deals exist in DB but unfiltered query returned 0`)
    } else {
      // Cache empty results: either no deals exist, or this is a valid filtered empty result
      await multiLayerCache.set(cacheKey, result, 180)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[DEALS_API] Get deals error:', error)
    // Return empty result instead of 500 to prevent UI errors
    return NextResponse.json(
      { 
        error: 'Failed to get deals',
        message: error?.message || 'Unknown error',
        deals: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        pipelineSummary: [],
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createDealSchema.parse(body)

    let contactId: string | null = null
    let createdContact = false

    // Handle Contact: either use existing or create new
    if (validated.contactId) {
      // Use existing contact
      const contact = await prisma.contact.findFirst({
        where: {
          id: validated.contactId,
          tenantId: tenantId,
        },
      })

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        )
      }

      contactId = validated.contactId
    } else if (validated.contactName) {
      const inbound = await processInboundLead({
        tenantId,
        actorUserId: userId,
        dedupePolicy: 'merge_existing',
        source: {
          sourceChannel: 'deal_wizard',
          rawMetadata: { dealName: validated.name },
        },
        contact: {
          name: validated.contactName,
          email: validated.contactEmail || null,
          phone: validated.contactPhone || null,
          company: validated.contactCompany || null,
          type: 'lead',
          stage: 'prospect',
          status: 'active',
        },
        legacySourceLabel: 'manual',
      })

      if (!inbound.ok || inbound.error) {
        if (inbound.error?.code === 'CONTACT_LIMIT') {
          return NextResponse.json(
            { error: 'Contact limit reached. Please upgrade your plan.' },
            { status: 403 }
          )
        }
        return NextResponse.json(
          { error: inbound.error?.message || 'Failed to create or update contact for deal' },
          { status: 500 }
        )
      }

      contactId = inbound.contact.id
      createdContact = inbound.created
    }

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        name: validated.name,
        value: validated.value,
        probability: validated.probability,
        stage: validated.stage,
        contactId: contactId,
        // Store contact info in Deal for reference (if created without Contact)
        contactName: validated.contactName || null,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone || null,
        tenantId: tenantId,
        expectedCloseDate: validated.expectedCloseDate
          ? new Date(validated.expectedCloseDate)
          : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            stage: true,
          },
        },
      },
    })

    // Auto-promote Contact to "contact" stage if Deal is created
    if (contactId && createdContact) {
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          stage: 'contact', // Promote to contact when Deal is created
          type: 'contact', // Also update type for backward compat
        },
      })
    }

    // Trigger workflow automation (e.g. assign task, notify)
    triggerWorkflowsByEvent({
      tenantId,
      event: 'deal.created',
      entity: 'deal',
      entityId: deal.id,
      data: {
        deal: {
          id: deal.id,
          name: deal.name,
          value: deal.value,
          stage: deal.stage,
          contactId: deal.contactId,
        },
        contact: deal.contact
          ? {
              id: deal.contact.id,
              name: deal.contact.name,
              email: deal.contact.email,
              stage: deal.contact.stage,
            }
          : undefined,
      },
    })

    return NextResponse.json({
      ...deal,
      createdContact, // Indicate if a new contact was created
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create user-friendly error messages
      const errorMessages = error.errors.map((err) => {
        const field = err.path.join('.')
        switch (err.code) {
          case 'too_small':
            if (field === 'name') return 'Deal name is required'
            if (field === 'value') return 'Deal value must be greater than 0'
            if (field === 'contactId') return 'Please select a contact'
            return `${field} is required`
          case 'invalid_type':
            if (field === 'value') return 'Deal value must be a number'
            if (field === 'probability') return 'Probability must be a number between 0 and 100'
            return `${field} has an invalid format`
          case 'invalid_enum_value':
            return `Invalid ${field}. Please select a valid option.`
          case 'invalid_string':
            if (field === 'expectedCloseDate') return 'Invalid date format'
            return `Invalid ${field} format`
          default:
            return err.message || `Invalid ${field}`
        }
      })

      return NextResponse.json(
        {
          error: 'Validation error',
          message: errorMessages.join('. '),
          details: error.errors,
        },
        { status: 400 }
      )
    }
    if (isTransientDbOverloadError(error)) {
      return dbOverloadResponse('Deal')
    }

    console.error('Create deal error:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}


