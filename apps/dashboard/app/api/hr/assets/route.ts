import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

const assetWithAssigneeInclude = {
  assignments: {
    where: { returnedDate: null },
    orderBy: { assignedDate: 'desc' as const },
    take: 1,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
    },
  },
} as const

function toAssetRow<T extends { assignments: { employee: unknown }[] }>(row: T) {
  const assignedTo = row.assignments[0]?.employee ?? null
  const { assignments: _a, ...rest } = row
  return { ...rest, assignedTo }
}

/**
 * GET /api/hr/assets
 * List assets with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''

    const where: {
      tenantId: string
      OR?: Record<string, { contains: string; mode: 'insensitive' }>[]
      status?: string
      assetType?: string
    } = { tenantId }
    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { assetType: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    if (category) {
      where.assetType = category
    }

    const [rows, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: assetWithAssigneeInclude,
      }),
      prisma.asset.count({ where }),
    ])

    const assets = rows.map((r) => toAssetRow(r))

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/assets
 * Create a new asset (body may use legacy `name`/`category` → assetTag/assetType).
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      name,
      category,
      assetTag: bodyAssetTag,
      assetType: bodyAssetType,
      serialNumber,
      purchaseDate,
      purchaseValue,
      purchaseCostInr,
      depreciationRate,
      assignedToId,
      locationId,
      notes,
    } = body as Record<string, unknown>

    const tag = String(bodyAssetTag ?? name ?? `ASSET-${Date.now()}`)
    const type = String(bodyAssetType ?? category ?? 'GENERAL')
    const cost = purchaseCostInr ?? purchaseValue
    const costNum = cost != null && cost !== '' ? Number(cost) : null

    const created = await prisma.asset.create({
      data: {
        tenantId,
        assetTag: tag,
        assetType: type,
        serialNumber: serialNumber != null ? String(serialNumber) : null,
        purchaseDate: purchaseDate ? new Date(String(purchaseDate)) : null,
        purchaseCostInr: costNum,
        currentValue: costNum,
        depreciationRate: depreciationRate != null ? Number(depreciationRate) : 20,
        locationId: (locationId as string | null | undefined) || null,
        notes: notes != null ? String(notes) : null,
        status: assignedToId ? 'ASSIGNED' : 'AVAILABLE',
      },
    })

    if (assignedToId) {
      await prisma.assetAssignment.create({
        data: {
          assetId: created.id,
          employeeId: String(assignedToId),
          tenantId,
        },
      })
    }

    const asset = await prisma.asset.findFirst({
      where: { id: created.id, tenantId },
      include: assetWithAssigneeInclude,
    })

    return NextResponse.json(asset ? toAssetRow(asset) : created, { status: 201 })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
