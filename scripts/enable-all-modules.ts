/**
 * Script to enable all modules for existing tenants
 * 
 * Usage:
 *   npx tsx scripts/enable-all-modules.ts
 * 
 * This script enables all 8 modules for all existing tenants in the database.
 * Useful for development/testing or when migrating existing tenants.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ALL_MODULES = [
  'crm',
  'sales',
  'marketing',
  'finance',
  'hr',
  'communication',
  'ai-studio',
  'analytics',
]

async function enableAllModules() {
  try {
    console.log('🚀 Starting module activation for all tenants...\n')

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        licensedModules: true,
      },
    })

    console.log(`Found ${tenants.length} tenant(s)\n`)

    if (tenants.length === 0) {
      console.log('No tenants found. Nothing to update.')
      return
    }

    // Update each tenant
    let updated = 0
    for (const tenant of tenants) {
      const currentModules = tenant.licensedModules || []
      const missingModules = ALL_MODULES.filter(
        (m) => !currentModules.includes(m)
      )

      if (missingModules.length === 0) {
        console.log(
          `✓ ${tenant.name} (${tenant.id}) - Already has all modules`
        )
        continue
      }

      const newModules = [...new Set([...currentModules, ...ALL_MODULES])]

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          licensedModules: newModules,
          subscriptionTier: 'professional', // Upgrade to professional tier
        },
      })

      console.log(
        `✓ ${tenant.name} (${tenant.id}) - Enabled modules: ${missingModules.join(', ')}`
      )
      updated++
    }

    console.log(`\n✅ Successfully updated ${updated} tenant(s)`)
    console.log(
      `\n📝 Note: Users need to log out and log back in for changes to take effect (JWT token needs to be refreshed).`
    )
  } catch (error) {
    console.error('❌ Error enabling modules:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
enableAllModules()

