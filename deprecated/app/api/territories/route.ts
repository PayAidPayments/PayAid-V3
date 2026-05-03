/**
 * Territories API Route
 * POST /api/territories - Create territory
 * GET /api/territories - List territories
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { TerritoryManagerService } from '@/lib/territories/territory-manager'
import { z } from 'zod'

const createTerritorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.object({
    states: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    postalCodes: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    minAnnualRevenue: z.number().optional(),
    maxAnnualRevenue: z.number().optional(),
    customAttributes: z.record(z.any()).optional(),
  }),
  salesRepIds: z.array(z.string()).optional(),
})

// POST /api/territories - Create territory
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createTerritorySchema.parse(body)

    const territory = await TerritoryManagerService.createTerritory(tenantId, validated)

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

    console.error('Create territory error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create territory' },
      { status: 500 }
    )
  }
}

// GET /api/territories - List territories
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const territories = await TerritoryManagerService.listTerritories(tenantId)

    return NextResponse.json({
      success: true,
      data: territories,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List territories error:', error)
    return NextResponse.json(
      { error: 'Failed to list territories' },
      { status: 500 }
    )
  }
}
