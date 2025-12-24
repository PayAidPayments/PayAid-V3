/**
 * Check for duplicate users and tenant assignments
 * 
 * Usage:
 *   npx tsx scripts/check-duplicate-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for duplicate users and tenant issues...\n')

  try {
    // Check for users with admin@demo.com
    const users = await prisma.user.findMany({
      where: { email: 'admin@demo.com' },
      include: { tenant: true },
    })

    console.log(`Found ${users.length} user(s) with email admin@demo.com:\n`)
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`)
      console.log(`  User ID: ${user.id}`)
      console.log(`  Tenant ID: ${user.tenantId}`)
      console.log(`  Tenant Name: ${user.tenant?.name || 'N/A'}`)
      console.log(`  Tenant Subdomain: ${user.tenant?.subdomain || 'N/A'}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log('')
    })

    // Check for Demo Business tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })

    console.log(`\nFound ${tenants.length} tenant(s) matching "Demo Business":\n`)
    
    tenants.forEach((tenant, index) => {
      console.log(`Tenant ${index + 1}:`)
      console.log(`  Tenant ID: ${tenant.id}`)
      console.log(`  Name: ${tenant.name}`)
      console.log(`  Subdomain: ${tenant.subdomain}`)
      console.log(`  Licensed Modules: ${JSON.stringify(tenant.licensedModules || [])}`)
      console.log(`  Subscription Tier: ${tenant.subscriptionTier || 'free'}`)
      console.log(`  Users (${tenant.users.length}):`)
      tenant.users.forEach((user) => {
        console.log(`    - ${user.email} (${user.role}) - User ID: ${user.id}`)
      })
      console.log('')
    })

    // Check for the specific tenant IDs mentioned
    const tenant1 = await prisma.tenant.findUnique({
      where: { id: 'cmje860jf0000n79ra11wt93e' },
      include: { users: true },
    })

    const tenant2 = await prisma.tenant.findUnique({
      where: { id: 'cmj2gv5600000sg1aslv515yc' },
      include: { users: true },
    })

    if (tenant1) {
      console.log(`\nTenant cmje860jf0000n79ra11wt93e (Chrome):`)
      console.log(`  Name: ${tenant1.name}`)
      console.log(`  Subdomain: ${tenant1.subdomain}`)
      console.log(`  Users: ${tenant1.users.map(u => u.email).join(', ')}`)
    }

    if (tenant2) {
      console.log(`\nTenant cmj2gv5600000sg1aslv515yc (Cursor):`)
      console.log(`  Name: ${tenant2.name}`)
      console.log(`  Subdomain: ${tenant2.subdomain}`)
      console.log(`  Users: ${tenant2.users.map(u => u.email).join(', ')}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
