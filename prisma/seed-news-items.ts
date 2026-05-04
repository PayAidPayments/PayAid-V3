import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_COMPETITOR_PREFIX = '[Industry Intelligence Demo]'

/** Industry slugs used for global catalog rows (tenantId null) — matches common Tenant.industry values */
const GLOBAL_NEWS_INDUSTRIES = [
  'service-business',
  'restaurant',
  'software',
  'healthcare',
  'retail',
  'manufacturing',
  'hospitality',
  'education',
  'construction',
  'finance',
  'agriculture',
  'professional-services',
  'logistics',
  'real-estate',
] as const

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

  await seedGlobalCatalogNewsByIndustry(now)
  try {
    await seedDemoCompetitorsForAllTenants()
  } catch (e) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: string }).code) : ''
    if (code === 'P2021') {
      console.warn(
        '\n⚠️  Skipping demo competitors: the Competitor table is not in this database yet. Apply migrations or `prisma db push` to enable competitor seeding. News items were still created.'
      )
    } else {
      throw e
    }
  }

  console.log('\n✨ News items seeding completed successfully!')
}

/**
 * Global rows (tenantId null) tagged per industry so Industry Intelligence has data for any tenant industry.
 */
async function seedGlobalCatalogNewsByIndustry(now: Date) {
  console.log('\n📰 Ensuring global industry catalog news...')

  for (const industry of GLOBAL_NEWS_INDUSTRIES) {
    const items = [
      {
        title: `Regulatory watch: ${industry} compliance updates (India)`,
        summary: 'Recent notifications and deadlines relevant to your sector.',
        description:
          'Curated compliance reminders for MSMEs and growing businesses. Review applicability with your advisor.',
        source: 'government',
        category: 'government-alerts',
        urgency: 'important',
        icon: '🟡',
        industry,
        sourceName: 'PayAid Intelligence',
        publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        tags: ['compliance', 'regulatory', industry],
      },
      {
        title: `Market signal: demand trends in ${industry.replace(/-/g, ' ')}`,
        summary: 'Channel and pricing signals worth monitoring this quarter.',
        description:
          'Benchmark against local peers and adjust campaigns or capacity where it matters most.',
        source: 'market',
        category: 'market-trends',
        urgency: 'informational',
        icon: '🟢',
        industry,
        sourceName: 'Industry Brief',
        publishedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        tags: ['market', 'trends', industry],
      },
    ]

    for (const row of items) {
      const existing = await prisma.newsItem.findFirst({
        where: {
          tenantId: null,
          title: row.title,
          industry: row.industry,
        },
      })
      if (!existing) {
        await prisma.newsItem.create({
          data: {
            tenantId: null,
            title: row.title,
            summary: row.summary,
            description: row.description,
            source: row.source,
            category: row.category,
            urgency: row.urgency,
            icon: row.icon,
            industry: row.industry,
            sourceName: row.sourceName,
            publishedAt: row.publishedAt,
            tags: row.tags,
          },
        })
      }
    }
  }
  console.log('   ✅ Global industry catalog ready')
}

async function seedDemoCompetitorsForAllTenants() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, industry: true } })
  console.log('\n🎯 Seeding demo competitors for Industry Intelligence...')

  for (const tenant of tenants) {
    await prisma.competitor.deleteMany({
      where: {
        tenantId: tenant.id,
        name: { startsWith: DEMO_COMPETITOR_PREFIX },
      },
    })

    const a = await prisma.competitor.create({
      data: {
        tenantId: tenant.id,
        name: `${DEMO_COMPETITOR_PREFIX} ${tenant.name.slice(0, 24)} — Regional player`,
        website: 'https://example.com',
        industry: tenant.industry || undefined,
        description: 'Demo competitor for Industry Intelligence dashboards.',
        priceTrackingEnabled: true,
        locationTrackingEnabled: true,
        monitoringEnabled: true,
      },
    })

    await prisma.competitorPrice.create({
      data: {
        competitorId: a.id,
        productName: 'Core service bundle',
        price: new Prisma.Decimal('12999.00'),
        currency: 'INR',
        source: 'manual',
        lastCheckedAt: new Date(),
      },
    })

    await prisma.competitorLocation.create({
      data: {
        competitorId: a.id,
        name: 'Flagship branch',
        address: '12 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        isActive: true,
      },
    })

    await prisma.competitorAlert.create({
      data: {
        competitorId: a.id,
        type: 'PRICE_CHANGE',
        title: 'Price check recorded',
        message: 'Demo alert: competitor pricing last verified for seed data.',
        severity: 'INFO',
        isRead: false,
      },
    })

    const b = await prisma.competitor.create({
      data: {
        tenantId: tenant.id,
        name: `${DEMO_COMPETITOR_PREFIX} Alternate vendor`,
        website: 'https://example.org',
        industry: tenant.industry || undefined,
        description: 'Second demo track for charts and alerts.',
        priceTrackingEnabled: false,
        locationTrackingEnabled: true,
        monitoringEnabled: true,
      },
    })

    await prisma.competitorLocation.create({
      data: {
        competitorId: b.id,
        name: 'City outlet',
        address: '88 High Street',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        isActive: true,
      },
    })
  }

  console.log(`   ✅ Demo competitors for ${tenants.length} tenant(s)`)
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

