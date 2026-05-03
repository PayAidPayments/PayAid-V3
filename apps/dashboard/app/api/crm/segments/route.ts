/**
 * CRM Segments API Route
 * GET /api/crm/segments - List segments
 * POST /api/crm/segments - Create segment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse, Segment } from '@/types/base-modules'
import { CreateSegmentRequest } from '@/modules/shared/crm/types'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

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
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId') || tenantId
    if (organizationId !== tenantId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 403,
          error: {
            code: 'TENANT_MISMATCH',
            message: 'organizationId does not match authenticated tenant',
          },
        },
        { status: 403 }
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
          const criteriaArray = typeof segment.criteria === 'string' 
            ? JSON.parse(segment.criteria) 
            : segment.criteria
          const whereClause = buildWhereClauseFromCriteria(criteriaArray)
          contactCount = await prisma.contact.count({
            where: {
              tenantId: organizationId,
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
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error in GET segments route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Create a new segment
 * POST /api/crm/segments
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:segments:create:${idempotencyKey}`)
      const existingSegmentId = (existing?.afterSnapshot as { segment_id?: string } | null)?.segment_id
      if (existing && existingSegmentId) {
        return NextResponse.json(
          {
            success: true,
            statusCode: 200,
            deduplicated: true,
            data: { id: existingSegmentId },
          },
          { status: 200 }
        )
      }
    }
    const body = await request.json()
    const validatedData = CreateSegmentSchema.parse(body)
    if (validatedData.organizationId !== tenantId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 403,
          error: {
            code: 'TENANT_MISMATCH',
            message: 'organizationId does not match authenticated tenant',
          },
        },
        { status: 403 }
      )
    }

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
      const whereClause = buildWhereClauseFromCriteria(validatedData.criteria.filter((c): c is { field: string; operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'; value: unknown } => c.value !== undefined))
      contactCount = await prisma.contact.count({
        where: {
          tenantId: validatedData.organizationId,
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
        criteria: validatedData.criteria.filter((c): c is { field: string; operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'; value: unknown } => c.value !== undefined),
        contactCount,
        createdAt: segment.createdAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:segments:create:${idempotencyKey}`, {
        segment_id: segment.id,
      })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error in POST segments route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

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
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return {}
  }

  // Filter out criteria with undefined values
  const validCriteria = criteria.filter((c) => c.value !== undefined)
  const where: Record<string, unknown> = {}

  for (const criterion of validCriteria) {
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
