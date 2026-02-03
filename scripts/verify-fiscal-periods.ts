/**
 * Verify Fiscal Periods Exist
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.argv[2] || 'cmjimytmb0000snopu3p8h3b9'
  const fiscalYear = parseInt(process.argv[3]) || 2026

  console.log(`Checking fiscal periods for tenant: ${tenantId}`)
  console.log(`Fiscal Year: ${fiscalYear}\n`)

  const periods = await prisma.financialPeriod.findMany({
    where: {
      tenantId,
      fiscalYear,
    },
    orderBy: {
      fiscalMonth: 'asc',
    },
  })

  console.log(`Found ${periods.length} periods:`)
  periods.forEach(p => {
    console.log(`  Month ${p.fiscalMonth}: ${p.monthName} (${p.periodStartDate.toISOString().split('T')[0]} to ${p.periodEndDate.toISOString().split('T')[0]})`)
  })

  if (periods.length === 0) {
    console.log('\n❌ No periods found!')
  } else if (periods.length < 12) {
    console.log(`\n⚠️  Only ${periods.length} periods found (expected 12)`)
  } else {
    console.log('\n✅ All 12 periods exist')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
