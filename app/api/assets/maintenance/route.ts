import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createMaintenanceSchema = z.object({
  assetId: z.string(),
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION']),
  scheduledDate: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  technician: z.string().optional(),
  description: z.string().min(1),
  notes: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
})

// GET /api/assets/maintenance - List maintenance records
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const maintenanceType = searchParams.get('maintenanceType')
    const scheduledDate = searchParams.get('scheduledDate')

    const where: any = { tenantId }
    if (assetId) where.assetId = assetId
    if (maintenanceType) where.maintenanceType = maintenanceType
    if (scheduledDate) {
      where.scheduledDate = { gte: new Date(scheduledDate) }
    }

    const maintenance = await prisma.assetMaintenance.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            assetType: true,
            brand: true,
            model: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    })

    return NextResponse.json({ maintenance })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get asset maintenance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset maintenance' },
      { status: 500 }
    )
  }
}

// POST /api/assets/maintenance - Create maintenance record
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createMaintenanceSchema.parse(body)

    const maintenance = await prisma.assetMaintenance.create({
      data: {
        tenantId,
        assetId: validated.assetId,
        maintenanceType: validated.maintenanceType,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
        cost: validated.cost ? new Decimal(validated.cost) : null,
        technician: validated.technician,
        description: validated.description,
        notes: validated.notes,
        nextMaintenanceDate: validated.nextMaintenanceDate ? new Date(validated.nextMaintenanceDate) : null,
      },
      include: {
        asset: true,
      },
    })

    // Update asset status if maintenance is corrective
    if (validated.maintenanceType === 'CORRECTIVE') {
      await prisma.asset.update({
        where: { id: validated.assetId },
        data: { status: 'MAINTENANCE' },
      })
    }

    return NextResponse.json({ maintenance }, { status: 201 })
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

    console.error('Create asset maintenance error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}

