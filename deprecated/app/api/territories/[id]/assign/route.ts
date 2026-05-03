/**
 * Territory Assignment API
 * POST /api/territories/[id]/assign - Assign sales rep to territory
 * DELETE /api/territories/[id]/assign/[repId] - Remove sales rep from territory
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { TerritoryManagerService } from '@/lib/territories/territory-manager'
import { z } from 'zod'

const assignRepSchema = z.object({
  salesRepId: z.string(),
  role: z.enum(['owner', 'member']).default('member'),
})

// POST /api/territories/[id]/assign - Assign sales rep
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = assignRepSchema.parse(body)

    const assignment = await TerritoryManagerService.assignSalesRep(
      tenantId,
      params.id,
      validated.salesRepId,
      validated.role
    )

    return NextResponse.json({
      success: true,
      data: assignment,
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

    console.error('Assign rep error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign sales rep' },
      { status: 500 }
    )
  }
}
