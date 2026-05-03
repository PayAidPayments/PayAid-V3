/**
 * Activate all modules and features for Demo Business Private Limited and admin@demo.com
 *
 * Usage:
 *   npx tsx scripts/activate-demo-all-modules.ts
 *
 * - Finds tenant by name "Demo Business Private Limited" (or containing "Demo Business") or subdomain "demo"
 * - Finds user admin@demo.com and ensures they are admin/owner
 * - Sets tenant: all licensed modules, enterprise tier, high limits, onboarding completed
 */

import { PrismaClient } from '@prisma/client'
import {
  TIER_1_MODULES,
  TIER_2_MODULES,
  TIER_3_MODULES,
  TIER_4_MODULES,
  TIER_5_MODULES,
  TIER_6_MODULES,
} from '../lib/modules/module-tiers'

const prisma = new PrismaClient()

const DEMO_TENANT_NAMES = ['Demo Business Private Limited', 'Demo Business']
const DEMO_USER_EMAIL = 'admin@demo.com'

/** All module IDs used for licensing (from tiers + ai-studio for API checks) */
function getAllModuleIds(): string[] {
  const fromTiers = [
    ...TIER_1_MODULES,
    ...TIER_2_MODULES,
    ...TIER_3_MODULES,
    ...TIER_4_MODULES,
    ...TIER_5_MODULES,
    ...TIER_6_MODULES,
  ]
  const extra = ['ai-studio', 'accounting', 'invoicing', 'whatsapp', 'productivity', 'reports', 'marketplace', 'service']
  const unique = [...new Set([...fromTiers, ...extra])]
  return unique.filter((id) => id && id !== 'home') // home is UI-only, not a licensed module in API
}

async function main() {
  console.log('Activating all modules and features for Demo Business and admin@demo.com\n')

  const allModuleIds = getAllModuleIds()
  console.log(`Module list (${allModuleIds.length}): ${allModuleIds.join(', ')}\n`)

  // 1. Find tenant: by name or subdomain, or by user admin@demo.com
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { name: { equals: 'Demo Business Private Limited', mode: 'insensitive' } },
        { name: { contains: 'Demo Business', mode: 'insensitive' } },
        { subdomain: { equals: 'demo', mode: 'insensitive' } },
      ],
    },
    include: { subscription: true },
  })

  if (!tenant) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      include: { tenant: true },
    })
    if (userByEmail?.tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { id: userByEmail.tenantId },
        include: { subscription: true },
      }) as typeof tenant
    }
  }

  if (!tenant) {
    console.error('Demo tenant not found. Create a tenant named "Demo Business Private Limited" (or containing "Demo Business") or with subdomain "demo", or ensure user admin@demo.com exists and has a tenant.')
    process.exit(1)
  }

  console.log(`Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`  Current licensedModules: ${(tenant.licensedModules || []).length}`)
  console.log(`  Current subscriptionTier: ${tenant.subscriptionTier}`)

  // 2. Update tenant: all modules, enterprise tier, high limits
  const updatedTenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      licensedModules: allModuleIds,
      subscriptionTier: 'enterprise',
      plan: 'enterprise',
      status: 'active',
      onboardingCompleted: true,
      maxContacts: 10000,
      maxInvoices: 5000,
      maxUsers: 100,
      maxStorage: 10240, // 10GB in MB
    },
  })

  console.log(`\nTenant updated:`)
  console.log(`  licensedModules: ${updatedTenant.licensedModules.length}`)
  console.log(`  subscriptionTier: ${updatedTenant.subscriptionTier}`)
  console.log(`  plan: ${updatedTenant.plan}`)
  console.log(`  maxContacts: ${updatedTenant.maxContacts}, maxInvoices: ${updatedTenant.maxInvoices}, maxUsers: ${updatedTenant.maxUsers}`)

  // 3. Subscription record
  const trialEnd = new Date()
  trialEnd.setFullYear(trialEnd.getFullYear() + 1)
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {
      modules: allModuleIds,
      tier: 'enterprise',
      status: 'active',
      trialEndsAt: trialEnd,
    },
    create: {
      tenantId: tenant.id,
      modules: allModuleIds,
      tier: 'enterprise',
      monthlyPrice: 0,
      billingCycleStart: new Date(),
      billingCycleEnd: trialEnd,
      status: 'active',
      trialEndsAt: trialEnd,
    },
  })
  console.log(`  Subscription: enterprise, active, trial to ${trialEnd.toLocaleDateString()}`)

  // 4. Ensure admin@demo.com exists and is admin/owner for this tenant
  let user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: { tenant: true },
  })

  if (user) {
    if (user.tenantId !== tenant.id) {
      console.log(`\nUser ${DEMO_USER_EMAIL} exists but belongs to another tenant (${user.tenantId}). Moving to demo tenant.`)
      await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      })
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' },
      })
      console.log(`  User ${DEMO_USER_EMAIL}: role set to admin.`)
    } else {
      console.log(`\nUser ${DEMO_USER_EMAIL}: already admin/owner for this tenant.`)
    }
  } else {
    console.log(`\nUser ${DEMO_USER_EMAIL} not found. Create this user and assign to tenant ${tenant.id} for full demo access.`)
  }

  console.log('\nDone. Have the user log out and log back in so the JWT gets the new licensedModules and subscriptionTier.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
