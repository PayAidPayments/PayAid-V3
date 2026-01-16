/**
 * Verify Demo Business Modules
 * 
 * Usage:
 *   npx tsx scripts/verify-demo-modules.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying Demo Business modules...\n')

  try {
    // Find Demo Business tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
      include: {
        subscription: true,
      },
    })

    if (!tenant) {
      console.error('❌ Demo Business tenant not found!')
      process.exit(1)
    }

    console.log(`✅ Tenant: ${tenant.name}`)
    console.log(`   Tenant ID: ${tenant.id}`)
    console.log(`   Licensed modules (${tenant.licensedModules?.length || 0}): ${JSON.stringify(tenant.licensedModules || [])}`)
    console.log(`   Subscription tier: ${tenant.subscriptionTier}`)
    
    if (tenant.subscription) {
      const isInTrial = tenant.subscription.trialEndsAt 
        ? new Date(tenant.subscription.trialEndsAt) > new Date()
        : false;
      console.log(`   Trial ends at: ${tenant.subscription.trialEndsAt?.toLocaleDateString() || 'N/A'}`)
      console.log(`   Is in trial: ${isInTrial ? '✅ YES' : '❌ NO'}`)
    }

    // Check if productivity is licensed
    const hasProductivity = tenant.licensedModules?.includes('productivity') || false;
    console.log(`\n📦 Productivity Suite:`)
    console.log(`   Licensed: ${hasProductivity ? '✅ YES' : '❌ NO'}`)
    
    if (hasProductivity) {
      const productivityModules = ['spreadsheet', 'docs', 'drive', 'slides', 'meet', 'pdf'];
      console.log(`   Individual modules that should show (${productivityModules.length}):`)
      productivityModules.forEach(id => {
        console.log(`     - ${id}`)
      })
    }

    // Load modules config to verify
    const modulesConfig = await import('../lib/modules.config')
    const productivityModules = modulesConfig.modules.filter((m: any) => m.category === 'productivity')
    console.log(`\n📋 Productivity modules in config (${productivityModules.length}):`)
    productivityModules.forEach((m: any) => {
      console.log(`     - ${m.id}: ${m.name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

