/**
 * CRM Segments API Route
 * GET /api/crm/segments - List segments
 * POST /api/crm/segments - Create segment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCrmDomainDeps, createSegmentInputSchema } from '@payaid/domain-crm'
import type { Segment } from '@/types/base-modules'
import { ApiResponse } from '@/types/base-modules'
import { z } from 'zod'
import { isCrmTenantContext, requireCrmTenant } from '@/lib/api/crm/resolve-crm-tenant'
import { logCrmAudit } from '@/lib/audit-log-crm'

const crmDomain = createCrmDomainDeps()

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get('organizationId')
    const auth = await requireCrmTenant(request, organizationId)
    if (!isCrmTenantContext(auth)) return auth

    const segments = await crmDomain.listSegments(auth.tenantId)

    const response: ApiResponse<Segment[]> = {
      success: true,
      statusCode: 200,
      data: segments as Segment[],
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET segments route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSegmentInputSchema.parse(body)
    const auth = await requireCrmTenant(request, validatedData.organizationId)
    if (!isCrmTenantContext(auth)) return auth

    const segment = await crmDomain.createSegment({
      ...validatedData,
      organizationId: auth.tenantId,
    })

    await logCrmAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      entityType: 'segment',
      entityId: segment.id,
      action: 'create',
      changeSummary: `Created segment ${segment.name ?? segment.id}`,
    })

    const response: ApiResponse<Segment> = {
      success: true,
      statusCode: 201,
      data: segment as Segment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
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
