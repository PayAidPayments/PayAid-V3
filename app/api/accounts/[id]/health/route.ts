/**
 * Account Health API
 * GET /api/accounts/[id]/health - Get account health score
 * POST /api/accounts/[id]/health - Calculate/update health score
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AccountHealthService } from '@/lib/accounts/account-health'

// GET /api/accounts/[id]/health - Get account health
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const health = await AccountHealthService.calculateHealthScore(tenantId, params.id)

    return NextResponse.json({
      success: true,
      data: health,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get account health error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get account health' },
      { status: 500 }
    )
  }
}

// POST /api/accounts/[id]/health - Calculate health score
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const health = await AccountHealthService.calculateHealthScore(tenantId, params.id)

    return NextResponse.json({
      success: true,
      data: health,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Calculate account health error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate account health' },
      { status: 500 }
    )
  }
}
