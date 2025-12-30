import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyNewsItems() {
  console.log('🔍 Verifying news items in database...\n')

  // Count all news items
  const total = await prisma.newsItem.count()
  console.log(`Total news items: ${total}`)

  // Count general news items
  const general = await prisma.newsItem.count({
    where: {
      tenantId: null,
      industry: 'all',
    },
  })
  console.log(`General news items (all tenants): ${general}`)

  // Count tenant-specific news items
  const tenantSpecific = await prisma.newsItem.count({
    where: {
      tenantId: { not: null },
    },
  })
  console.log(`Tenant-specific news items: ${tenantSpecific}`)

  // Count by category
  const categories = await prisma.newsItem.groupBy({
    by: ['category'],
    _count: true,
  })
  console.log('\nNews items by category:')
  categories.forEach((cat) => {
    console.log(`  ${cat.category}: ${cat._count}`)
  })

  // Count by urgency
  const urgencies = await prisma.newsItem.groupBy({
    by: ['urgency'],
    _count: true,
  })
  console.log('\nNews items by urgency:')
  urgencies.forEach((urg) => {
    console.log(`  ${urg.urgency}: ${urg._count}`)
  })

  // Check for dismissed items
  const dismissed = await prisma.newsItem.count({
    where: {
      isDismissed: true,
    },
  })
  console.log(`\nDismissed news items: ${dismissed}`)

  // Sample news items
  console.log('\n📰 Sample news items (first 5):')
  const samples = await prisma.newsItem.findMany({
    take: 5,
    select: {
      id: true,
      title: true,
      category: true,
      urgency: true,
      tenantId: true,
      industry: true,
      isDismissed: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  samples.forEach((item) => {
    console.log(`  - ${item.title}`)
    console.log(`    Category: ${item.category}, Urgency: ${item.urgency}`)
    console.log(`    Tenant: ${item.tenantId || 'null (general)'}, Industry: ${item.industry || 'null'}`)
    console.log(`    Dismissed: ${item.isDismissed}`)
    console.log('')
  })

  await prisma.$disconnect()
}

verifyNewsItems().catch(console.error)

