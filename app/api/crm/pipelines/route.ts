/**
 * CRM Lead Pipelines API Route
 * GET /api/crm/pipelines - List pipelines
 * POST /api/crm/pipelines - Create pipeline
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, LeadPipeline } from '@/types/base-modules'
import { CreatePipelineRequest } from '@/modules/shared/crm/types'
import { z } from 'zod'
import { formatINR } from '@/lib/currency'

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
})

/**
 * Create a new pipeline
 * POST /api/crm/pipelines
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreatePipelineSchema.parse(body)

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

  return NextResponse.json(response, { status: 201 })
})
