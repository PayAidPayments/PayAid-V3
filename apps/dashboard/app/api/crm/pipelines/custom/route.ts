import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

/**
 * GET /api/crm/pipelines/custom
 * Get custom pipeline configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get custom pipeline stages from database or return default
    const customPipeline = await prisma.customReport.findFirst({
      where: {
        tenantId,
        reportType: 'custom_pipeline',
      },
    })

    if (customPipeline) {
      const filters = customPipeline.filters as any
      return NextResponse.json({
        stages: filters?.stages || getDefaultStages(),
      })
    }

    return NextResponse.json({
      stages: getDefaultStages(),
    })
  } catch (error: any) {
    console.error('Get custom pipeline error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch pipeline configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/crm/pipelines/custom
 * Save custom pipeline configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin'], 'custom pipeline write')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:pipelines:custom:save:${idempotencyKey}`)
      const existingSaved = (existing?.afterSnapshot as { saved?: boolean } | null)?.saved
      if (existing && existingSaved) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

    const body = await request.json()
    const { stages } = body

    // Save or update custom pipeline
    await prisma.customReport.upsert({
      where: {
        id: `pipeline-${tenantId}`,
      },
      update: {
        filters: { stages } as any,
        updatedAt: new Date(),
      },
      create: {
        id: `pipeline-${tenantId}`,
        tenantId,
        name: 'Custom Pipeline',
        reportType: 'custom_pipeline',
        filters: { stages } as any,
        columns: [],
      },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:pipelines:custom:save:${idempotencyKey}`, {
        saved: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Save custom pipeline error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to save pipeline configuration' },
      { status: 500 }
    )
  }
}

function getDefaultStages() {
  return [
    { id: 'lead', name: 'Lead', order: 0, probability: 10, color: '#8B5CF6' },
    { id: 'qualified', name: 'Qualified', order: 1, probability: 25, color: '#3B82F6' },
    { id: 'proposal', name: 'Proposal', order: 2, probability: 50, color: '#F5C700' },
    { id: 'negotiation', name: 'Negotiation', order: 3, probability: 75, color: '#F97316' },
    { id: 'won', name: 'Won', order: 4, probability: 100, color: '#059669' },
    { id: 'lost', name: 'Lost', order: 5, probability: 0, color: '#DC2626' },
  ]
}
