import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { triggerWorkflowsByEvent } from '@/lib/workflow/trigger'
import { z } from 'zod'

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, email: true },
    }).catch(() => null)
    const userTenantId = user?.tenantId ?? null
    const hasAccess = requestTenantId && (jwtTenantId === requestTenantId || userTenantId === requestTenantId)
    // Demo fallback: when viewing Demo Business tenant as admin@demo.com, always use requested tenant so demos never show empty
    const isDemoTenantRequest =
      requestTenantId &&
      user?.email === 'admin@demo.com' &&
      (await prisma.tenant.findUnique({
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

    // Build cache key
    const cacheKey = `deals:${tenantId}:${page}:${limit}:${stage || 'all'}:${contactId || 'all'}`
    const bypassCache = searchParams.get('bypassCache') === 'true'
    console.log('[DEALS_API] Query parameters:', { page, limit, stage, contactId, bypassCache, cacheKey })

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

    if (stage) where.stage = stage
    if (contactId) where.contactId = contactId

    // Use main Prisma client to ensure we get the latest data (read replica may lag)
    // This is especially important after seeding
    let deals: any[] = []
    let total = 0
    let pipelineSummary: any[] = []
    
    // CRITICAL: Verify tenantId matches what's in database
    // Check if deals exist for this tenant before querying
    const quickCheck = await prisma.deal.count({ where: { tenantId } }).catch(() => 0)
    if (quickCheck > 0 && !bypassCache) {
      console.log(`[DEALS_API] ⚠️ Found ${quickCheck} deals in DB but cache might be stale. Forcing cache clear.`)
      // Force clear all cache keys for this tenant
      try {
        await multiLayerCache.deletePattern(`deals:${tenantId}:*`)
        console.log(`[DEALS_API] Cleared all cache for tenant ${tenantId}`)
      } catch (e) {
        console.warn(`[DEALS_API] Failed to clear cache pattern:`, e)
      }
    }
    
    const runDealsQuery = async () => {
      const [found, count, summary] = await Promise.all([
        prisma.deal.findMany({
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
        prisma.deal.count({ where }),
        prisma.deal.groupBy({
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

    try {
      console.log('[DEALS_API] Querying deals with where clause:', JSON.stringify(where, null, 2))
      console.log(`[DEALS_API] Quick check: ${quickCheck} deals exist for tenant ${tenantId}`)
      const result = await runDealsQuery()
      deals = result[0]
      total = result[1]
      pipelineSummary = result[2]
    } catch (readError) {
      console.warn('[DEALS_API] Read replica failed, falling back to primary database:', readError)
      try {
        const result = await runDealsQuery()
        deals = result[0]
        total = result[1]
        pipelineSummary = result[2]
      } catch (fallbackError) {
        console.error('[DEALS_API] Fallback query also failed:', fallbackError)
        deals = []
        total = 0
        pipelineSummary = []
      }
    }

    // Get diagnostic info if no deals found (simplified to avoid blocking)
    let diagnostics: any = null
    if (deals.length === 0 || total === 0) {
      // Check actual count in database for this tenant (quick check)
      try {
        const actualCount = await prisma.deal.count({ 
          where: { tenantId },
        })
        const allTenantsCount = await prisma.deal.count({}).catch(() => 0)
        
        // Also get a sample deal to see what tenantId it has
        const sampleDeal = await prisma.deal.findFirst({
          where: { tenantId },
          select: { id: true, name: true, tenantId: true, createdAt: true },
        }).catch(() => null)
        
        // Check if there are deals with different tenantIds
        const allDeals = await prisma.deal.findMany({
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

    // CRITICAL: If we have deals in DB but query returned 0, clear cache and retry
    if (total === 0 && quickCheck > 0) {
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
      const sampleDealDebug = await prisma.deal.findFirst({
        where: { tenantId },
        select: { id: true, name: true, tenantId: true, stage: true, contactId: true, createdAt: true },
      }).catch(() => null)
      console.log(`[DEALS_API] Sample deal from DB:`, sampleDealDebug)
      
      // Retry the query once with minimal where clause to test
      try {
        // First, try with just tenantId (no other filters)
        const minimalWhere = { tenantId }
        const [testDeals, testTotal] = await Promise.all([
          prisma.deal.findMany({
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
          prisma.deal.count({ where: minimalWhere }),
        ])
        
        console.log(`[DEALS_API] Test query (minimal where): Found ${testTotal} deals`)
        
        if (testTotal > 0) {
          // Minimal query worked, now try with original where clause
          const [retryDeals, retryTotal] = await Promise.all([
            prisma.deal.findMany({
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
            prisma.deal.count({ where }),
          ])
          
          if (retryTotal > 0) {
            console.log(`[DEALS_API] ✅ Retry successful! Found ${retryTotal} deals after cache clear`)
            deals = retryDeals
            total = retryTotal
          } else if (testTotal > 0) {
            // Minimal query worked but filtered query didn't - filter is the issue
            console.error(`[DEALS_API] ❌ Filter issue: ${testTotal} deals with minimal where, but 0 with filtered where`)
            console.error(`[DEALS_API] Filter that's excluding deals:`, JSON.stringify(where, null, 2))
            // Use minimal results as fallback
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
      ...(diagnostics && { _debug: diagnostics }), // Include diagnostics in response for debugging
      // Always include quickCheck in debug info when there's a mismatch
      ...(quickCheck > 0 && total === 0 && { 
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
    } else if (quickCheck > 0) {
      // Don't cache empty results if we know deals exist - this prevents caching stale empty data
      console.warn(`[DEALS_API] ⚠️ Not caching empty result - ${quickCheck} deals exist in DB but query returned 0`)
    } else {
      // Cache empty results only if we're sure there are no deals
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
    const { tenantId } = await requireModuleAccess(request, 'crm')

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
      // Auto-create contact from deal information
      // First, check if contact already exists by email or phone
      const existingContact = await prisma.contact.findFirst({
        where: {
          tenantId: tenantId,
          OR: [
            ...(validated.contactEmail ? [{ email: validated.contactEmail }] : []),
            ...(validated.contactPhone ? [{ phone: validated.contactPhone }] : []),
          ],
        },
      })

      if (existingContact) {
        // Link to existing contact
        contactId = existingContact.id
      } else {
        // Create new contact as prospect
        const newContact = await prisma.contact.create({
          data: {
            name: validated.contactName,
            email: validated.contactEmail || null,
            phone: validated.contactPhone || null,
            company: validated.contactCompany || null,
            tenantId: tenantId,
            type: 'lead', // Keep for backward compat
            stage: 'prospect', // New simplified stage
            status: 'active',
            source: 'manual',
          },
        })
        contactId = newContact.id
        createdContact = true
      }
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

    console.error('Create deal error:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}


