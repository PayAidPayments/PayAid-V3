import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Asset has no direct employee FK; assignments link employees. Active = not returned. */
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

function toAssetResponse<T extends { assignments: { employee: unknown }[] }>(row: T) {
  const assignedTo = row.assignments[0]?.employee ?? null
  const { assignments: _a, ...rest } = row
  return { ...rest, assignedTo }
}

/**
 * GET /api/hr/assets/[id]
 * Get asset details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const asset = await prisma.asset.findFirst({
      where: {
        id: id,
        tenantId,
      },
      include: assetWithAssigneeInclude,
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json(toAssetResponse(asset))
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * PATCH /api/hr/assets/[id]
 * Update asset
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

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

    // Calculate current value if purchase value or depreciation rate changed
    let currentValue
    if (purchaseValue !== undefined || depreciationRate !== undefined) {
      const asset = await prisma.asset.findFirst({
        where: { id: id, tenantId },
      })
      const pValue = purchaseValue !== undefined ? purchaseValue : asset?.purchaseValue || 0
      const depRate = depreciationRate !== undefined ? depreciationRate : asset?.depreciationRate || 20
      const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : (asset?.purchaseDate ? new Date(asset.purchaseDate) : new Date())
      const yearsSincePurchase = (new Date().getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365)
      currentValue = Math.max(0, pValue * (1 - (depRate / 100) * yearsSincePurchase))
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate)
    if (purchaseValue !== undefined) updateData.purchaseValue = purchaseValue
    if (depreciationRate !== undefined) updateData.depreciationRate = depreciationRate
    if (currentValue !== undefined) updateData.currentValue = currentValue
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null
      updateData.status = assignedToId ? 'ASSIGNED' : 'AVAILABLE'
    }
    if (location !== undefined) updateData.location = location
    if (notes !== undefined) updateData.notes = notes

    const asset = await prisma.asset.updateMany({
      where: {
        id: id,
        tenantId,
      },
      data: updateData,
    })

    if (asset.count === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updated = await prisma.asset.findFirst({
      where: { id: id, tenantId },
      include: assetWithAssigneeInclude,
    })

    return NextResponse.json(updated ? toAssetResponse(updated) : null)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
