/**
 * Contract Renewal API
 * POST /api/contracts/[id]/renew - Renew contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { ContractManagerService } from '@/lib/contracts/contract-manager'
import { z } from 'zod'

const renewContractSchema = z.object({
  newEndDate: z.string().datetime(),
})

// POST /api/contracts/[id]/renew - Renew contract
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = renewContractSchema.parse(body)

    const contract = await ContractManagerService.renewContract(
      tenantId,
      params.id,
      new Date(validated.newEndDate)
    )

    return NextResponse.json({
      success: true,
      data: contract,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Renew contract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to renew contract' },
      { status: 500 }
    )
  }
}
