/**
 * Set Demo Business Industry
 * 
 * Usage:
 *   npx tsx scripts/set-demo-industry.ts [industry-id]
 * 
 * Examples:
 *   npx tsx scripts/set-demo-industry.ts service-business
 *   npx tsx scripts/set-demo-industry.ts professional-services
 *   npx tsx scripts/set-demo-industry.ts retail
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VALID_INDUSTRIES = [
  'service-business',
  'professional-services',
  'freelancer',
  'retail',
  'restaurant',
  'manufacturing',
  'ecommerce',
  'healthcare',
  'education',
  'real-estate',
  'logistics',
  'construction',
  'beauty',
  'automotive',
  'hospitality',
  'legal',
  'financial-services',
  'events',
  'wholesale',
  'agriculture',
]

async function main() {
  const industryId = process.argv[2]

  if (!industryId) {
    console.log('❌ Please provide an industry ID')
    console.log('\nUsage: npx tsx scripts/set-demo-industry.ts [industry-id]')
    console.log('\nValid industries:')
    VALID_INDUSTRIES.forEach((id) => console.log(`  - ${id}`))
    process.exit(1)
  }

  if (!VALID_INDUSTRIES.includes(industryId)) {
    console.log(`❌ Invalid industry: ${industryId}`)
    console.log('\nValid industries:')
    VALID_INDUSTRIES.forEach((id) => console.log(`  - ${id}`))
    process.exit(1)
  }

  console.log(`🔄 Setting Demo Business industry to: ${industryId}\n`)

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

    // Update industry
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        industry: industryId,
        industrySubType: null,
        industrySettings: {
          setForDemo: true,
          setAt: new Date().toISOString(),
        },
      },
    })

    console.log(`✅ Successfully updated Demo Business industry!`)
    console.log(`   Tenant: ${updated.name}`)
    console.log(`   Industry: ${updated.industry}`)
    console.log(`   Subdomain: ${updated.subdomain}`)
    console.log(`\n💡 You can now view the demo at: /industries/${industryId}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

