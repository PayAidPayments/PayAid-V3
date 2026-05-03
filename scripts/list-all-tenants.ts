/**
 * List all tenants in the database
 * 
 * Usage:
 *   npx tsx scripts/list-all-tenants.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Listing all tenants in database...\n')

  try {
    const tenants = await prisma.tenant.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Found ${tenants.length} tenant(s):\n`)
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Subdomain: ${tenant.subdomain || 'N/A'}`)
      console.log(`   Licensed Modules: ${JSON.stringify(tenant.licensedModules || [])}`)
      console.log(`   Subscription: ${tenant.subscriptionTier || 'free'}`)
      console.log(`   Users:`)
      tenant.users.forEach((user) => {
        console.log(`     - ${user.email} (${user.role}) - User ID: ${user.id}`)
      })
      console.log('')
    })

    // Check for the specific IDs mentioned
    console.log('\n🔍 Checking specific tenant IDs:\n')
    
    const id1 = 'cmje860jf0000n79ra11wt93e'
    const id2 = 'cmj2gv5600000sg1aslv515yc'
    
    const tenant1 = await prisma.tenant.findUnique({
      where: { id: id1 },
      include: { users: true },
    })
    
    const tenant2 = await prisma.tenant.findUnique({
      where: { id: id2 },
      include: { users: true },
    })

    console.log(`Tenant ${id1}:`)
    console.log(`  ${tenant1 ? `✅ EXISTS - ${tenant1.name}` : '❌ NOT FOUND'}`)
    if (tenant1) {
      console.log(`  Users: ${tenant1.users.map(u => u.email).join(', ')}`)
    }

    console.log(`\nTenant ${id2}:`)
    console.log(`  ${tenant2 ? `✅ EXISTS - ${tenant2.name}` : '❌ NOT FOUND'}`)
    if (tenant2) {
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
