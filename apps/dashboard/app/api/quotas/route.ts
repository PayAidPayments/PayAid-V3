/**
 * Quotas API Route
 * POST /api/quotas - Create quota
 * GET /api/quotas - List quotas
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { QuotaCalculatorService } from '@/lib/territories/quota-calculator'
import { z } from 'zod'

const createQuotaSchema = z.object({
  salesRepId: z.string().optional(),
  territoryId: z.string().optional(),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  target: z.number().positive(),
})

// POST /api/quotas - Create quota
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createQuotaSchema.parse(body)

    if (!validated.salesRepId && !validated.territoryId) {
      return NextResponse.json(
        { error: 'Either salesRepId or territoryId must be provided' },
        { status: 400 }
      )
    }

    const quota = await QuotaCalculatorService.createQuota(tenantId, {
      salesRepId: validated.salesRepId,
      territoryId: validated.territoryId,
      period: validated.period,
      periodStart: new Date(validated.periodStart),
      periodEnd: new Date(validated.periodEnd),
      target: validated.target,
    })

    return NextResponse.json({
      success: true,
      data: quota,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create quota error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quota' },
      { status: 500 }
    )
  }
}

// GET /api/quotas - List quotas
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const salesRepId = searchParams.get('salesRepId') || undefined
    const territoryId = searchParams.get('territoryId') || undefined
    const period = searchParams.get('period') as 'monthly' | 'quarterly' | 'annual' | undefined

    const quotas = await QuotaCalculatorService.listQuotas(tenantId, {
      salesRepId,
      territoryId,
      period,
    })

    return NextResponse.json({
      success: true,
      data: quotas,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List quotas error:', error)
    return NextResponse.json(
      { error: 'Failed to list quotas' },
      { status: 500 }
    )
  }
}
