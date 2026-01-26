/**
 * Sync Financial Data for All Tenants
 * 
 * This script initializes and syncs financial data for all active tenants
 * Run this after database setup is complete
 */

import { PrismaClient } from '@prisma/client'
import { syncFinancialData } from '../lib/services/financial/transaction-sync'

const prisma = new PrismaClient()

async function main() {
  console.log('Syncing financial data for all tenants...')

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`Found ${tenants.length} active tenants`)

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.name} (${tenant.id})`)

      try {
        // Sync financial data
        await syncFinancialData(tenant.id, {
          syncInvoices: true,
          syncPayments: true,
          syncBankFeeds: false, // Set to true if bank feeds are configured
        })

        console.log(`✓ Synced financial data for ${tenant.name}`)
      } catch (error: any) {
        console.error(`✗ Error syncing ${tenant.name}:`, error.message)
        // Continue with other tenants
      }
    }

    console.log('\n✅ Financial data sync complete!')
  } catch (error) {
    console.error('Error syncing financial data:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
