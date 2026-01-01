/**
 * Multi-Location Inventory Management
 */

import { prisma } from '@/lib/db/prisma'

export interface LocationInventory {
  locationId: string
  locationName: string
  productId: string
  productName: string
  quantity: number
  reserved: number
  available: number
  reorderLevel: number
  reorderPoint: number
}

export interface LocationAnalytics {
  locationId: string
  locationName: string
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  turnoverRate: number
  topProducts: { productId: string; productName: string; quantity: number }[]
}

/**
 * Get inventory across all locations
 */
export async function getMultiLocationInventory(
  tenantId: string,
  productId?: string
): Promise<LocationInventory[]> {
  const where: any = { tenantId }
  if (productId) {
    where.productId = productId
  }

  const inventoryLocations = await prisma.inventoryLocation.findMany({
    where,
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return inventoryLocations.map((il) => ({
    locationId: il.locationId,
    locationName: il.location.name,
    productId: il.productId,
    productName: il.product.name,
    quantity: il.quantity,
    reserved: il.reserved,
    available: il.quantity - il.reserved,
    reorderLevel: il.reorderLevel || 10,
    reorderPoint: (il.reorderLevel || 10) * 1.5,
  }))
}

/**
 * Get location analytics
 */
export async function getLocationAnalytics(
  tenantId: string,
  locationId?: string
): Promise<LocationAnalytics[]> {
  const where: any = { tenantId }
  if (locationId) {
    where.locationId = locationId
  }

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
  })

  const analytics: LocationAnalytics[] = []

  for (const location of locations) {
    const inventory = await prisma.inventoryLocation.findMany({
      where: { tenantId, locationId: location.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            salePrice: true,
          },
        },
      },
    })

    const totalProducts = inventory.length
    const lowStockProducts = inventory.filter(
      (il) => il.quantity <= (il.reorderLevel || 10)
    ).length
    const outOfStockProducts = inventory.filter((il) => il.quantity === 0).length
    const totalValue = inventory.reduce(
      (sum, il) => sum + Number(il.product.salePrice) * il.quantity,
      0
    )

    // Calculate turnover rate (simplified)
    const turnoverRate = inventory.length > 0
      ? inventory.reduce((sum, il) => sum + (il.quantity > 0 ? 1 : 0), 0) / inventory.length
      : 0

    const topProducts = inventory
      .filter((il) => il.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((il) => ({
        productId: il.productId,
        productName: il.product.name,
        quantity: il.quantity,
      }))

    analytics.push({
      locationId: location.id,
      locationName: location.name,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      turnoverRate,
      topProducts,
    })
  }

  return analytics
}

/**
 * Auto-balance stock across locations
 */
export async function autoBalanceStock(
  tenantId: string,
  productId: string,
  targetLocations: string[]
): Promise<void> {
  const inventory = await getMultiLocationInventory(tenantId, productId)

  // Calculate average stock
  const totalStock = inventory.reduce((sum, inv) => sum + inv.quantity, 0)
  const avgStock = totalStock / targetLocations.length

  // Identify locations with excess and deficit
  const excessLocations = inventory.filter((inv) => inv.quantity > avgStock * 1.2)
  const deficitLocations = inventory.filter((inv) => inv.quantity < avgStock * 0.8)

  // Create transfer suggestions (would need to be approved)
  for (const excess of excessLocations) {
    for (const deficit of deficitLocations) {
      const transferAmount = Math.min(
        excess.quantity - avgStock,
        avgStock - deficit.quantity
      )

      if (transferAmount > 0) {
        // Create stock transfer (pending approval)
        await prisma.stockTransfer.create({
          data: {
            tenantId,
            transferNumber: `AUTO-${Date.now()}`,
            fromLocationId: excess.locationId,
            toLocationId: deficit.locationId,
            productId,
            quantity: Math.floor(transferAmount),
            status: 'PENDING',
            notes: 'Auto-balanced stock',
          },
        })
      }
    }
  }
}

