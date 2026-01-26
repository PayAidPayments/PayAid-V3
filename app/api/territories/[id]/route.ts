/**
 * Territory API Route
 * GET /api/territories/[id] - Get territory
 * PUT /api/territories/[id] - Update territory
 * DELETE /api/territories/[id] - Delete territory
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { TerritoryManagerService } from '@/lib/territories/territory-manager'
import { z } from 'zod'

const updateTerritorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  criteria: z.object({
    states: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    postalCodes: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    minAnnualRevenue: z.number().optional(),
    maxAnnualRevenue: z.number().optional(),
    customAttributes: z.record(z.any()).optional(),
  }).optional(),
})

// GET /api/territories/[id] - Get territory
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const territory = await TerritoryManagerService.getTerritory(tenantId, params.id)

    if (!territory) {
      return NextResponse.json(
        { error: 'Territory not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: territory,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get territory error:', error)
    return NextResponse.json(
      { error: 'Failed to get territory' },
      { status: 500 }
    )
  }
}

// PUT /api/territories/[id] - Update territory
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateTerritorySchema.parse(body)

    const territory = await TerritoryManagerService.updateTerritory(
      tenantId,
      params.id,
      validated
    )

    return NextResponse.json({
      success: true,
      data: territory,
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

    console.error('Update territory error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update territory' },
      { status: 500 }
    )
  }
}

// DELETE /api/territories/[id] - Delete territory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await TerritoryManagerService.deleteTerritory(tenantId, params.id)

    return NextResponse.json({
      success: true,
      message: 'Territory deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete territory error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete territory' },
      { status: 500 }
    )
  }
}
