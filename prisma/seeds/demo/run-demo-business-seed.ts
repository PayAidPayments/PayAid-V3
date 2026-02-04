/**
 * CLI Entry Point for Demo Business Seeding
 * Usage: npx tsx prisma/seeds/demo/run-demo-business-seed.ts
 */

import { seedDemoBusiness } from './demo-business-master-seed'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const demoBusinessId = process.env.DEMO_BUSINESS_ID // Optional: can specify tenant ID
  await seedDemoBusiness(demoBusinessId)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
