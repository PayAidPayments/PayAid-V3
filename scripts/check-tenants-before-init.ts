/**
 * Check Tenants Before Initializing Roles
 * 
 * This script lists all tenants so you can see which ones need roles initialized.
 * 
 * Usage:
 *   npx tsx scripts/check-tenants-before-init.ts
 */

import { prisma } from '../lib/db/prisma'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  console.log('🔗 Connecting to database...')
  console.log('')

  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    console.log('')

    // Check if RBAC tables exist
    try {
      const roleCount = await prisma.role.count()
      console.log(`✅ RBAC tables exist (${roleCount} roles found)`)
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.error('❌ RBAC tables do not exist!')
        console.error('   Wait for Vercel deployment to complete (migrations need to run)')
        console.error('   Or run migrations manually via Supabase Dashboard SQL Editor')
        process.exit(1)
      }
      throw error
    }

    console.log('')
    console.log('📋 Listing all tenants:')
    console.log('')

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    if (tenants.length === 0) {
      console.log('⚠️  No tenants found in database')
      process.exit(0)
    }

    console.log(`Found ${tenants.length} tenant(s):`)
    console.log('')

    for (const tenant of tenants) {
      // Check if roles already exist for this tenant
      const existingRoles = await prisma.role.count({
        where: { tenantId: tenant.id },
      })

      const status = existingRoles > 0 ? '✅ Has roles' : '⚠️  No roles'
      
      console.log(`${status} - ${tenant.name}`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Subdomain: ${tenant.subdomain || 'N/A'}`)
      console.log(`   Status: ${tenant.status}`)
      console.log(`   Roles: ${existingRoles}`)
      console.log('')

      if (existingRoles === 0) {
        console.log(`   💡 To initialize: npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id ${tenant.id}`)
        console.log('')
      }
    }

    console.log('')
    console.log('📝 Next steps:')
    console.log('   To initialize roles for all tenants:')
    console.log('   npx tsx scripts/initialize-roles-for-vercel.ts')
    console.log('')
    console.log('   To initialize for specific tenant:')
    console.log('   npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id <id>')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
