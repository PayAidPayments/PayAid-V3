import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/inventory/reports - Get inventory reports data
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    switch (reportType) {
      case 'overview': {
        // Get overview statistics
        const [
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalWarehouses,
          products,
        ] = await Promise.all([
          prisma.product.count({ where: { tenantId } }),
          prisma.product.count({
            where: {
              tenantId,
              quantity: { lte: prisma.product.fields.reorderLevel },
            },
          }),
          prisma.product.count({
            where: {
              tenantId,
              quantity: { lte: 0 },
            },
          }),
          prisma.location.count({ where: { tenantId, isActive: true } }),
          prisma.product.findMany({
            where: { tenantId },
            select: {
              id: true,
              name: true,
              quantity: true,
              costPrice: true,
              salePrice: true,
            },
          }),
        ])

        const totalStockValue = products.reduce((sum, product) => {
          return sum + (product.quantity * (product.costPrice || product.salePrice || 0))
        }, 0)

        return NextResponse.json({
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalWarehouses,
          totalStockValue,
        })
      }

      case 'stock-value': {
        // Stock value by category
        const products = await prisma.product.findMany({
          where: { tenantId },
          select: {
            id: true,
            name: true,
            categories: true,
            quantity: true,
            costPrice: true,
            salePrice: true,
          },
        })

        const byCategory = products.reduce((acc: any, product) => {
          const categories = product.categories || ['Uncategorized']
          const value = product.quantity * (product.costPrice || product.salePrice || 0)
          
          categories.forEach((cat: string) => {
            if (!acc[cat]) {
              acc[cat] = { category: cat, value: 0, products: 0 }
            }
            acc[cat].value += value
            acc[cat].products += 1
          })
          
          return acc
        }, {})

        return NextResponse.json({
          byCategory: Object.values(byCategory),
        })
      }

      case 'low-stock': {
        // Low stock products
        const products = await prisma.product.findMany({
          where: {
            tenantId,
            quantity: { lte: prisma.product.fields.reorderLevel },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            reorderLevel: true,
            costPrice: true,
            salePrice: true,
          },
          orderBy: { quantity: 'asc' },
        })

        return NextResponse.json({
          products: products.map(p => ({
            ...p,
            stockValue: p.quantity * (p.costPrice || p.salePrice || 0),
            needsReorder: p.quantity <= (p.reorderLevel || 0),
          })),
        })
      }

      case 'movements': {
        // Stock movements over time
        const transfers = await prisma.stockTransfer.findMany({
          where: {
            tenantId,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            product: { select: { id: true, name: true } },
            fromLocation: { select: { id: true, name: true } },
            toLocation: { select: { id: true, name: true } },
          },
        })

        // Group by month
        const byMonth = transfers.reduce((acc: any, transfer) => {
          const month = new Date(transfer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          if (!acc[month]) {
            acc[month] = { month, in: 0, out: 0, transfers: 0 }
          }
          if (transfer.toLocationId && !transfer.fromLocationId) {
            acc[month].in += transfer.quantity
          } else if (transfer.fromLocationId && !transfer.toLocationId) {
            acc[month].out += transfer.quantity
          } else {
            acc[month].transfers += transfer.quantity
          }
          return acc
        }, {})

        return NextResponse.json({
          byMonth: Object.values(byMonth),
          totalMovements: transfers.length,
        })
      }

      case 'warehouse-utilization': {
        // Stock distribution across warehouses
        const warehouses = await prisma.location.findMany({
          where: { tenantId, isActive: true },
          include: {
            inventoryLocations: {
              include: {
                product: {
                  select: {
                    costPrice: true,
                    salePrice: true,
                  },
                },
              },
            },
          },
        })

        const utilization = warehouses.map((warehouse) => {
          const stockValue = warehouse.inventoryLocations.reduce((sum, inv) => {
            const price = inv.product.costPrice || inv.product.salePrice || 0
            return sum + (inv.quantity * price)
          }, 0)

          return {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            productCount: warehouse.inventoryLocations.length,
            stockValue,
            totalQuantity: warehouse.inventoryLocations.reduce((sum, inv) => sum + inv.quantity, 0),
          }
        })

        return NextResponse.json({
          utilization,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get inventory reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

