import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getHighRiskCustomers } from '@/lib/ai/churn-predictor'
import { z } from 'zod'

const ChurnRiskQuerySchema = z.object({
  minRiskScore: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 60)),
})

/**
 * GET /api/crm/analytics/churn-risk
 * Returns list of high-risk customers
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)
    
    const query = ChurnRiskQuerySchema.parse({
      minRiskScore: searchParams.get('minRiskScore'),
    })

    const highRisk = await getHighRiskCustomers(tenantId, query.minRiskScore)

    return NextResponse.json({
      success: true,
      count: highRisk.length,
      data: highRisk,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching high-risk customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch churn risk data' },
      { status: 500 }
    )
  }
}
