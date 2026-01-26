import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getRiskCalibrationMetrics } from '@/lib/ai/risk-policy-manager'
import { DecisionType } from '@/lib/ai/decision-risk'

/**
 * GET /api/ai/risk-policies/calibration
 * Get risk calibration metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { searchParams } = new URL(request.url)
    const decisionType = searchParams.get('decisionType') as DecisionType | null

    const metrics = await getRiskCalibrationMetrics(tenantId, decisionType || undefined)

    return NextResponse.json({ success: true, metrics })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get calibration metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get calibration metrics', details: String(error) },
      { status: 500 }
    )
  }
}
