import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { z } from 'zod'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { triggerWorkflowsByEvent } from '@/lib/workflow/trigger'

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['customer', 'lead', 'vendor', 'employee']).default('lead'),
  stage: z.enum(['prospect', 'contact', 'customer']).optional(), // New simplified stage
  status: z.enum(['active', 'inactive', 'lost']).default('active'),
  source: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('India'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

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

    // Check CRM module license
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
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
          return NextResponse.json(cached)
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
      contacts = await prisma.contact.findMany({
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
          contacts = await prisma.contact.findMany({
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
            contacts = await prisma.contact.findMany({
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
              contacts = await prisma.contact.findMany({
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
      total = await prisma.contact.count({ where })
    } catch (countError: any) {
      console.error('Count query failed:', {
        message: countError?.message,
        code: countError?.code,
      })
      // Use contacts length as fallback
      total = contacts.length
    }

    const result = {
      contacts,
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

    return NextResponse.json(result)
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

    // Check CRM module license
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Check tenant limits
    const canCreate = await checkTenantLimits(tenantId, 'contacts')
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Contact limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createContactSchema.parse(body)

    // Check for duplicate email if provided
    if (validated.email) {
      const existing = await prisma.contact.findFirst({
        where: {
          tenantId: tenantId,
          email: validated.email,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Contact with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Determine stage from type if not provided
    const stage = validated.stage || (validated.type === 'lead' ? 'prospect' : validated.type === 'customer' ? 'customer' : 'contact')

    const contact = await prisma.contact.create({
      data: {
        ...validated,
        stage: stage, // Set stage based on type or provided value
        tenantId: tenantId,
      },
    })

    // Invalidate cache (multi-layer: clears both L1 and L2)
    await multiLayerCache.deletePattern(`contacts:${tenantId}:*`).catch(() => {
      // Ignore cache errors - not critical
    })
    // Invalidate dashboard stats cache so the count updates immediately
    await multiLayerCache.delete(`dashboard:stats:${tenantId}`).catch(() => {
      // Ignore cache errors - not critical
    })

    // Trigger workflow automation (e.g. welcome email, create task)
    triggerWorkflowsByEvent({
      tenantId,
      event: 'contact.created',
      entity: 'contact',
      entityId: contact.id,
      data: {
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
        },
      },
    })

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

    console.error('Create contact error:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

