import { prisma } from '@/lib/db/prisma'

export interface StockAlert {
  productId: string
  productName: string
  sku: string
  currentQuantity: number
  reorderLevel: number
  locationId?: string
  locationName?: string
  severity: 'low' | 'critical' | 'out_of_stock'
}

/**
 * Check for low stock products and generate alerts
 */
export async function checkStockAlerts(tenantId: string, locationId?: string): Promise<StockAlert[]> {
  const where: any = {
    tenantId,
    quantity: { lte: prisma.product.fields.reorderLevel },
  }

  // Get products with low stock
  const products = await prisma.product.findMany({
    where,
    include: {
      inventoryLocations: locationId
        ? {
            where: { locationId },
          }
        : true,
    },
  })

  const alerts: StockAlert[] = []

  for (const product of products) {
    // Check if out of stock
    if (product.quantity <= 0) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.quantity,
        reorderLevel: product.reorderLevel,
        severity: 'out_of_stock',
      })
    }
    // Check if critical (less than 20% of reorder level)
    else if (product.quantity <= product.reorderLevel * 0.2) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.quantity,
        reorderLevel: product.reorderLevel,
        severity: 'critical',
      })
    }
    // Low stock (below reorder level but above 20%)
    else {
      alerts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.quantity,
        reorderLevel: product.reorderLevel,
        severity: 'low',
      })
    }

    // Add location-specific alerts if multi-location
    if (product.inventoryLocations && product.inventoryLocations.length > 0) {
      for (const invLocation of product.inventoryLocations) {
        if (invLocation.quantity <= (invLocation.reorderLevel || product.reorderLevel)) {
          const location = await prisma.location.findFirst({
            where: { id: invLocation.locationId },
            select: { name: true },
          })

          alerts.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentQuantity: invLocation.quantity,
            reorderLevel: invLocation.reorderLevel || product.reorderLevel,
            locationId: invLocation.locationId,
            locationName: location?.name,
            severity:
              invLocation.quantity <= 0
                ? 'out_of_stock'
                : invLocation.quantity <= (invLocation.reorderLevel || product.reorderLevel) * 0.2
                ? 'critical'
                : 'low',
          })
        }
      }
    }
  }

  return alerts
}

/**
 * Send stock alert notifications
 * Note: This creates notifications for users. The Alert model requires a SalesRep,
 * so we'll create a simplified notification system for stock alerts.
 */
export async function sendStockAlertNotifications(
  tenantId: string,
  alerts: StockAlert[]
): Promise<void> {
  // Get tenant admins/owners
  const admins = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  // Group alerts by severity for better notification grouping
  const groupedAlerts = {
    out_of_stock: alerts.filter(a => a.severity === 'out_of_stock'),
    critical: alerts.filter(a => a.severity === 'critical'),
    low: alerts.filter(a => a.severity === 'low'),
  }

  // Create summary notifications for each admin
  for (const admin of admins) {
    // Try to find a sales rep for this user (for Alert model compatibility)
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: admin.id,
        tenantId,
      },
    })

    if (salesRep) {
      // Create a summary alert if there are any alerts
      if (alerts.length > 0) {
        const title = '📦 Stock Alerts'
        const message = `${alerts.length} stock alert(s): ${groupedAlerts.out_of_stock.length} out of stock, ${groupedAlerts.critical.length} critical, ${groupedAlerts.low.length} low stock`

        try {
          await prisma.alert.create({
            data: {
              repId: salesRep.id,
              tenantId,
              type: 'TASK_DUE', // Using existing type
              title,
              message,
              priority: groupedAlerts.out_of_stock.length > 0 || groupedAlerts.critical.length > 0 ? 'HIGH' : 'MEDIUM',
            },
          })
        } catch (error) {
          console.error('Failed to create stock alert notification:', error)
        }
      }
    } else {
      // If no sales rep, log the alert (can be extended to email/SMS later)
      console.log(`Stock alert for ${admin.email}:`, {
        total: alerts.length,
        out_of_stock: groupedAlerts.out_of_stock.length,
        critical: groupedAlerts.critical.length,
        low: groupedAlerts.low.length,
      })
    }
  }
}

