/**
 * Migration Script: V1 (6 modules) → V2 (8 modules)
 * 
 * This script migrates existing tenant licenses from the old 6-module structure
 * to the new 8-module structure.
 * 
 * Migration Rules:
 * - invoicing → finance
 * - accounting → finance
 * - whatsapp → marketing + communication
 * - crm → crm (unchanged, but scope reduced)
 * - hr → hr (unchanged)
 * - analytics → analytics (unchanged, but renamed)
 * 
 * Usage:
 *   npx tsx scripts/migrate-modules-v1-to-v2.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Map old module IDs to new module IDs
 */
const moduleMigrationMap: Record<string, string[]> = {
  'invoicing': ['finance'],
  'accounting': ['finance'],
  'whatsapp': ['marketing', 'communication'],
  'crm': ['crm'], // Unchanged
  'hr': ['hr'], // Unchanged
  'analytics': ['analytics'], // Unchanged (but renamed)
}

async function migrateTenantLicenses() {
  console.log('🔄 Migrating tenant licenses from V1 to V2...\n')

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        licensedModules: true,
      },
    })

    console.log(`Found ${tenants.length} tenants to migrate\n`)

    let migratedCount = 0
    let skippedCount = 0

    for (const tenant of tenants) {
      const oldModules = tenant.licensedModules || []
      const newModules: string[] = []
      const modulesToAdd = new Set<string>()

      // Migrate each old module to new module(s)
      for (const oldModule of oldModules) {
        const newModuleIds = moduleMigrationMap[oldModule]
        
        if (newModuleIds) {
          // Add all new modules for this old module
          newModuleIds.forEach(moduleId => modulesToAdd.add(moduleId))
        } else {
          // Unknown module - keep it (might be a custom module)
          console.warn(`  ⚠️  Unknown module: ${oldModule} (keeping as-is)`)
          modulesToAdd.add(oldModule)
        }
      }

      // Convert set to array
      const finalModules = Array.from(modulesToAdd)

      // Check if migration is needed
      const modulesChanged = 
        oldModules.length !== finalModules.length ||
        !oldModules.every(m => finalModules.includes(m)) ||
        !finalModules.every(m => oldModules.includes(m))

      if (modulesChanged) {
        // Update tenant
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            licensedModules: finalModules,
          },
        })

        console.log(`  ✅ ${tenant.name}:`)
        console.log(`     Old: [${oldModules.join(', ')}]`)
        console.log(`     New: [${finalModules.join(', ')}]`)
        
        migratedCount++
      } else {
        console.log(`  ⏭️  ${tenant.name}: No changes needed`)
        skippedCount++
      }
    }

    console.log(`\n✅ Migration complete!`)
    console.log(`   Migrated: ${migratedCount} tenants`)
    console.log(`   Skipped: ${skippedCount} tenants`)
  } catch (error) {
    console.error('❌ Error migrating tenant licenses:', error)
    throw error
  }
}

async function main() {
  try {
    await migrateTenantLicenses()
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
