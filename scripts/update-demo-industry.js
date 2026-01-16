/**
 * Update Demo Business Industry to Service Business
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating Demo Business industry to: service-business\n')

  try {
    // Find Demo Business tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
    })

    if (!tenant) {
      console.error('❌ Demo Business tenant not found!')
      process.exit(1)
    }

    console.log(`✅ Found tenant: ${tenant.name}`)
    console.log(`   Current industry: ${tenant.industry || 'NOT SET'}`)

    // Update industry
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        industry: 'service-business',
        industrySubType: null,
        industrySettings: {
          setForDemo: true,
          setAt: new Date().toISOString(),
        },
      },
    })

    console.log(`\n✅ Successfully updated Demo Business industry!`)
    console.log(`   Tenant: ${updated.name}`)
    console.log(`   Industry: ${updated.industry}`)
    console.log(`   Subdomain: ${updated.subdomain}`)
    console.log(`\n💡 Demo Business is now configured as: Service Businesses`)
    console.log(`   You can view it at: /industries/service-business`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

