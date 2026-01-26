/**
 * Initialize Default Roles for Vercel Production
 * 
 * This script connects to your production database (via DATABASE_URL)
 * and initializes default roles for all tenants or a specific tenant.
 * 
 * Usage:
 *   # For all tenants
 *   npx tsx scripts/initialize-roles-for-vercel.ts
 * 
 *   # For specific tenant
 *   npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id <id>
 * 
 * Prerequisites:
 *   - DATABASE_URL must point to production database
 *   - Migrations must have been run (RBAC tables exist)
 */

import { prisma } from '../lib/db/prisma'
import { initializeDefaultRoles } from '../lib/rbac/roles'

async function main() {
  const args = process.argv.slice(2)
  const tenantIdIndex = args.indexOf('--tenant-id')
  const tenantId = tenantIdIndex >= 0 ? args[tenantIdIndex + 1] : null

  // Check database connection
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.error('   Set it to your production database URL')
    process.exit(1)
  }

  console.log('🔗 Connecting to database...')
  console.log(`   Database: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`)
  console.log('')

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    console.log('')

    if (tenantId) {
      // Initialize for specific tenant
      console.log(`📦 Initializing roles for tenant: ${tenantId}`)
      
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      })

      if (!tenant) {
        console.error(`❌ Tenant not found: ${tenantId}`)
        process.exit(1)
      }

      console.log(`✅ Tenant found: ${tenant.name}`)
      console.log('')

      const roles = await initializeDefaultRoles(tenantId)
      
      console.log(`✅ Successfully initialized ${roles.length} default roles:`)
      roles.forEach(role => {
        console.log(`   - ${role.roleName} (${role.roleType})`)
      })
      
    } else {
      // Initialize for all tenants
      console.log('📦 Initializing roles for all tenants...')
      console.log('')

      const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })

      if (tenants.length === 0) {
        console.log('⚠️  No tenants found in database')
        process.exit(0)
      }

      console.log(`Found ${tenants.length} tenant(s)`)
      console.log('')

      let successCount = 0
      let errorCount = 0

      for (const tenant of tenants) {
        try {
          console.log(`Processing: ${tenant.name} (${tenant.id})`)
          
          const roles = await initializeDefaultRoles(tenant.id)
          
          console.log(`   ✅ Initialized ${roles.length} roles`)
          successCount++
        } catch (error) {
          console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
          errorCount++
        }
        console.log('')
      }

      console.log('📊 Summary:')
      console.log(`   ✅ Success: ${successCount}`)
      if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`)
      }
    }

    console.log('')
    console.log('✅ Role initialization complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. Test login to verify RBAC is working')
    console.log('   2. Assign roles to users via API or database')
    console.log('   3. Check JWT tokens contain roles/permissions')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('does not exist') || error.message.includes('P2021')) {
        console.error('')
        console.error('⚠️  RBAC tables do not exist!')
        console.error('   Run migrations first:')
        console.error('   - Via Vercel build command (prisma migrate deploy)')
        console.error('   - Or manually via Supabase Dashboard SQL Editor')
        console.error('')
      }
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
