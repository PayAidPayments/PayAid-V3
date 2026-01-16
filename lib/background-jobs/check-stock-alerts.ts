/**
 * Background job to check for low stock and send alerts
 * Runs daily to check stock levels and send notifications
 */

import { prisma } from '@/lib/db/prisma'
import { checkStockAlerts, sendStockAlertNotifications } from '@/lib/inventory/stock-alerts'

/**
 * Check stock alerts for all tenants or a specific tenant
 */
export async function checkStockAlertsJob(tenantId?: string) {
  const where: any = {}
  if (tenantId) {
    where.id = tenantId
  }

  const tenants = await prisma.tenant.findMany({
    where,
    select: {
      id: true,
      name: true,
    },
  })

  console.log(`Checking stock alerts for ${tenants.length} tenant(s)`)

  let totalAlerts = 0
  let tenantsWithAlerts = 0

  for (const tenant of tenants) {
    try {
      const alerts = await checkStockAlerts(tenant.id)

      if (alerts.length > 0) {
        await sendStockAlertNotifications(tenant.id, alerts)
        totalAlerts += alerts.length
        tenantsWithAlerts++
        console.log(`Tenant ${tenant.name}: ${alerts.length} stock alerts`)
      }
    } catch (error) {
      console.error(`Failed to check stock alerts for tenant ${tenant.name}:`, error)
    }
  }

  console.log(`Stock alert check complete: ${totalAlerts} alerts for ${tenantsWithAlerts} tenant(s)`)

  return {
    tenantsChecked: tenants.length,
    tenantsWithAlerts,
    totalAlerts,
  }
}

