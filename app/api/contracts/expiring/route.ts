/**
 * Expiring Contracts API
 * GET /api/contracts/expiring - Get contracts expiring soon
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { ContractManagerService } from '@/lib/contracts/contract-manager'

// GET /api/contracts/expiring - Get expiring contracts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const daysAhead = parseInt(searchParams.get('daysAhead') || '90')

    const contracts = await ContractManagerService.getExpiringContracts(
      tenantId,
      daysAhead
    )

    return NextResponse.json({
      success: true,
      data: contracts,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get expiring contracts error:', error)
    return NextResponse.json(
      { error: 'Failed to get expiring contracts' },
      { status: 500 }
    )
  }
}
