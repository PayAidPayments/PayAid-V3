import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { multiLayerCache } from '@/lib/cache/multi-layer'
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
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const stage = searchParams.get('stage')
    const contactId = searchParams.get('contactId')

    // Build cache key
    const cacheKey = `deals:${tenantId}:${page}:${limit}:${stage || 'all'}:${contactId || 'all'}`

    // Check cache (multi-layer: L1 memory -> L2 Redis)
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: any = {
      tenantId: tenantId,
    }

    if (stage) where.stage = stage
    if (contactId) where.contactId = contactId

    // Use read replica for GET requests
    const [deals, total, pipelineSummary] = await Promise.all([
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
          createdAt: true,
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

    const result = {
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      pipelineSummary,
    }

    // Cache for 3 minutes (multi-layer: L1 + L2)
    await multiLayerCache.set(cacheKey, result, 180)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get deals error:', error)
    return NextResponse.json(
      { error: 'Failed to get deals' },
      { status: 500 }
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


