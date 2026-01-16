import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed CRM Revenue Data
 * Creates sample deals with 'won' status to generate revenue for CRM dashboard
 */
async function seedCRMRevenue() {
  console.log('🌱 Seeding CRM revenue data...\n')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  const tenantId = tenant.id
  console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`)

  // Get existing contacts for deals
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    take: 20,
  })

  if (contacts.length === 0) {
    console.error('❌ No contacts found. Please run the main seed script first.')
    process.exit(1)
  }

  // Get existing users for deal owners
  const users = await prisma.user.findMany({
    where: { tenantId },
    take: 5,
  })

  const userId = users[0]?.id || null

  // Create dates for this month and previous months
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  // Sample won deals with revenue for this month
  const wonDealsThisMonth = [
    { value: 150000, name: 'Enterprise Software License', contactIdx: 0, date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { value: 85000, name: 'Marketing Campaign Package', contactIdx: 1, date: new Date(now.getFullYear(), now.getMonth(), 10) },
    { value: 200000, name: 'Custom Development Project', contactIdx: 2, date: new Date(now.getFullYear(), now.getMonth(), 15) },
    { value: 120000, name: 'Annual Support Contract', contactIdx: 3, date: new Date(now.getFullYear(), now.getMonth(), 20) },
    { value: 95000, name: 'Training & Consulting', contactIdx: 4, date: new Date(now.getFullYear(), now.getMonth(), 25) },
  ]

  // Sample won deals for last month
  const wonDealsLastMonth = [
    { value: 180000, name: 'Premium Software Package', contactIdx: 5, date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 8) },
    { value: 110000, name: 'Digital Transformation Project', contactIdx: 6, date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15) },
    { value: 75000, name: 'Integration Services', contactIdx: 7, date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 22) },
  ]

  // Sample won deals for two months ago
  const wonDealsTwoMonthsAgo = [
    { value: 220000, name: 'Enterprise Solution', contactIdx: 8, date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 10) },
    { value: 140000, name: 'Cloud Migration Project', contactIdx: 9, date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 18) },
  ]

  // Create all won deals
  const allWonDeals = [
    ...wonDealsThisMonth.map(d => ({ ...d, month: 'this' })),
    ...wonDealsLastMonth.map(d => ({ ...d, month: 'last' })),
    ...wonDealsTwoMonthsAgo.map(d => ({ ...d, month: 'two' })),
  ]

  console.log('📊 Creating won deals for revenue...')

  let created = 0
  for (const deal of allWonDeals) {
    const contact = contacts[deal.contactIdx % contacts.length]
    
    // Check if deal already exists (by name and contact)
    const existing = await prisma.deal.findFirst({
      where: {
        tenantId,
        name: deal.name,
        contactId: contact.id,
        stage: 'won',
      },
    })

    if (!existing) {
      await prisma.deal.create({
        data: {
          tenantId,
          name: deal.name,
          contactId: contact.id,
          ownerId: userId,
          value: deal.value,
          stage: 'won',
          probability: 100,
          expectedCloseDate: deal.date,
          actualCloseDate: deal.date,
          status: 'won',
          createdAt: deal.date,
          updatedAt: deal.date,
        },
      })
      created++
    }
  }

  console.log(`✅ Created ${created} won deals\n`)

  // Calculate total revenue
  const totalRevenue = allWonDeals.reduce((sum, d) => sum + d.value, 0)
  const thisMonthRevenue = wonDealsThisMonth.reduce((sum, d) => sum + d.value, 0)

  console.log(`💰 Revenue Summary:`)
  console.log(`   This Month: ₹${thisMonthRevenue.toLocaleString('en-IN')}`)
  console.log(`   Total: ₹${totalRevenue.toLocaleString('en-IN')}\n`)

  console.log('✅ CRM revenue data seeded successfully!')
}

seedCRMRevenue()
  .catch((e) => {
    console.error('❌ Error seeding CRM revenue:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

