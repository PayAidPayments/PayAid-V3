/**
 * Assign All Modules to Demo Business Tenant
 * 
 * Usage:
 *   npx tsx scripts/assign-all-modules-to-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Assigning all modules to Demo Business tenant...\n')

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

    console.log(`✅ Found tenant: ${tenant.name}`)
    console.log(`   Tenant ID: ${tenant.id}`)
    console.log(`   Current licensed modules: ${JSON.stringify(tenant.licensedModules || [])}`)

    // Get all available modules from config
    const modulesConfig = await import('../lib/modules.config')
    const allModules = modulesConfig.modules.filter((m: any) => m.category !== 'industry')
    
    // Get all module IDs (excluding industries and deprecated modules)
    const allModuleIds = allModules
      .filter((m: any) => m.status !== 'deprecated')
      .map((m: any) => m.id)

    // For demo/testing: Assign ALL modules including individual productivity tools
    // This ensures all 20 modules are available for testing
    const licensedModules = [
      ...allModuleIds.filter((id: string) => 
        // Keep all modules except individual productivity tools (we'll add productivity suite)
        !['spreadsheet', 'docs', 'drive', 'slides', 'meet'].includes(id)
      ),
      'productivity', // Add productivity suite (includes all individual productivity tools)
      // Also add individual productivity tools for complete testing
      'spreadsheet',
      'docs',
      'drive',
      'slides',
      'meet',
    ]

    console.log(`\n📦 Modules to assign (${licensedModules.length} modules):`)
    console.log(`   ${licensedModules.join(', ')}`)

    // Update tenant with all modules
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        licensedModules: licensedModules,
        subscriptionTier: 'professional',
      },
    })

    // Update or create subscription
    const trialEndDate = new Date()
    trialEndDate.setMonth(trialEndDate.getMonth() + 1) // 1 month trial

    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: {
        modules: licensedModules,
        tier: 'professional',
        trialEndsAt: trialEndDate,
        status: 'active',
      },
      create: {
        tenantId: tenant.id,
        modules: licensedModules,
        tier: 'professional',
        monthlyPrice: 0,
        billingCycleStart: new Date(),
        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        trialEndsAt: trialEndDate,
      },
    })

    console.log(`\n✅ Successfully assigned all modules to Demo Business!`)
    console.log(`   Licensed modules: ${updated.licensedModules.length} modules`)
    console.log(`   Subscription tier: ${updated.subscriptionTier}`)
    console.log(`   Trial ends at: ${trialEndDate.toLocaleDateString()}`)
    console.log(`\n💡 Productivity Suite includes: spreadsheet, docs, drive, slides, meet, pdf`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

