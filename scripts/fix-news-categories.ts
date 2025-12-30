import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixNewsCategories() {
  console.log('🔧 Fixing news item categories...\n')

  // Fix category names
  const updates = [
    { old: 'market_trends', new: 'market-trends' },
    { old: 'government_alerts', new: 'government-alerts' },
    { old: 'competitor_intelligence', new: 'competitor-tracking' },
    { old: 'supplier_intelligence', new: 'supplier-intelligence' },
  ]

  for (const update of updates) {
    const result = await prisma.newsItem.updateMany({
      where: { category: update.old },
      data: { category: update.new },
    })
    if (result.count > 0) {
      console.log(`✅ Updated ${result.count} items from '${update.old}' to '${update.new}'`)
    }
  }

  // Add general news items if they don't exist
  const now = new Date()
  const generalNews = [
    {
      title: 'GST Rate Reduced on Food Services: 5% → 0%',
      summary: 'Government announces GST reduction on food services effective February 1, 2026',
      description: 'The government has announced a reduction in GST rates on food services from 5% to 0%, effective February 1, 2026. This applies to all restaurants and food service establishments.',
      source: 'government',
      category: 'government-alerts',
      urgency: 'critical',
      icon: '🔴',
      industry: 'all',
      tenantId: null,
      businessImpact: {
        what: 'GST on food services reduced from 5% to 0%',
        when: 'Effective February 1, 2026',
        where: 'All of India',
        who: 'Affects all food service businesses',
        impact: 'Margins improve 5% on each item',
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
      tenantId: null,
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
    {
      title: 'Fuel Prices Increase by 3% This Week',
      summary: 'Petrol and diesel prices have increased by 3% this week',
      description: 'Fuel prices have increased by 3% this week, which will affect your logistics and delivery costs if you operate a delivery service.',
      source: 'market',
      category: 'market-trends',
      urgency: 'important',
      icon: '🟡',
      industry: 'all',
      tenantId: null,
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
    {
      title: 'Government Grant Opens for Small Businesses',
      summary: 'New ₹50,000 grant available for small businesses',
      description: 'The government has announced a new grant program offering ₹50,000 to small businesses. Applications open until March 31, 2026.',
      source: 'government',
      category: 'market-trends',
      urgency: 'opportunity',
      icon: '💡',
      industry: 'all',
      tenantId: null,
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
  ]

  console.log('\n📰 Adding general news items...')
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
      console.log(`   ✅ Created: ${news.title}`)
    } else {
      // Update existing to ensure correct category
      await prisma.newsItem.updateMany({
        where: {
          tenantId: null,
          title: news.title,
        },
        data: {
          category: news.category,
          urgency: news.urgency,
        },
      })
      console.log(`   🔄 Updated: ${news.title}`)
    }
  }

  console.log('\n✨ Fix completed!')
  await prisma.$disconnect()
}

fixNewsCategories().catch(console.error)

