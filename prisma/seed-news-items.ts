import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed News Items - Industry Intelligence Dashboard
 * Standalone script to seed news items for all tenants
 */
async function seedNewsItems() {
  console.log('🌱 Starting news items seeding...\n')

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, industry: true, name: true },
  })

  if (tenants.length === 0) {
    console.log('⚠️  No tenants found. Please create a tenant first.')
    process.exit(1)
  }

  console.log(`✅ Found ${tenants.length} tenant(s)\n`)

  const now = new Date()

  for (const tenant of tenants) {
    console.log(`📰 Seeding news for ${tenant.name} (${tenant.industry || 'all'})...`)

    const sampleNews = [
      // Critical News
      {
        title: 'GST Rate Reduced on Food Services: 5% → 0%',
        summary: 'Government announces GST reduction on food services effective February 1, 2026',
        description: 'The government has announced a reduction in GST rates on food services from 5% to 0%, effective February 1, 2026. This applies to all restaurants and food service establishments.',
        source: 'government',
        category: 'government-alerts',
        urgency: 'critical',
        icon: '🔴',
        industry: tenant.industry === 'restaurant' ? 'restaurant' : 'all',
        businessImpact: {
          what: 'GST on food services reduced from 5% to 0%',
          when: 'Effective February 1, 2026',
          where: 'All of India',
          who: 'Affects your business',
          impact: 'Your margins improve 5% on each item',
          opportunity: 'Can improve profitability or cut prices to gain market share',
        },
        recommendedActions: [
          { action: 'Calculate new pricing (impact analysis)', priority: 'high', deadline: '2026-01-25' },
          { action: 'Update POS system with new GST rates', priority: 'high', deadline: '2026-01-30' },
          { action: 'Review competitor pricing strategy', priority: 'medium', deadline: '2026-02-05' },
        ],
        sourceName: 'GST Portal',
        sourceUrl: 'https://www.gst.gov.in',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        tags: ['gst', 'tax', 'government', 'pricing'],
      },
      {
        title: 'New Labor Law Update: Minimum Wage Increased',
        summary: 'State government announces 8% increase in minimum wage effective March 2026',
        description: 'The state government has announced an 8% increase in minimum wage for all industries, effective March 1, 2026. This will affect your payroll costs.',
        source: 'government',
        category: 'government-alerts',
        urgency: 'critical',
        icon: '🔴',
        industry: 'all',
        businessImpact: {
          what: 'Minimum wage increased by 8%',
          when: 'Effective March 1, 2026',
          where: 'State-wide',
          who: 'Affects all businesses with employees',
          impact: 'Payroll costs will increase by approximately 8%',
          opportunity: 'Review employee productivity and optimize workforce',
        },
        recommendedActions: [
          { action: 'Update salary structures in PayAid', priority: 'high', deadline: '2026-02-20' },
          { action: 'Review and adjust pricing if needed', priority: 'medium', deadline: '2026-02-28' },
          { action: 'Communicate changes to employees', priority: 'high', deadline: '2026-02-25' },
        ],
        sourceName: 'Labor Department',
        publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        tags: ['labor', 'wages', 'government', 'payroll'],
      },
      // Important News
      {
        title: 'Competitor Opens New Location in Your Area',
        summary: 'Major competitor opens new branch nearby',
        description: 'A major competitor has opened a new branch in your area. This could impact your market share.',
        source: 'competitor',
        category: 'competitor-tracking',
        urgency: 'important',
        icon: '🟡',
        industry: tenant.industry === 'restaurant' ? 'restaurant' : 'all',
        businessImpact: {
          what: 'Competitor expansion in your market area',
          when: 'Opened this week',
          where: 'Near your location',
          who: 'Affects your business directly',
          impact: 'Potential threat to your market share',
          opportunity: 'Launch counter-promotion in that area',
        },
        recommendedActions: [
          { action: 'Launch counter-promotion', priority: 'high', deadline: '2026-01-20' },
          { action: 'Review your pricing strategy', priority: 'medium', deadline: '2026-01-25' },
          { action: 'Enhance customer loyalty programs', priority: 'medium', deadline: '2026-01-30' },
        ],
        sourceName: 'Google Maps',
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        tags: ['competitor', 'expansion', 'market'],
      },
      {
        title: 'Fuel Prices Increase by 3% This Week',
        summary: 'Petrol and diesel prices have increased by 3% this week',
        description: 'Fuel prices have increased by 3% this week, which will affect your logistics and delivery costs if you operate a delivery service.',
        source: 'market',
        category: 'market-trends',
        urgency: 'important',
        icon: '🟡',
        industry: 'all',
        businessImpact: {
          what: 'Fuel prices increased by 3%',
          when: 'This week',
          where: 'Nationwide',
          who: 'Affects businesses with delivery/logistics',
          impact: 'Logistics costs will increase by approximately 3%',
          opportunity: 'Review delivery charges and optimize routes',
        },
        recommendedActions: [
          { action: 'Review delivery charges', priority: 'medium', deadline: '2026-01-25' },
          { action: 'Optimize delivery routes', priority: 'low', deadline: '2026-02-01' },
        ],
        sourceName: 'Economic Times',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        tags: ['fuel', 'logistics', 'costs'],
      },
      // Opportunity News
      {
        title: 'Government Grant Opens for Small Businesses',
        summary: 'New ₹50,000 grant available for small businesses',
        description: 'The government has announced a new grant program offering ₹50,000 to small businesses. Applications open until March 31, 2026.',
        source: 'government',
        category: 'market-trends',
        urgency: 'opportunity',
        icon: '💡',
        industry: 'all',
        businessImpact: {
          what: 'Government grant of ₹50,000 available',
          when: 'Applications open until March 31, 2026',
          where: 'Nationwide',
          who: 'Small businesses',
          impact: 'Potential revenue opportunity of ₹50,000',
          opportunity: 'Apply for grant to fund business expansion',
        },
        recommendedActions: [
          { action: 'Review eligibility criteria', priority: 'high', deadline: '2026-02-15' },
          { action: 'Prepare application documents', priority: 'high', deadline: '2026-02-28' },
          { action: 'Submit application before deadline', priority: 'high', deadline: '2026-03-31' },
        ],
        sourceName: 'MSME Portal',
        sourceUrl: 'https://www.msme.gov.in',
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date('2026-03-31'),
        tags: ['grant', 'government', 'funding', 'opportunity'],
      },
      // Informational News
      {
        title: 'Garlic Prices Up 10% This Month',
        summary: 'Commodity prices for garlic have increased by 10% this month',
        description: 'Garlic prices have increased by 10% this month due to supply chain disruptions. This may affect your food costs if you use garlic in your recipes.',
        source: 'supplier',
        category: 'supplier-intelligence',
        urgency: 'informational',
        icon: '🟢',
        industry: tenant.industry === 'restaurant' ? 'restaurant' : 'all',
        businessImpact: {
          what: 'Garlic prices increased by 10%',
          when: 'This month',
          where: 'Nationwide',
          who: 'Affects businesses using garlic',
          impact: 'Food costs may increase slightly',
          opportunity: 'Review suppliers for better rates or consider alternatives',
        },
        recommendedActions: [
          { action: 'Review suppliers for better rates', priority: 'low', deadline: '2026-02-01' },
          { action: 'Consider alternative ingredients', priority: 'low', deadline: '2026-02-15' },
        ],
        sourceName: 'Commodity Exchange',
        publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        tags: ['supplier', 'prices', 'commodity'],
      },
      {
        title: 'E-commerce Parcel Volume Up 25% YoY',
        summary: 'E-commerce parcel volume has increased by 25% year-over-year',
        description: 'E-commerce parcel volume has increased by 25% year-over-year, indicating strong growth in online shopping. This presents opportunities for businesses to expand online.',
        source: 'market',
        category: 'market-trends',
        urgency: 'informational',
        icon: '🟢',
        industry: 'all',
        businessImpact: {
          what: 'E-commerce growth of 25% YoY',
          when: 'This quarter',
          where: 'Nationwide',
          who: 'All businesses',
          impact: 'New demand for online services',
          opportunity: 'Expand online presence or e-commerce capabilities',
        },
        recommendedActions: [
          { action: 'Review online presence', priority: 'low', deadline: '2026-02-28' },
          { action: 'Consider e-commerce expansion', priority: 'low', deadline: '2026-03-15' },
        ],
        sourceName: 'Economic Times',
        publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        tags: ['ecommerce', 'trends', 'growth'],
      },
    ]

    // Delete existing news items for this tenant
    await prisma.newsItem.deleteMany({
      where: { tenantId: tenant.id },
    })

    // Create news items
    for (const news of sampleNews) {
      await prisma.newsItem.create({
        data: {
          tenantId: tenant.id,
          ...news,
        },
      })
    }

    console.log(`   ✅ Created ${sampleNews.length} news items`)
  }

  // Also create some general news items (not tenant-specific) if they don't exist
  const generalNews = [
    {
      title: 'New POS System Innovations Launched',
      summary: 'Latest POS systems offer faster processing and lower costs',
      description: 'Several new POS system providers have launched innovative solutions with faster processing times and lower transaction costs.',
      source: 'technology',
      category: 'technology-trends',
      urgency: 'informational',
      icon: '🟢',
      industry: 'all',
      tenantId: null,
      sourceName: 'Tech News',
      publishedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      tags: ['technology', 'pos', 'innovation'],
    },
  ]

  console.log('\n📰 Creating general news items...')
  for (const news of generalNews) {
    const existing = await prisma.newsItem.findFirst({
      where: {
        tenantId: null,
        title: news.title,
      },
    })

    if (!existing) {
      await prisma.newsItem.create({
        data: news,
      })
      console.log(`   ✅ Created general news: ${news.title}`)
    } else {
      // Update existing news item to ensure category is correct
      await prisma.newsItem.updateMany({
        where: {
          tenantId: null,
          title: news.title,
        },
        data: {
          category: news.category,
          urgency: news.urgency,
          icon: news.icon,
          industry: news.industry,
        },
      })
      console.log(`   🔄 Updated general news: ${news.title}`)
    }
  }

  console.log('\n✨ News items seeding completed successfully!')
}

// Run the seeder
seedNewsItems()
  .catch((e) => {
    console.error('❌ Error seeding news items:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

