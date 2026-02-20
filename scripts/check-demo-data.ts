import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDemoData() {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.log('❌ Tenant not found')
    process.exit(1)
  }

  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`)
  console.log('')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  console.log('📅 Current month range:')
  console.log(`   Start: ${startOfMonth.toISOString()}`)
  console.log(`   End: ${endOfMonth.toISOString()}`)
  console.log('')

  // Check data in current month
  const [dealsThisMonth, contactsThisMonth, tasksThisMonth, ordersThisMonth] = await Promise.all([
    prisma.deal.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.contact.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.task.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.order.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ])

  console.log('📊 Data in current month (Feb 2026):')
  console.log(`   Deals: ${dealsThisMonth}`)
  console.log(`   Contacts: ${contactsThisMonth}`)
  console.log(`   Tasks: ${tasksThisMonth}`)
  console.log(`   Orders: ${ordersThisMonth}`)
  console.log('')

  // Check total data
  const [totalDeals, totalContacts, totalTasks, totalOrders] = await Promise.all([
    prisma.deal.count({ where: { tenantId: tenant.id } }),
    prisma.contact.count({ where: { tenantId: tenant.id } }),
    prisma.task.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({ where: { tenantId: tenant.id } }),
  ])

  console.log('📊 Total data (Mar 2025 - Feb 2026):')
  console.log(`   Deals: ${totalDeals}`)
  console.log(`   Contacts: ${totalContacts}`)
  console.log(`   Tasks: ${totalTasks}`)
  console.log(`   Orders: ${totalOrders}`)
  console.log('')

  // Check sample dates
  const sampleDeal = await prisma.deal.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, stage: true },
  })

  const sampleContact = await prisma.contact.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, stage: true },
  })

  console.log('📋 Sample records:')
  if (sampleDeal) {
    console.log(`   Latest Deal: ${sampleDeal.name} - Created: ${sampleDeal.createdAt.toISOString()} - Stage: ${sampleDeal.stage}`)
  }
  if (sampleContact) {
    console.log(`   Latest Contact: ${sampleContact.name} - Created: ${sampleContact.createdAt.toISOString()} - Stage: ${sampleContact.stage}`)
  }

  await prisma.$disconnect()
}

checkDemoData().catch(console.error)
