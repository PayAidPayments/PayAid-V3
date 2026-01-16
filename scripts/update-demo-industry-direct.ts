/**
 * Update Demo Business Industry to Service Business
 * Direct database update using Prisma
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating Demo Business industry to: service-business\n')

  try {
    // Find Demo Business tenant
    const tenant = await prisma.$queryRaw`
      SELECT id, name, subdomain, industry 
      FROM "Tenant" 
      WHERE "subdomain" = 'demo' OR "name" ILIKE '%Demo Business%'
      LIMIT 1
    ` as any[]

    if (!tenant || tenant.length === 0) {
      console.error('❌ Demo Business tenant not found!')
      process.exit(1)
    }

    const foundTenant = tenant[0]
    console.log(`✅ Found tenant: ${foundTenant.name}`)
    console.log(`   Current industry: ${foundTenant.industry || 'NOT SET'}`)

    // Update using raw SQL to avoid schema issues
    await prisma.$executeRaw`
      UPDATE "Tenant" 
      SET 
        "industry" = 'service-business',
        "industrySubType" = NULL
      WHERE 
        "subdomain" = 'demo' 
        OR "name" ILIKE '%Demo Business%'
    `

    // Verify the update
    const updated = await prisma.$queryRaw`
      SELECT id, name, subdomain, industry, "industrySubType"
      FROM "Tenant"
      WHERE "subdomain" = 'demo' OR "name" ILIKE '%Demo Business%'
      LIMIT 1
    ` as any[]

    if (updated && updated.length > 0) {
      const result = updated[0]
      console.log(`\n✅ Successfully updated Demo Business industry!`)
      console.log(`   Tenant: ${result.name}`)
      console.log(`   Subdomain: ${result.subdomain}`)
      console.log(`   Industry: ${result.industry}`)
      console.log(`   Industry Sub-Type: ${result.industrySubType || 'N/A'}`)
      console.log(`\n💡 Demo Business is now configured as: Service Businesses`)
      console.log(`   You can view it at: /industries/service-business`)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

