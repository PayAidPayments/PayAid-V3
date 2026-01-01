import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// POST /api/inventory/transfers/[id]/complete - Complete stock transfer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const transfer = await prisma.stockTransfer.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Stock transfer not found' },
        { status: 404 }
      )
    }

    if (transfer.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Transfer already completed' },
        { status: 400 }
      )
    }

    // Update source location (remove reserved, decrease quantity)
    await prisma.inventoryLocation.update({
      where: {
        tenantId_productId_locationId: {
          tenantId,
          productId: transfer.productId,
          locationId: transfer.fromLocationId,
        },
      },
      data: {
        quantity: { decrement: transfer.quantity },
        reserved: { decrement: transfer.quantity },
      },
    })

    // Update destination location (increase quantity)
    await prisma.inventoryLocation.upsert({
      where: {
        tenantId_productId_locationId: {
          tenantId,
          productId: transfer.productId,
          locationId: transfer.toLocationId,
        },
      },
      update: {
        quantity: { increment: transfer.quantity },
      },
      create: {
        tenantId,
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        quantity: transfer.quantity,
      },
    })

    // Update transfer status
    const completed = await prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        receivedDate: new Date(),
      },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      },
    })

    // Update main product quantity
    const totalQuantity = await prisma.inventoryLocation.aggregate({
      where: { tenantId, productId: transfer.productId },
      _sum: { quantity: true },
    })

    await prisma.product.update({
      where: { id: transfer.productId },
      data: {
        quantity: totalQuantity._sum.quantity || 0,
      },
    })

    return NextResponse.json({ transfer: completed })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Complete stock transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to complete stock transfer' },
      { status: 500 }
    )
  }
}

