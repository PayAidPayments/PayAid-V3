import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateCustomerHealthScore, getRetentionPlaybook } from '@/lib/ai/customer-health-scoring'

/**
 * GET /api/crm/contacts/[id]/health-score
 * Get customer health score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const healthScore = await calculateCustomerHealthScore(id, tenantId)
    const playbook = getRetentionPlaybook(healthScore.riskLevel)

    return NextResponse.json({
      success: true,
      data: {
        ...healthScore,
        playbook,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error calculating health score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}
