import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { runGDPRComplianceReview } from '@/lib/security/gdpr-compliance-checker'

/**
 * POST /api/compliance/gdpr/review
 * Run GDPR compliance review
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const reviewResult = await runGDPRComplianceReview(tenantId)

    return NextResponse.json({
      success: true,
      data: reviewResult,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error running GDPR compliance review:', error)
    return NextResponse.json(
      { error: 'Failed to run GDPR compliance review' },
      { status: 500 }
    )
  }
}
