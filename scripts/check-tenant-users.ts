/**
 * Check users for a tenant
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.argv[2]
  
  if (!tenantId) {
    // List all tenants
    console.log('Listing all tenants:\n')
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
      take: 20,
    })

    tenants.forEach((tenant, idx) => {
      console.log(`${idx + 1}. ${tenant.name}`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Status: ${tenant.status}\n`)
    })
    return
  }
  
  console.log(`Checking users for tenant: ${tenantId}\n`)

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      },
    },
  })

  if (!tenant) {
    console.error(`❌ Tenant not found: ${tenantId}`)
    console.log('\nListing available tenants:')
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true },
      take: 10,
    })
    tenants.forEach(t => console.log(`  ${t.name}: ${t.id}`))
    return
  }

  console.log(`Tenant: ${tenant.name}`)
  console.log(`Users: ${tenant.users.length}\n`)

  if (tenant.users.length === 0) {
    console.log('⚠️  No users found for this tenant')
    console.log('\nTo create a user, you can:')
    console.log('1. Use the registration endpoint: POST /api/auth/register')
    console.log('2. Or create via Prisma directly')
  } else {
    console.log('Users:')
    tenant.users.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.email} (${user.role}) - ${user.name || 'No name'}`)
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
