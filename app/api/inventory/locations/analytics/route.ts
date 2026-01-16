import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getLocationAnalytics, getMultiLocationInventory, autoBalanceStock } from '@/lib/inventory/multi-location'

// GET /api/inventory/locations/analytics - Get location analytics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')
    const { prisma } = await import('@/lib/db/prisma')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get all locations
    const locations = await prisma.location.findMany({
      where: { tenantId },
    })

    // Get total employees across all locations
    const totalEmployees = await prisma.employee.count({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    })

    // Get total products across all locations
    const totalProducts = await prisma.inventoryLocation.count({
      where: {
        tenantId,
        quantity: { gt: 0 },
      },
    })

    // Get total revenue from invoices
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

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Get total orders
    const totalOrders = await prisma.order.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    const analytics = {
      totalLocations: locations.length,
      activeLocations: locations.filter(l => l.isActive).length,
      totalEmployees,
      totalRevenue,
      totalOrders,
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Location analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/locations/analytics/balance - Auto-balance stock
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const { productId, targetLocations } = body

    if (!productId || !targetLocations) {
      return NextResponse.json(
        { error: 'productId and targetLocations are required' },
        { status: 400 }
      )
    }

    await autoBalanceStock(tenantId, productId, targetLocations)

    return NextResponse.json({
      success: true,
      message: 'Stock balancing initiated',
    })
  } catch (error: any) {
    console.error('Stock balancing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to balance stock' },
      { status: 500 }
    )
  }
}

