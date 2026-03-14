/**
 * Quota API Route
 * GET /api/quotas/[id] - Get quota
 * DELETE /api/quotas/[id] - Delete quota
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { QuotaCalculatorService } from '@/lib/territories/quota-calculator'

// GET /api/quotas/[id] - Get quota
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const quota = await QuotaCalculatorService.getQuota(tenantId, params.id)

    if (!quota) {
      return NextResponse.json(
        { error: 'Quota not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quota,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get quota error:', error)
    return NextResponse.json(
      { error: 'Failed to get quota' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotas/[id] - Delete quota
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await QuotaCalculatorService.deleteQuota(tenantId, params.id)

    return NextResponse.json({
      success: true,
      message: 'Quota deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete quota error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete quota' },
      { status: 500 }
    )
  }
}
