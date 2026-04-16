/**
 * CRM Lead Pipelines API Route
 * GET /api/crm/pipelines - List pipelines
 * POST /api/crm/pipelines - Create pipeline
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse, LeadPipeline } from '@/types/base-modules'
import { CreatePipelineRequest } from '@/modules/shared/crm/types'
import { z } from 'zod'
import { formatINR } from '@/lib/currency'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

const CreatePipelineSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  stages: z.array(
    z.object({
      name: z.string().min(1),
      order: z.number().int().min(0),
      probability: z.number().min(0).max(100),
    })
  ),
})

/**
 * Get all pipelines for an organization
 * GET /api/crm/pipelines?organizationId=xxx
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

    // Get all deals grouped by stage to build pipeline data
    const deals = await prisma.deal.findMany({
      where: {
        tenantId: organizationId,
        stage: {
          notIn: ['lost', 'won'], // Exclude closed deals from pipeline
        },
      },
      select: {
        stage: true,
        value: true,
      },
    })

    // Calculate total value by stage
    const stageValues: Record<string, number> = {}
    deals.forEach((deal) => {
      const stage = deal.stage || 'lead'
      stageValues[stage] = (stageValues[stage] || 0) + Number(deal.value || 0)
    })

    // Build pipeline structure with stages
    const defaultStages = [
      { name: 'Lead', order: 0, probability: 10 },
      { name: 'Qualified', order: 1, probability: 25 },
      { name: 'Proposal', order: 2, probability: 50 },
      { name: 'Negotiation', order: 3, probability: 75 },
      { name: 'Won', order: 4, probability: 100 },
    ]

    const pipeline: LeadPipeline = {
      id: 'default-pipeline',
      organizationId,
      name: 'Default Sales Pipeline',
      stages: defaultStages.map((stage) => ({
        id: stage.name.toLowerCase(),
        name: stage.name,
        order: stage.order,
        probability: stage.probability,
      })),
      currency: 'INR',
      totalValue: Object.values(stageValues).reduce((sum, val) => sum + val, 0),
    }

    const response: ApiResponse<LeadPipeline> = {
      success: true,
      statusCode: 200,
      data: pipeline,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error in GET pipelines route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Create a new pipeline
 * POST /api/crm/pipelines
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin'], 'pipeline write')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:pipelines:create:${idempotencyKey}`)
      const existingPipelineId = (existing?.afterSnapshot as { pipeline_id?: string } | null)?.pipeline_id
      if (existing && existingPipelineId) {
        return NextResponse.json(
          {
            success: true,
            statusCode: 200,
            deduplicated: true,
            data: { id: existingPipelineId },
          },
          { status: 200 }
        )
      }
    }
    const body = await request.json()
    const validatedData = CreatePipelineSchema.parse(body)
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

    // For now, we'll store pipeline configuration in a custom way
    // In production, you might want a dedicated Pipeline table
    const pipeline: LeadPipeline = {
      id: `pipeline-${Date.now()}`,
      organizationId: validatedData.organizationId,
      name: validatedData.name,
      stages: validatedData.stages.map((stage, index) => ({
        id: `stage-${index}`,
        name: stage.name,
        order: stage.order,
        probability: stage.probability,
      })),
      currency: 'INR',
      totalValue: 0, // Will be calculated from deals
    }

    const response: ApiResponse<LeadPipeline> = {
      success: true,
      statusCode: 201,
      data: pipeline,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:pipelines:create:${idempotencyKey}`, {
        pipeline_id: pipeline.id,
      })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json(
        { success: false, statusCode: error.status, error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error in POST pipelines route:', error)
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
