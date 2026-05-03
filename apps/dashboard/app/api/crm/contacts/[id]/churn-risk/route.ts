import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateChurnRisk } from '@/lib/ai/churn-predictor'

/**
 * GET /api/crm/contacts/[id]/churn-risk
 * Calculates churn risk for a specific contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const contactId = id

    const result = await calculateChurnRisk({
      contactId,
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
    console.error(`Error calculating churn risk for ${id}:`, error)
    return NextResponse.json(
      { error: 'Failed to calculate churn risk' },
      { status: 500 }
    )
  }
}
