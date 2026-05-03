import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateDealClosureProbability } from '@/lib/ai/deal-closure-probability'

/**
 * GET /api/crm/deals/[id]/probability
 * Calculates deal closure probability for a specific deal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const dealId = id

    const result = await calculateDealClosureProbability({
      dealId,
      tenantId,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error(`Error calculating deal probability for ${id}:`, error)
    return NextResponse.json(
      { error: 'Failed to calculate deal probability' },
      { status: 500 }
    )
  }
}
