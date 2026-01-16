/**
 * Quick Fix: Set Demo Business Industry
 * 
 * Usage:
 *   npx tsx scripts/fix-demo-industry.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Demo Business Industry...\n')

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

    // Update industry if not set
    if (!tenant.industry) {
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

      console.log(`\n✅ Successfully set Demo Business industry!`)
      console.log(`   Industry: ${updated.industry}`)
    } else {
      console.log(`\n✅ Demo Business already has industry set: ${tenant.industry}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

