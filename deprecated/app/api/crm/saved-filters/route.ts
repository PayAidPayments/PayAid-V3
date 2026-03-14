import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required'),
  entityType: z.string().default('lead'),
  filters: z.record(z.any()), // JSON object with filter criteria
  isDefault: z.boolean().optional().default(false),
})

const updateFilterSchema = z.object({
  name: z.string().min(1).optional(),
  filters: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().optional(),
})

// GET /api/crm/saved-filters?entityType=lead - Get all saved filters
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || 'lead'

    // Get both user-specific and shared (userId=null) filters
    const savedFilters = await prisma.savedFilter.findMany({
      where: {
        tenantId,
        entityType,
        module: 'crm',
        OR: [
          { userId: user?.userId || null }, // User's own filters
          { userId: null }, // Shared filters
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Calculate counts for each filter
    const filtersWithCounts = await Promise.all(
      savedFilters.map(async (filter) => {
        try {
          // Build where clause from filter criteria
          const whereClause: any = {
            tenantId,
            type: entityType === 'lead' ? 'lead' : entityType,
          }

          // Apply filter criteria
          const filterCriteria = filter.filters as any
          if (filterCriteria.source) {
            whereClause.source = filterCriteria.source
          }
          if (filterCriteria.status) {
            whereClause.status = filterCriteria.status
          }
          if (filterCriteria.assignedToId) {
            whereClause.assignedToId = filterCriteria.assignedToId
          }
          if (filterCriteria.search) {
            whereClause.OR = [
              { name: { contains: filterCriteria.search, mode: 'insensitive' } },
              { email: { contains: filterCriteria.search, mode: 'insensitive' } },
              { company: { contains: filterCriteria.search, mode: 'insensitive' } },
            ]
          }
          if (filterCriteria.hasNotes !== undefined) {
            // This would require a join with notes table - simplified for now
          }
          if (filterCriteria.neverOpened) {
            whereClause.lastContactedAt = null
          }

          const count = await prisma.contact.count({ where: whereClause })
          return {
            ...filter,
            count,
          }
        } catch (error) {
          console.error(`Error calculating count for filter ${filter.id}:`, error)
          return {
            ...filter,
            count: 0,
          }
        }
      })
    )

    return NextResponse.json(filtersWithCounts)
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get saved filters error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved filters', message: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/crm/saved-filters - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)

    if (!user?.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = createFilterSchema.parse(body)

    // Check if filter name already exists for this user and entity type
    const existing = await prisma.savedFilter.findFirst({
      where: {
        tenantId,
        userId: user.userId,
        name: validated.name,
        entityType: validated.entityType,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A filter with this name already exists' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults for this entity type
    if (validated.isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          tenantId,
          userId: user.userId,
          entityType: validated.entityType,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        tenantId,
        userId: user.userId,
        name: validated.name,
        entityType: validated.entityType,
        module: 'crm',
        filters: validated.filters,
        isDefault: validated.isDefault || false,
      },
    })

    return NextResponse.json(savedFilter, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create saved filter error:', error)
    return NextResponse.json(
      { error: 'Failed to create saved filter', message: error?.message },
      { status: 500 }
    )
  }
}

