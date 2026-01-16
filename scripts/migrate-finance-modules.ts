/**
 * Migration Script: Finance Module Consolidation
 * 
 * This script migrates existing customers from separate invoicing/accounting modules
 * to the consolidated Finance module.
 * 
 * Run with: npx tsx scripts/migrate-finance-modules.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateFinanceModules() {
  console.log('🚀 Starting Finance Module Consolidation Migration...\n')

  try {
    // Find all tenants with invoicing or accounting modules
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { licensedModules: { has: 'invoicing' } },
          { licensedModules: { has: 'accounting' } },
        ],
      },
    })

    console.log(`📊 Found ${tenants.length} tenants to migrate\n`)

    if (tenants.length === 0) {
      console.log('✅ No tenants need migration. All set!')
      return
    }

    let migrated = 0
    let errors = 0

    for (const tenant of tenants) {
      try {
        const currentModules = tenant.licensedModules || []
        const hasInvoicing = currentModules.includes('invoicing')
        const hasAccounting = currentModules.includes('accounting')
        const hasFinance = currentModules.includes('finance')

        // Build new modules array
        const newModules = [...currentModules]

        // Remove invoicing and accounting
        const filteredModules = newModules.filter(
          (m) => m !== 'invoicing' && m !== 'accounting'
        )

        // Add finance if not already present and if they had invoicing or accounting
        if (!hasFinance && (hasInvoicing || hasAccounting)) {
          filteredModules.push('finance')
        }

        // Update tenant
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            licensedModules: filteredModules,
            updatedAt: new Date(),
          },
        })

        migrated++
        console.log(
          `✅ Migrated tenant: ${tenant.name} (${tenant.subdomain || tenant.id})`
        )
        console.log(
          `   Removed: ${hasInvoicing ? 'invoicing' : ''} ${hasAccounting ? 'accounting' : ''}`
        )
        console.log(`   Added: finance`)
        console.log(`   New modules: ${filteredModules.join(', ')}\n`)
      } catch (error) {
        errors++
        console.error(
          `❌ Error migrating tenant ${tenant.id}:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    console.log('\n📈 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${migrated} tenants`)
    console.log(`   ❌ Errors: ${errors} tenants`)
    console.log(`\n🎉 Migration complete!`)

    // Update module definitions if needed
    console.log('\n📝 Updating module definitions...')
    await prisma.moduleDefinition.updateMany({
      where: {
        moduleId: { in: ['invoicing', 'accounting'] },
      },
      data: {
        isActive: false,
      },
    })
    console.log('✅ Marked invoicing and accounting modules as inactive\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateFinanceModules()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

