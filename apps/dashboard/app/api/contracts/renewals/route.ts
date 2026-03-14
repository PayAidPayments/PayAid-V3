/**
 * Contract Renewals API
 * GET /api/contracts/renewals - Get contracts requiring renewal
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { ContractManagerService } from '@/lib/contracts/contract-manager'

// GET /api/contracts/renewals - Get contracts requiring renewal
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const contracts = await ContractManagerService.getContractsRequiringRenewal(tenantId)

    return NextResponse.json({
      success: true,
      data: contracts,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get contracts requiring renewal error:', error)
    return NextResponse.json(
      { error: 'Failed to get contracts requiring renewal' },
      { status: 500 }
    )
  }
}
