/**
 * Initialize Default Roles via API
 * 
 * This creates an API endpoint that can be called to initialize roles for a tenant.
 * 
 * Usage:
 *   POST /api/admin/initialize-roles
 *   Body: { tenantId: "tenant-id" }
 * 
 * Or run directly:
 *   npx tsx scripts/initialize-roles-api.ts --tenant-id <id>
 */

import { prisma } from '../lib/db/prisma'
import { initializeDefaultRoles } from '../lib/rbac/roles'

async function main() {
  const args = process.argv.slice(2)
  const tenantIdIndex = args.indexOf('--tenant-id')
  const tenantId = tenantIdIndex >= 0 ? args[tenantIdIndex + 1] : null

  if (!tenantId) {
    console.error('Usage: npx tsx scripts/initialize-roles-api.ts --tenant-id <id>')
    console.error('Or call POST /api/admin/initialize-roles with { tenantId }')
    process.exit(1)
  }

  try {
    console.log(`Initializing default roles for tenant: ${tenantId}`)
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    })

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`)
      process.exit(1)
    }

    console.log(`✅ Tenant found: ${tenant.name}`)
    
    const roles = await initializeDefaultRoles(tenantId)
    
    console.log(`\n✅ Successfully initialized ${roles.length} default roles:`)
    roles.forEach(role => {
      console.log(`   - ${role.roleName} (${role.roleType}) - ID: ${role.id}`)
    })
    
    console.log(`\n📝 Next steps:`)
    console.log(`   1. Assign roles to users via API or database`)
    console.log(`   2. Test login to verify RBAC is working`)
    console.log(`   3. Check JWT token contains roles/permissions`)
    
  } catch (error) {
    console.error('❌ Error initializing roles:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
