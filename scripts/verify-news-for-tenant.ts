/**
 * Verify news items for a specific tenant
 * 
 * Usage:
 *   npx tsx scripts/verify-news-for-tenant.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying news items for Demo Business Pvt Ltd...\n')

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
    console.log(`   Tenant ID: ${tenant.id}`)
    console.log(`   Industry: ${tenant.industry || 'not set'}\n`)

    // Check tenant-specific news
    const tenantNews = await prisma.newsItem.findMany({
      where: { tenantId: tenant.id },
    })

    console.log(`📰 Tenant-specific news items: ${tenantNews.length}`)
    tenantNews.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.title} (${item.urgency}, ${item.category})`)
    })

    // Check general news (tenantId: null, industry: 'all')
    const generalNews = await prisma.newsItem.findMany({
      where: {
        tenantId: null,
        industry: 'all',
      },
    })

    console.log(`\n📰 General news items (industry: 'all'): ${generalNews.length}`)
    generalNews.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.title} (${item.urgency}, ${item.category})`)
    })

    // Check industry-specific news
    if (tenant.industry) {
      const industryNews = await prisma.newsItem.findMany({
        where: {
          tenantId: null,
          industry: tenant.industry,
        },
      })

      console.log(`\n📰 Industry-specific news (industry: '${tenant.industry}'): ${industryNews.length}`)
      industryNews.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.title} (${item.urgency}, ${item.category})`)
      })
    }

    // Simulate the API query
    console.log(`\n🔍 Simulating API query...`)
    const where: any = {
      OR: [
        { tenantId: tenant.id }, // Tenant-specific news
        { tenantId: null, industry: tenant.industry || null }, // Industry-specific news
        { tenantId: null, industry: 'all' }, // General news
      ],
      isDismissed: false,
    }

    const apiResults = await prisma.newsItem.findMany({
      where,
      orderBy: [
        { urgency: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    console.log(`✅ API query would return: ${apiResults.length} news items`)
    if (apiResults.length === 0) {
      console.log(`\n⚠️  WARNING: No news items found! This explains why the sidebar shows "No news items at the moment"`)
      console.log(`\n   Possible issues:`)
      console.log(`   1. All news items might be dismissed`)
      console.log(`   2. Query logic might have an issue with null industry`)
      console.log(`   3. News items might not have been created properly`)
    } else {
      apiResults.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.title} (${item.urgency})`)
      })
    }

    // Check dismissed items
    const dismissedCount = await prisma.newsItem.count({
      where: {
        OR: [
          { tenantId: tenant.id },
          { tenantId: null, industry: tenant.industry || null },
          { tenantId: null, industry: 'all' },
        ],
        isDismissed: true,
      },
    })

    if (dismissedCount > 0) {
      console.log(`\n⚠️  Found ${dismissedCount} dismissed news items (these won't show in the sidebar)`)
    }
  } catch (error) {
    console.error('❌ Error verifying news:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

