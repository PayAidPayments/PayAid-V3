import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createMaintenanceSchema = z.object({
  assetId: z.string(),
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION']),
  scheduledDate: z.string().datetime().optional(),
  technician: z.string().optional(),
  cost: z.number().positive().optional(),
  description: z.string().min(1),
  notes: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
})

/**
 * GET /api/asset-management/maintenance
 * List maintenance records
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const status = searchParams.get('status')
    const maintenanceType = searchParams.get('maintenanceType')

    const where: any = { tenantId }
    if (assetId) where.assetId = assetId
    if (maintenanceType) where.maintenanceType = maintenanceType

    const records = await prisma.assetMaintenance.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            assetType: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    })

    return NextResponse.json({ records })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get maintenance records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/asset-management/maintenance
 * Create maintenance record
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')

    const body = await request.json()
    const validated = createMaintenanceSchema.parse(body)

    // Verify asset exists
    const asset = await prisma.asset.findFirst({
      where: {
        id: validated.assetId,
        tenantId,
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const record = await prisma.assetMaintenance.create({
      data: {
        assetId: validated.assetId,
        tenantId,
        maintenanceType: validated.maintenanceType,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
        technician: validated.technician,
        cost: validated.cost,
        description: validated.description,
        notes: validated.notes,
        nextMaintenanceDate: validated.nextMaintenanceDate ? new Date(validated.nextMaintenanceDate) : null,
        status: 'SCHEDULED',
      },
      include: {
        asset: true,
      },
    })

    // Note: Asset model doesn't have lastMaintenanceDate/nextMaintenanceDate fields
    // These are stored in AssetMaintenance records

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create maintenance record error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}

