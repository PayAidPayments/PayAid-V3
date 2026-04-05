import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
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
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * PATCH /api/hr/assets/[id]
 * Update asset (body fields aligned with Prisma Asset + optional assignment).
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
      brand,
      model,
      purchaseDate,
      purchaseValue,
      purchaseCostInr: purchaseCostInrBody,
      depreciationRate,
      assignedToId,
      locationId,
      notes,
    } = body as Record<string, unknown>

    const costIn = purchaseCostInrBody ?? purchaseValue

    let currentValue: number | undefined
    if (costIn !== undefined || depreciationRate !== undefined) {
      const existing = await prisma.asset.findFirst({
        where: { id: id, tenantId },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }
      const pValue =
        costIn !== undefined
          ? Number(costIn)
          : existing.purchaseCostInr != null
            ? Number(existing.purchaseCostInr)
            : 0
      const depRate =
        depreciationRate !== undefined
          ? Number(depreciationRate)
          : existing.depreciationRate != null
            ? Number(existing.depreciationRate)
            : 20
      const purchaseDateObj = purchaseDate
        ? new Date(String(purchaseDate))
        : existing.purchaseDate
          ? new Date(existing.purchaseDate)
          : new Date()
      const yearsSincePurchase =
        (new Date().getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365)
      currentValue = Math.max(0, pValue * (1 - (depRate / 100) * yearsSincePurchase))
    }

    const updateData: Prisma.AssetUpdateManyMutationInput = {}
    if (name !== undefined) updateData.assetTag = String(name)
    if (category !== undefined) updateData.assetType = String(category)
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber as string | null
    if (brand !== undefined) updateData.brand = brand as string | null
    if (model !== undefined) updateData.model = model as string | null
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(String(purchaseDate))
    if (costIn !== undefined) updateData.purchaseCostInr = Number(costIn)
    if (depreciationRate !== undefined) updateData.depreciationRate = Number(depreciationRate)
    if (currentValue !== undefined) updateData.currentValue = currentValue
    if (locationId !== undefined) updateData.locationId = (locationId as string | null) || null
    if (notes !== undefined) updateData.notes = notes as string | null

    if (Object.keys(updateData).length > 0) {
      const updated = await prisma.asset.updateMany({
        where: { id: id, tenantId },
        data: updateData,
      })
      if (updated.count === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }
    }

    if (assignedToId !== undefined) {
      const assignCount = await prisma.asset.count({ where: { id: id, tenantId } })
      if (assignCount === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }
      const assignee = (assignedToId as string | null) || null
      await prisma.assetAssignment.updateMany({
        where: { assetId: id, tenantId, returnedDate: null },
        data: { returnedDate: new Date() },
      })
      if (assignee) {
        await prisma.assetAssignment.create({
          data: {
            assetId: id,
            employeeId: assignee,
            tenantId,
          },
        })
      }
      await prisma.asset.updateMany({
        where: { id: id, tenantId },
        data: { status: assignee ? 'ASSIGNED' : 'AVAILABLE' },
      })
    }

    const updated = await prisma.asset.findFirst({
      where: { id: id, tenantId },
      include: assetWithAssigneeInclude,
    })

    return NextResponse.json(updated ? toAssetResponse(updated) : null)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
