/**
 * Phase 1: Initialize Default Roles for Tenants
 * 
 * This script initializes default roles (Admin, Manager, User) for all existing tenants
 * or for a specific tenant.
 * 
 * Usage:
 *   npx tsx scripts/initialize-default-roles.ts                    # All tenants
 *   npx tsx scripts/initialize-default-roles.ts --tenant-id <id>   # Specific tenant
 */

import { prisma } from '../lib/db/prisma'
import { initializeDefaultRoles } from '../lib/rbac/roles'

async function main() {
  const args = process.argv.slice(2)
  const tenantIdIndex = args.indexOf('--tenant-id')
  const tenantId = tenantIdIndex >= 0 ? args[tenantIdIndex + 1] : null

  try {
    if (tenantId) {
      // Initialize for specific tenant
      console.log(`Initializing default roles for tenant: ${tenantId}`)
      
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      })

      if (!tenant) {
        console.error(`Tenant not found: ${tenantId}`)
        process.exit(1)
      }

      const roles = await initializeDefaultRoles(tenantId)
      console.log(`✅ Initialized ${roles.length} default roles for tenant: ${tenant.name}`)
      roles.forEach(role => {
        console.log(`   - ${role.roleName} (${role.roleType})`)
      })
    } else {
      // Initialize for all tenants
      console.log('Initializing default roles for all tenants...')
      
      const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true },
      })

      console.log(`Found ${tenants.length} tenants`)

      for (const tenant of tenants) {
        try {
          const roles = await initializeDefaultRoles(tenant.id)
          console.log(`✅ ${tenant.name}: Initialized ${roles.length} roles`)
        } catch (error) {
          console.error(`❌ ${tenant.name}: Failed to initialize roles`, error)
        }
      }

      console.log('\n✅ Default roles initialization complete!')
    }
  } catch (error) {
    console.error('Error initializing default roles:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
