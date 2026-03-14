import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/purchases/orders/[id] - Get a single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        goodsReceipts: {
          include: {
            items: {
              include: {
                poItem: true,
              },
            },
            receivedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            receivedDate: 'desc',
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get purchase order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

