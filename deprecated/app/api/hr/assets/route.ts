import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/assets
 * List assets with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''

    const where: any = { tenantId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      }).catch(() => []),
      prisma.asset.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/assets
 * Create a new asset
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      name,
      category,
      serialNumber,
      purchaseDate,
      purchaseValue,
      depreciationRate,
      assignedToId,
      location,
      notes,
    } = body

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        name,
        category,
        serialNumber: serialNumber || null,
        purchaseDate: new Date(purchaseDate),
        purchaseValue,
        currentValue: purchaseValue,
        depreciationRate: depreciationRate || 20,
        assignedToId: assignedToId || null,
        location: location || null,
        notes: notes || null,
        status: assignedToId ? 'ASSIGNED' : 'AVAILABLE',
        createdBy: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
