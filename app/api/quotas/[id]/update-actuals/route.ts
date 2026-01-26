/**
 * Quota Update Actuals API
 * POST /api/quotas/[id]/update-actuals - Update quota actuals from deals
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { QuotaCalculatorService } from '@/lib/territories/quota-calculator'

// POST /api/quotas/[id]/update-actuals - Update quota actuals
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const quota = await QuotaCalculatorService.updateQuotaActuals(tenantId, params.id)

    return NextResponse.json({
      success: true,
      data: quota,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update quota actuals error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update quota actuals' },
      { status: 500 }
    )
  }
}
