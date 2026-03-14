import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/locations/[id]/stats - Get location statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get employees at this location
    const employees = await prisma.employee.count({
      where: {
        tenantId,
        locationId: params.id,
        status: 'ACTIVE',
      },
    })

    // Get products at this location
    const products = await prisma.inventoryLocation.count({
      where: {
        tenantId,
        locationId: params.id,
        quantity: { gt: 0 },
      },
    })

    // Get revenue from invoices for this location
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'PAID',
      },
      select: {
        total: true,
      },
    })

    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Get orders for this location
    const orders = await prisma.order.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    // Calculate expenses (from purchase orders)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        orderDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { in: ['APPROVED', 'RECEIVED'] },
      },
      select: {
        total: true,
      },
    })

    const expenses = purchaseOrders.reduce((sum, po) => sum + Number(po.total || 0), 0)
    const profit = revenue - expenses

    const stats = {
      employees,
      products,
      revenue,
      orders,
      expenses,
      profit,
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get location stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get location stats' },
      { status: 500 }
    )
  }
}

