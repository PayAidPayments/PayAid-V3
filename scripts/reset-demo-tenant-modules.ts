/**
 * Reset Demo Business Tenant Modules
 * 
 * This script resets the Demo Business tenant to have NO licensed modules
 * (or only specific modules for testing).
 * 
 * Usage:
 *   npx tsx scripts/reset-demo-tenant-modules.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetting Demo Business tenant modules...\n')

  try {
    // Find Demo Business tenant
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' },
    })

    if (!tenant) {
      console.error('❌ Demo Business tenant not found!')
      process.exit(1)
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`)
    console.log(`   Current licensed modules: ${JSON.stringify(tenant.licensedModules || [])}\n`)

    // Reset to NO modules (empty array)
    // Or uncomment below to grant only specific modules for testing:
    // const modulesToGrant = ['crm', 'invoicing'] // Only grant CRM and Invoicing
    
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        licensedModules: [], // Empty array = no modules licensed
        subscriptionTier: 'free',
      },
    })

    console.log(`✅ Successfully reset tenant modules`)
    console.log(`   New licensed modules: ${JSON.stringify(updated.licensedModules)}`)
    console.log(`   Subscription tier: ${updated.subscriptionTier}`)
    console.log(`\n⚠️  Note: Users will need to log out and log back in for changes to take effect`)
    console.log(`   (JWT tokens contain cached module licenses)`)
  } catch (error) {
    console.error('❌ Error resetting modules:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
