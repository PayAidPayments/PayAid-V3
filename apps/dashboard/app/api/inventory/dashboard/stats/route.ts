import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/inventory/dashboard/stats - Get Inventory dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch all stats in parallel
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      products,
      warehouses,
    ] = await Promise.all([
      // Total products count
      prisma.product.count({
        where: { tenantId },
      }),
      // Low stock products (quantity <= reorderLevel)
      prisma.product.count({
        where: {
          tenantId,
          quantity: { lte: prisma.product.fields.reorderLevel },
        },
      }),
      // Out of stock products
      prisma.product.count({
        where: {
          tenantId,
          quantity: { lte: 0 },
        },
      }),
      // All products for calculations
      prisma.product.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          salePrice: true,
          costPrice: true,
          categories: true,
          createdAt: true,
        },
      }),
      // Warehouses count (placeholder - would need Warehouse model)
      Promise.resolve(0), // TODO: Add Warehouse model if needed
    ])

    // Calculate total stock value
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.quantity * (product.costPrice || product.salePrice))
    }, 0)

    // Products by category
    const categoryMap = new Map<string, number>()
    products.forEach(product => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((cat: string) => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
        })
      } else {
        categoryMap.set('Uncategorized', (categoryMap.get('Uncategorized') || 0) + 1)
      }
    })
    const productsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }))

    // Stock movements (last 6 months) - simplified for now
    const stockMovements = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      stockMovements.push({
        month: monthName,
        in: Math.floor(Math.random() * 100), // Placeholder - would come from stock movement records
        out: Math.floor(Math.random() * 80),
      })
    }

    // Recent products (last 10)
    const recentProducts = products
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        salePrice: product.salePrice,
        createdAt: product.createdAt.toISOString(),
      }))

    // Top products by value
    const topProducts = products
      .map(product => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        value: product.quantity * (product.costPrice || product.salePrice),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    return NextResponse.json({
      totalProducts,
      lowStockItems: lowStockProducts,
      outOfStockItems: outOfStockProducts,
      totalStockValue,
      totalWarehouses: warehouses || 0,
      productsByCategory,
      stockMovements,
      recentProducts,
      topProducts,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Inventory dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', message: error?.message },
      { status: 500 }
    )
  }
}

