/**
 * Migration Script: Update Tenant ID from CUID to Personalized Format
 * 
 * This script updates an existing tenant ID to the personalized format
 * based on the business name.
 * 
 * Usage:
 *   npx tsx scripts/migrate-tenant-id.ts <old-tenant-id> <business-name>
 * 
 * Example:
 *   npx tsx scripts/migrate-tenant-id.ts cmjptk2mw0000aocw31u48n64 "Demo Business Pvt Ltd"
 * 
 * WARNING: This updates the tenant ID which is used as a foreign key in many tables.
 * Make sure to backup your database before running this script.
 */

import { PrismaClient } from '@prisma/client'
import { generateTenantId } from '../lib/utils/tenant-id'

const prisma = new PrismaClient()

async function migrateTenantId(oldTenantId: string, businessName: string) {
  console.log(`\n🔄 Starting migration for tenant: ${oldTenantId}`)
  console.log(`📝 Business Name: ${businessName}`)

  try {
    // Step 1: Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: oldTenantId },
      include: {
        users: true,
        deals: true,
        contacts: true,
        tasks: true,
        // Add other relations as needed
      }
    })

    if (!tenant) {
      console.error(`❌ Tenant not found: ${oldTenantId}`)
      process.exit(1)
    }

    console.log(`✅ Tenant found: ${tenant.name}`)
    console.log(`   Users: ${tenant.users.length}`)
    console.log(`   Deals: ${tenant.deals.length}`)
    console.log(`   Contacts: ${tenant.contacts.length}`)
    console.log(`   Tasks: ${tenant.tasks.length}`)

    // Step 2: Generate new personalized tenant ID
    const allTenants = await prisma.tenant.findMany({
      select: { id: true }
    })
    const existingIds = allTenants.map(t => t.id).filter(id => id !== oldTenantId)
    
    const newTenantId = generateTenantId(businessName || tenant.name, existingIds)
    console.log(`\n🆕 New Tenant ID: ${newTenantId}`)

    if (newTenantId === oldTenantId) {
      console.log(`✅ Tenant ID already in correct format. No migration needed.`)
      return
    }

    // Step 3: Update all related records in a transaction
    console.log(`\n🔄 Updating tenant and all related records...`)
    
    await prisma.$transaction(async (tx) => {
      // Update tenant
      await tx.tenant.update({
        where: { id: oldTenantId },
        data: { id: newTenantId }
      })

      // Update users
      await tx.user.updateMany({
        where: { tenantId: oldTenantId },
        data: { tenantId: newTenantId }
      })

      // Update deals
      await tx.deal.updateMany({
        where: { tenantId: oldTenantId },
        data: { tenantId: newTenantId }
      })

      // Update contacts
      await tx.contact.updateMany({
        where: { tenantId: oldTenantId },
        data: { tenantId: newTenantId }
      })

      // Update tasks
      await tx.task.updateMany({
        where: { tenantId: oldTenantId },
        data: { tenantId: newTenantId }
      })

      // Update leads (if exists)
      if (tx.lead) {
        await (tx as any).lead.updateMany({
          where: { tenantId: oldTenantId },
          data: { tenantId: newTenantId }
        })
      }

      // Update invoices (if exists)
      if (tx.invoice) {
        await (tx as any).invoice.updateMany({
          where: { tenantId: oldTenantId },
          data: { tenantId: newTenantId }
        })
      }

      // Update products (if exists)
      if (tx.product) {
        await (tx as any).product.updateMany({
          where: { tenantId: oldTenantId },
          data: { tenantId: newTenantId }
        })
      }

      // Update orders (if exists)
      if (tx.order) {
        await (tx as any).order.updateMany({
          where: { tenantId: oldTenantId },
          data: { tenantId: newTenantId }
        })
      }

      // Add other model updates as needed
    })

    console.log(`\n✅ Migration completed successfully!`)
    console.log(`   Old ID: ${oldTenantId}`)
    console.log(`   New ID: ${newTenantId}`)
    console.log(`\n⚠️  IMPORTANT: Update your JWT tokens and clear browser cache`)
    console.log(`   Users will need to log out and log back in`)

  } catch (error) {
    console.error(`\n❌ Migration failed:`, error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
const args = process.argv.slice(2)
if (args.length < 1) {
  console.error('Usage: npx tsx scripts/migrate-tenant-id.ts <old-tenant-id> [business-name]')
  console.error('Example: npx tsx scripts/migrate-tenant-id.ts cmjptk2mw0000aocw31u48n64 "Demo Business Pvt Ltd"')
  process.exit(1)
}

const oldTenantId = args[0]
const businessName = args[1] || 'Demo Business Pvt Ltd'

migrateTenantId(oldTenantId, businessName)
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
