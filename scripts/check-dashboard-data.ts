import { PrismaClient } from '@prisma/client'
import { getTimePeriodBounds } from '../lib/utils/crm-filters'

const prisma = new PrismaClient()

async function checkDashboardData() {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.log('❌ Tenant not found')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  })

  if (!user) {
    console.log('❌ User not found')
    process.exit(1)
  }

  console.log(`✅ Found tenant: ${tenant.name}`)
  console.log(`✅ Found user: ${user.name} (role: ${user.role})`)
  console.log('')

  // Check SalesRep
  const salesRep = await prisma.salesRep.findUnique({
    where: { userId: user.id },
  })
  console.log(`✅ SalesRep: ${salesRep ? salesRep.id : 'Not found'}`)
  console.log('')

  // Get current month period
  const periodBounds = getTimePeriodBounds('month')
  const periodStart = periodBounds.start
  const periodEnd = periodBounds.end

  console.log('📅 Current month period:')
  console.log(`   Start: ${periodStart.toISOString()}`)
  console.log(`   End: ${periodEnd.toISOString()}`)
  console.log('')

  // Check data with tenantId filter (owner should see all)
  const [totalContacts, totalDeals, contactsInPeriod, dealsInPeriod, wonDealsInPeriod] = await Promise.all([
    prisma.contact.count({ where: { tenantId: tenant.id } }),
    prisma.deal.count({ where: { tenantId: tenant.id } }),
    prisma.contact.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.deal.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.deal.findMany({
      where: {
        tenantId: tenant.id,
        stage: 'won',
        OR: [
          { actualCloseDate: { gte: periodStart, lte: periodEnd } },
          { updatedAt: { gte: periodStart, lte: periodEnd } },
          { createdAt: { gte: periodStart, lte: periodEnd } },
        ],
      },
      select: { id: true, value: true, actualCloseDate: true, updatedAt: true, createdAt: true },
    }),
  ])

  console.log('📊 Data with tenantId filter (owner view):')
  console.log(`   Total Contacts: ${totalContacts}`)
  console.log(`   Total Deals: ${totalDeals}`)
  console.log(`   Contacts in Period: ${contactsInPeriod}`)
  console.log(`   Deals in Period: ${dealsInPeriod}`)
  console.log(`   Won Deals in Period: ${wonDealsInPeriod.length}`)
  console.log(`   Revenue from Won Deals: ${wonDealsInPeriod.reduce((sum, d) => sum + d.value, 0)}`)
  console.log('')

  // Check with SalesRep filter (if user was a regular user)
  if (salesRep) {
    const [contactsWithSalesRep, dealsWithSalesRep] = await Promise.all([
      prisma.contact.count({
        where: {
          tenantId: tenant.id,
          assignedToId: salesRep.id,
        },
      }),
      prisma.deal.count({
        where: {
          tenantId: tenant.id,
          assignedToId: salesRep.id,
        },
      }),
    ])

    console.log('📊 Data with SalesRep filter:')
    console.log(`   Contacts assigned to SalesRep: ${contactsWithSalesRep}`)
    console.log(`   Deals assigned to SalesRep: ${dealsWithSalesRep}`)
    console.log('')
  }

  // Check lead sources
  const leadSources = await prisma.leadSource.findMany({
    where: { tenantId: tenant.id },
    take: 5,
  })
  console.log(`📊 Lead Sources: ${leadSources.length} found`)
  if (leadSources.length > 0) {
    leadSources.forEach((ls, i) => {
      console.log(`   ${i + 1}. ${ls.name}: ${ls.leadsCount} leads, ${ls.conversionsCount} conversions`)
    })
  }

  await prisma.$disconnect()
}

checkDashboardData().catch(console.error)
