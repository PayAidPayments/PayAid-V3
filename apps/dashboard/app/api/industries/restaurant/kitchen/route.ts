import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/industries/restaurant/kitchen - Get kitchen display (active orders)
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Get orders that are pending or cooking
    const orders = await prisma.restaurantOrder.findMany({
      where: {
        tenantId: tenantId,
        status: {
          in: ['PENDING', 'COOKING'],
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                preparationTime: true,
                category: true,
                isSpicy: true,
                isVegetarian: true,
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' }, // Oldest first
      ],
    })

    // Group by status for display
    const pending = orders.filter((o) => o.status === 'PENDING')
    const cooking = orders.filter((o) => o.status === 'COOKING')

    return NextResponse.json({
      pending,
      cooking,
      total: orders.length,
    })
  } catch (error) {
    console.error('Get kitchen display error:', error)
    return NextResponse.json(
      { error: 'Failed to get kitchen display' },
      { status: 500 }
    )
  }
}
