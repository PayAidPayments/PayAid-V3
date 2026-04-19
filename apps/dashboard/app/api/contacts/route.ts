import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { processInboundLead } from '@/lib/crm/inbound-orchestration'
import { resolveTenantFromParam } from '@/lib/tenant/resolve-tenant'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { dbOverloadResponse, isTransientDbOverloadError } from '@/lib/api/db-overload'

// Optional email/phone: allow empty string from forms and coerce to undefined for DB
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional().transform((v) => (v === '' ? undefined : v))
const optionalString = z.string().optional().transform((v) => (v === '' ? undefined : v))

const createContactSchema = z.object({
  name: z.string().min(1),
  email: optionalEmail,
  phone: optionalString,
  company: optionalString,
  type: z.enum(['customer', 'lead', 'vendor', 'employee']).default('lead'),
  stage: z.enum(['prospect', 'contact', 'customer']).optional(), // New simplified stage
  status: z.enum(['active', 'inactive', 'lost']).default('active'),
  source: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  country: z.string().default('India'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  internalNotes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
})

const CONTACTS_LIST_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
}

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set before proceeding
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is not set. Please configure it in your environment variables.',
          troubleshooting: [
            'Check if DATABASE_URL is set in Vercel environment variables',
            'Verify the database connection string is correct',
            'If using Supabase, check if your project is paused',
            'Ensure environment variables are set for Production environment',
          ],
        },
        { status: 503 }
      )
    }

    // Check CRM module license and resolve tenant (match deals API: use request tenant when user has access)
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const requestTenantId = searchParams.get('tenantId') || undefined
    let tenantId = jwtTenantId
    if (requestTenantId) {
      const user = await prismaRead.user.findUnique({
        where: { id: userId },
        select: { tenantId: true, email: true },
      }).catch(() => null)
      const userTenantId = user?.tenantId ?? null
      const hasAccess = jwtTenantId === requestTenantId || userTenantId === requestTenantId
      const allowDemoTenantOverride = process.env.NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED === '1'
      const isDemoTenantRequest =
        allowDemoTenantOverride &&
        user?.email === 'admin@demo.com' &&
        (await prismaRead.tenant.findUnique({
          where: { id: requestTenantId },
          select: { name: true },
        }).then((t) => t?.name?.toLowerCase().includes('demo') ?? false).catch(() => false))
      if (hasAccess || isDemoTenantRequest) tenantId = requestTenantId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const stage = searchParams.get('stage') // New: stage filter (prospect, contact, customer)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build cache key (only cache non-search queries)
    const cacheKey = search 
      ? null 
      : `contacts:${tenantId}:${page}:${limit}:${type || 'all'}:${stage || 'all'}:${status || 'all'}`

    // Check cache for non-search queries (multi-layer cache: L1 memory -> L2 Redis)
    if (cacheKey) {
      try {
        const cached = await multiLayerCache.get(cacheKey)
        if (cached) {
          return NextResponse.json(cached, { headers: CONTACTS_LIST_NO_STORE_HEADERS })
        }
      } catch (cacheError) {
        // Cache error is not critical, continue without cache
        console.warn('Cache get error (continuing):', cacheError)
      }
    }

    const where: any = {
      tenantId: tenantId,
    }

    // Support both type (backward compat) and stage (new simplified)
    if (stage) {
      where.stage = stage
    } else if (type) {
      where.type = type
      // Also map type to stage for backward compatibility
      if (type === 'lead') where.stage = 'prospect'
      else if (type === 'contact') where.stage = 'contact'
      else if (type === 'customer') where.stage = 'customer'
    }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch contacts - only essential fields for invoice creation
    // Using minimal fields to avoid schema mismatch errors
    let contacts
    try {
      // First, try with all fields
      contacts = await prismaRead.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          type: true,
          stage: true, // Include stage field
          status: true,
          createdAt: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          gstin: true,
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    } catch (queryError: any) {
      // Log the full error to help identify the problematic field
      const errorDetails = {
        message: queryError?.message,
        code: queryError?.code,
        meta: queryError?.meta,
      }
      console.error('Contact query failed:', JSON.stringify(errorDetails, null, 2))
      console.error('Full error:', queryError)
      
      // If the error mentions an unknown field, try removing potentially missing fields one by one
      if (queryError?.message?.includes('Unknown argument') || queryError?.message?.includes('Available options') || queryError?.code === 'P2009') {
        console.warn('Retrying with reduced field set')
        
        // Try without gstin (might not exist in some schemas)
        try {
          contacts = await prismaRead.contact.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              address: true,
              city: true,
              state: true,
              postalCode: true,
            },
          })
        } catch (error1: any) {
          // Try without postalCode
          try {
            contacts = await prismaRead.contact.findMany({
              where,
              skip: (page - 1) * limit,
              take: limit,
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                address: true,
                city: true,
                state: true,
              },
            })
          } catch (error2: any) {
            // Last resort: absolute minimum
            try {
              contacts = await prismaRead.contact.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              })
            } catch (error3: any) {
              console.error('All fallback queries failed')
              throw queryError // Throw original error
            }
          }
        }
      } else {
        throw queryError
      }
    }

    // Count total contacts with error handling
    let total
    try {
      total = await prismaRead.contact.count({ where })
    } catch (countError: any) {
      console.error('Count query failed:', {
        message: countError?.message,
        code: countError?.code,
      })
      // Use contacts length as fallback
      total = contacts.length
    }

    const contactsWithOwnerName = contacts.map((contact: any) => ({
      ...contact,
      assignedTo: contact.assignedTo
        ? {
            ...contact.assignedTo,
            // SalesRep has no direct `name` column; expose a compatible shape for existing UI consumers.
            name: contact.assignedTo.user?.name || null,
          }
        : null,
    }))

    const result = {
      contacts: contactsWithOwnerName,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    // Cache non-search results for 3 minutes (multi-layer cache: L1 + L2)
    if (cacheKey) {
      try {
        await multiLayerCache.set(cacheKey, result, 180)
      } catch (cacheError) {
        // Cache error is not critical, continue without cache
        console.warn('Cache set error (continuing):', cacheError)
      }
    }

    return NextResponse.json(result, { headers: CONTACTS_LIST_NO_STORE_HEADERS })
  } catch (error: any) {
    // Handle license errors first
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Get contacts error:', error)
    
    // Return more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error?.code || error?.meta?.code
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Check for DATABASE_URL error specifically
    if (errorMessage?.includes('DATABASE_URL')) {
      return NextResponse.json(
        {
          error: 'Database configuration error',
          message: errorMessage,
          troubleshooting: [
            'Check if DATABASE_URL is set in Vercel environment variables',
            'Verify the database connection string is correct',
            'If using Supabase, check if your project is paused',
            'Ensure environment variables are set for Production environment',
          ],
        },
        { status: 503 }
      )
    }
    
    // Log full error details
    console.error('Full error details:', {
      message: errorMessage,
      code: errorCode,
      meta: error?.meta,
      stack: errorStack,
      error: error,
    })
    
    // Check for specific Prisma errors
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Database constraint violation',
          message: errorMessage,
        },
        { status: 400 }
      )
    }
    
    if (errorCode === 'P1001' || errorMessage?.includes('connection')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please check your database configuration.',
        },
        { status: 503 }
      )
    }
    
    // Always include error details in response for debugging
    const errorResponse: any = {
      error: 'Failed to get contacts',
      message: errorMessage,
    }
    
    if (errorCode) {
      errorResponse.code = errorCode
    }
    
    // Include additional details for debugging
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = errorStack
      errorResponse.meta = error?.meta
      errorResponse.rawError = error?.toString()
    }
    
    // Log to server console for debugging
    console.error('Returning error response:', JSON.stringify(errorResponse, null, 2))
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set before proceeding
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is not set. Please configure it in your environment variables.',
          troubleshooting: [
            'Check if DATABASE_URL is set in Vercel environment variables',
            'Verify the database connection string is correct',
            'If using Supabase, check if your project is paused',
            'Ensure environment variables are set for Production environment',
          ],
        },
        { status: 503 }
      )
    }

    const url = request.nextUrl
    const isE2ESeedRequest =
      process.env.NODE_ENV !== 'production' &&
      url.searchParams.get('seed') === '1' &&
      request.headers.get('x-e2e-seed') === '1'

    const body = await request.json()
    const validated = createContactSchema.parse(body)

    if (isE2ESeedRequest) {
      // Fast-path for Playwright seed data: minimize external dependencies and non-critical work.
      const directTenantId = url.searchParams.get('tenantId') || undefined
      let seedTenantId = directTenantId
      if (!seedTenantId) {
        const tenantParam = url.searchParams.get('tenantSlug') || undefined
        const resolvedTenant = await resolveTenantFromParam(tenantParam)
        seedTenantId = resolvedTenant?.id
      }
      if (!seedTenantId) {
        const subParam = url.searchParams.get('tenantSubdomain') || undefined
        if (subParam) {
          const bySub = await prisma.tenant.findFirst({
            where: { subdomain: subParam },
            select: { id: true },
          })
          seedTenantId = bySub?.id
        }
      }
      // prisma/seed.ts demo tenant uses subdomain "demo" but often has no `slug`; CRM URLs still use a slug segment.
      if (!seedTenantId) {
        const demo = await prisma.tenant.findFirst({
          where: { subdomain: 'demo' },
          select: { id: true },
        })
        seedTenantId = demo?.id
      }
      if (!seedTenantId) return NextResponse.json({ error: 'Invalid tenant for seed request' }, { status: 400 })

      const stage =
        validated.stage ||
        (validated.type === 'lead' ? 'prospect' : validated.type === 'customer' ? 'customer' : 'contact')

      const contact = await prisma.contact.create({
        data: {
          ...validated,
          stage,
          tenantId: seedTenantId,
        } as any,
      })

      return NextResponse.json(contact, { status: 201 })
    }

    // Check CRM module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `contact:create:${idempotencyKey}`)
      const existingContactId = (existing?.afterSnapshot as { contact_id?: string } | null)?.contact_id
      if (existing && existingContactId) {
        return NextResponse.json(
          {
            id: existingContactId,
            deduplicated: true,
          },
          { status: 200 }
        )
      }
    }

    const stage = validated.stage || (validated.type === 'lead' ? 'prospect' : validated.type === 'customer' ? 'customer' : 'contact')

    const inbound = await processInboundLead({
      tenantId,
      actorUserId: userId,
      dedupePolicy: 'reject_duplicate',
      source: {
        sourceChannel: 'crm_manual',
        sourceSubchannel: 'api_contacts',
        capturedBy: userId,
        rawMetadata: { tags: validated.tags },
      },
      contact: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        company: validated.company,
        type: validated.type,
        stage,
        status: validated.status,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        postalCode: validated.postalCode,
        country: validated.country,
        tags: validated.tags,
        notes: validated.notes,
        internalNotes: validated.internalNotes,
      },
      legacySourceLabel: validated.source ?? 'crm_manual',
    })

    if (!inbound.ok && inbound.error?.code === 'CONTACT_LIMIT') {
      return NextResponse.json(
        { error: 'Contact limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }
    if (!inbound.ok && inbound.error?.code === 'DUPLICATE_EMAIL') {
      return NextResponse.json(
        {
          error: inbound.error.message,
          code: 'DUPLICATE_EMAIL',
          existingId: inbound.error.existingId,
        },
        { status: 409 }
      )
    }
    if (!inbound.ok && inbound.error?.code === 'DUPLICATE_PHONE') {
      return NextResponse.json(
        {
          error: inbound.error.message,
          code: 'DUPLICATE_PHONE',
          existingId: inbound.error.existingId,
        },
        { status: 409 }
      )
    }
    if (!inbound.ok) {
      return NextResponse.json(
        { error: inbound.error?.message || 'Failed to create contact' },
        { status: 500 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: { id: inbound.contact.id, tenantId },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found after create' }, { status: 500 })
    }

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `contact:create:${idempotencyKey}`, {
        contact_id: contact.id,
      })
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (isTransientDbOverloadError(error)) {
      return dbOverloadResponse('Contact')
    }

    console.error('Create contact error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create contact'
    return NextResponse.json(
      { error: 'Failed to create contact', details: message },
      { status: 500 }
    )
  }
}

