import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getLaborLawCompliance, recordLaborComplianceUpdate } from '@/lib/compliance/india-compliance'
import { z } from 'zod'

const complianceUpdateSchema = z.object({
  type: z.enum(['pf', 'esi', 'contract']),
  status: z.enum(['compliant', 'pending', 'non-compliant']),
  notes: z.string().optional(),
})

/**
 * GET /api/compliance/india/labor
 * Get labor law compliance status
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'compliance')

    const compliance = await getLaborLawCompliance(tenantId)

    return NextResponse.json({
      success: true,
      compliance,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Labor compliance error:', error)
    return NextResponse.json(
      { error: 'Failed to get labor compliance', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/compliance/india/labor
 * Update labor compliance status
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'compliance')

    const body = await request.json()
    const validated = complianceUpdateSchema.parse(body)

    await recordLaborComplianceUpdate(tenantId, {
      ...validated,
      updatedBy: userId,
    })

    return NextResponse.json({
      success: true,
      message: 'Labor compliance updated successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Labor compliance update error:', error)
    return NextResponse.json(
      { error: 'Failed to update labor compliance', details: String(error) },
      { status: 500 }
    )
  }
}
