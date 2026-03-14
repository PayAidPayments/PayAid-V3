import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { calculateAssetDepreciation } from '@/lib/assets/depreciation'

// GET /api/assets/[id]/depreciation - Calculate asset depreciation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const depreciation = await calculateAssetDepreciation(tenantId, id)

    if (!depreciation) {
      return NextResponse.json(
        { error: 'Asset not found or missing purchase information' },
        { status: 404 }
      )
    }

    return NextResponse.json({ depreciation })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Calculate asset depreciation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate depreciation' },
      { status: 500 }
    )
  }
}

