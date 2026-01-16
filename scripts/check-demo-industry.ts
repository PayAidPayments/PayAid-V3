/**
 * Check Demo Business Industry
 * 
 * Usage:
 *   npx tsx scripts/check-demo-industry.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Demo Business Industry...\n')

  try {
    // Find Demo Business tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        industry: true,
        industrySubType: true,
        industrySettings: true,
      },
    })

    if (!tenant) {
      console.error('❌ Demo Business tenant not found!')
      process.exit(1)
    }

    console.log(`✅ Found tenant: ${tenant.name}`)
    console.log(`   Tenant ID: ${tenant.id}`)
    console.log(`   Subdomain: ${tenant.subdomain}`)
    console.log(`   Industry: ${tenant.industry || '❌ NOT SET'}`)
    console.log(`   Industry Sub-Type: ${tenant.industrySubType || 'N/A'}`)
    console.log(`   Industry Settings: ${JSON.stringify(tenant.industrySettings || {}, null, 2)}`)

    if (!tenant.industry) {
      console.log('\n⚠️  Industry is not set!')
      console.log('💡 Recommended industries for demo:')
      console.log('   1. service-business - Best for general business demo')
      console.log('   2. professional-services - Good for consulting/agency demo')
      console.log('   3. retail - If showing POS/inventory features')
      console.log('   4. restaurant - If showing restaurant-specific features')
    } else {
      console.log(`\n✅ Industry is set to: ${tenant.industry}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

