/**
 * CRM Segments API Route
 * GET /api/crm/segments - List segments
 * POST /api/crm/segments - Create segment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling, successResponse } from '@/lib/api/route-wrapper'
import { ApiResponse, Segment } from '@/types/base-modules'
import { CreateSegmentRequest } from '@/modules/shared/crm/types'
import { z } from 'zod'

const CreateSegmentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  criteria: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
      value: z.unknown(),
    })
  ),
})

/**
 * Get all segments for an organization
 * GET /api/crm/segments?organizationId=xxx
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const segments = await prisma.segment.findMany({
    where: {
      tenantId: organizationId,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate contact count for each segment
  const segmentsWithCounts = await Promise.all(
    segments.map(async (segment) => {
      let contactCount = 0
      try {
        // Parse criteria and count matching contacts
        const whereClause = buildWhereClauseFromCriteria(segment.criteria as string)
        contactCount = await prisma.contact.count({
          where: {
            organizationId,
            ...whereClause,
          },
        })
      } catch (error) {
        console.error(`Error calculating contact count for segment ${segment.id}:`, error)
      }

      return {
        id: segment.id,
        organizationId: segment.tenantId,
        name: segment.name,
        criteria: JSON.parse(segment.criteria || '[]'),
        contactCount,
        createdAt: segment.createdAt,
      }
    })
  )

  const response: ApiResponse<Segment[]> = {
    success: true,
    statusCode: 200,
    data: segmentsWithCounts as Segment[],
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})

/**
 * Create a new segment
 * POST /api/crm/segments
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateSegmentSchema.parse(body)

  const segment = await prisma.segment.create({
    data: {
      tenantId: validatedData.organizationId,
      name: validatedData.name,
      criteria: JSON.stringify(validatedData.criteria),
      criteriaConfig: JSON.stringify(validatedData.criteria),
    },
  })

  // Calculate initial contact count
  let contactCount = 0
  try {
    const whereClause = buildWhereClauseFromCriteria(validatedData.criteria)
    contactCount = await prisma.contact.count({
      where: {
        organizationId: validatedData.organizationId,
        ...whereClause,
      },
    })
  } catch (error) {
    console.error(`Error calculating contact count for new segment:`, error)
  }

  const response: ApiResponse<Segment> = {
    success: true,
    statusCode: 201,
    data: {
      id: segment.id,
      organizationId: segment.tenantId,
      name: segment.name,
      criteria: validatedData.criteria,
      contactCount,
      createdAt: segment.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * Helper function to build Prisma where clause from criteria
 */
function buildWhereClauseFromCriteria(
  criteria: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
    value: unknown
  }>
): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  for (const criterion of criteria) {
    switch (criterion.operator) {
      case 'equals':
        where[criterion.field] = criterion.value
        break
      case 'contains':
        where[criterion.field] = {
          contains: criterion.value,
          mode: 'insensitive',
        }
        break
      case 'greater_than':
        where[criterion.field] = {
          gt: criterion.value,
        }
        break
      case 'less_than':
        where[criterion.field] = {
          lt: criterion.value,
        }
        break
      case 'in':
        where[criterion.field] = {
          in: Array.isArray(criterion.value) ? criterion.value : [criterion.value],
        }
        break
      case 'not_in':
        where[criterion.field] = {
          notIn: Array.isArray(criterion.value) ? criterion.value : [criterion.value],
        }
        break
    }
  }

  return where
}
