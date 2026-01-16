import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createAssetSchema = z.object({
  assetNumber: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION']).optional(),
  usefulLife: z.number().int().positive().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/asset-management/assets
 * List assets
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')

    const where: any = { tenantId }
    if (status) where.status = status
    if (category) where.category = category
    if (location) where.location = location
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetNumber: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        maintenanceRecords: {
          where: { status: 'SCHEDULED' },
          orderBy: { scheduledDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get assets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/asset-management/assets
 * Create asset
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')

    const body = await request.json()
    const validated = createAssetSchema.parse(body)

    // Generate asset number if not provided
    const assetNumber = validated.assetNumber || 
      `AST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        assetNumber,
        name: validated.name,
        category: validated.category,
        subCategory: validated.subCategory,
        brand: validated.brand,
        model: validated.model,
        serialNumber: validated.serialNumber,
        barcode: validated.barcode,
        purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
        purchasePrice: validated.purchasePrice,
        currentValue: validated.currentValue || validated.purchasePrice,
        depreciationMethod: validated.depreciationMethod,
        usefulLife: validated.usefulLife,
        location: validated.location,
        assignedTo: validated.assignedTo,
        warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : null,
        notes: validated.notes,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ asset }, { status: 201 })
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

    console.error('Create asset error:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}

