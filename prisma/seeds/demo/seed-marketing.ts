/**
 * Marketing Module Seeder for Demo Business
 * Seeds: Campaigns, Campaign Events, Landing Pages, Lead Sources, Email Events
 * Date Range: March 2025 - February 2026
 */

import type { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, getMonthsInRange } from './date-utils'
import { requirePrismaClient, withRetry } from './prisma-utils'

export interface MarketingSeedResult {
  campaigns: number
  landingPages: number
  leadSources: number
  emailEvents: number
}

export async function seedMarketingModule(
  tenantId: string,
  contacts: any[],
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient: PrismaClient
): Promise<MarketingSeedResult> {
  const prisma = requirePrismaClient(prismaClient)
  console.log('📢 Seeding Marketing Module...')

  const months = getMonthsInRange(range)

  // 1. CAMPAIGNS - 12 campaigns (1 per month) + additional campaigns
  const campaignTypes = ['email', 'whatsapp', 'sms', 'ads']
  const campaignStatuses = ['draft', 'scheduled', 'sent', 'completed']
  
  // Create campaigns in small batches with retry (pooler can drop transiently)
  const campaigns: any[] = []
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
      const campaignDate = randomDateInRange({
        start: new Date(month.getFullYear(), month.getMonth(), 1),
        end: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
      })
      
      const type = campaignTypes[monthIdx % campaignTypes.length]
      const status = monthIdx < months.length - 2 ? 'sent' : monthIdx === months.length - 1 ? 'draft' : 'scheduled'
      const sentAt = status === 'sent' ? campaignDate : null
      const scheduledFor = status === 'scheduled' ? randomDateInRange({ start: range.end, end: new Date(range.end.getTime() + 30 * 24 * 60 * 60 * 1000) }) : null
      
      const recipientCount = Math.floor(Math.random() * 500) + 100
      const sent = status === 'sent' ? recipientCount : 0
      const delivered = status === 'sent' ? Math.floor(sent * 0.95) : 0
      const opened = status === 'sent' ? Math.floor(delivered * 0.25) : 0
      const clicked = status === 'sent' ? Math.floor(opened * 0.15) : 0
      const bounced = status === 'sent' ? Math.floor(sent * 0.03) : 0
      const unsubscribed = status === 'sent' ? Math.floor(sent * 0.01) : 0

      const created = await withRetry(
        () =>
          prisma.campaign.create({
            data: {
          tenantId,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Campaign - ${month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
          type,
          subject: `Special Offer - ${month.toLocaleDateString('en-IN', { month: 'long' })}`,
          content: `Campaign content for ${type} campaign in ${month.toLocaleDateString('en-IN', { month: 'long' })}`,
          status,
          contactIds: contacts.slice(0, Math.min(recipientCount, contacts.length)).map(c => c.id),
          scheduledFor,
          sentAt,
          recipientCount,
          sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
          createdAt: campaignDate,
            },
          }),
        { label: 'campaign.create', retries: 6, baseDelayMs: 300 }
      )
      campaigns.push(created)
      // small pacing
      await new Promise((r) => setTimeout(r, 50))
  }

  // Add 20 more campaigns for variety
  const additionalCampaigns: any[] = []
  for (let i = 0; i < 20; i++) {
      const campaignDate = randomDateInRange(range)
      const type = campaignTypes[Math.floor(Math.random() * campaignTypes.length)]
      const status = campaignStatuses[Math.floor(Math.random() * campaignStatuses.length)]
      
      const created = await withRetry(
        () =>
          prisma.campaign.create({
            data: {
          tenantId,
          name: `Campaign ${i + 13} - ${type}`,
          type,
          subject: `Campaign Subject ${i + 13}`,
          content: `Campaign content ${i + 13}`,
          status,
          contactIds: contacts.slice(0, Math.min(50, contacts.length)).map(c => c.id),
          sentAt: status === 'sent' ? campaignDate : null,
          recipientCount: 50,
          sent: status === 'sent' ? 50 : 0,
          delivered: status === 'sent' ? 47 : 0,
          opened: status === 'sent' ? 12 : 0,
          clicked: status === 'sent' ? 2 : 0,
          createdAt: campaignDate,
            },
          }),
        { label: 'campaign.create(additional)', retries: 6, baseDelayMs: 300 }
      )
      additionalCampaigns.push(created)
      await new Promise((r) => setTimeout(r, 25))
  }

  const allCampaigns = [...campaigns, ...additionalCampaigns]
  console.log(`  ✓ Created ${allCampaigns.length} campaigns`)

  // 2. LANDING PAGES - 8 landing pages
  const landingPages = await Promise.all(
    Array.from({ length: 8 }, (_, i) => {
      const createdDate = randomDateInRange(range)
      const views = Math.floor(Math.random() * 5000) + 500
      const conversions = Math.floor(views * (0.02 + Math.random() * 0.05)) // 2-7% conversion
      
      return prisma.landingPage.create({
        data: {
          tenantId,
          name: `Landing Page ${i + 1}`,
          slug: `landing-page-${i + 1}`,
          status: 'PUBLISHED',
          contentJson: {
            hero: { title: `Landing Page ${i + 1}`, subtitle: 'Convert visitors to customers' },
            sections: ['features', 'testimonials', 'pricing', 'cta'],
          },
          metaTitle: `Landing Page ${i + 1} - Demo Business`,
          metaDescription: `Landing page description ${i + 1}`,
          views,
          conversions,
          conversionRate: (conversions / views) * 100,
          createdAt: createdDate,
        },
      })
    })
  )

  console.log(`  ✓ Created ${landingPages.length} landing pages`)

  // 3. LEAD SOURCES - 10 lead sources with conversion metrics
  const sourceNames = [
    'Website',
    'Google Search',
    'Facebook Ads',
    'LinkedIn',
    'Referral',
    'Email Campaign',
    'Event',
    'Partner',
    'Cold Outreach',
    'Content Marketing',
  ]

  const leadSources = await Promise.all(
    sourceNames.map((name, i) => {
      const createdDate = randomDateInRange(range)
      const leads = Math.floor(Math.random() * 200) + 50
      const conversions = Math.floor(leads * (0.1 + Math.random() * 0.2)) // 10-30% conversion
      
      return prisma.leadSource.create({
        data: {
          tenantId,
          name,
          type: name.toLowerCase().replace(/\s+/g, '_'),
          leadsCount: leads,
          conversionsCount: conversions,
          totalValue: conversions * (Math.floor(Math.random() * 100000) + 50000),
          avgDealValue: conversions > 0 ? (conversions * (Math.floor(Math.random() * 100000) + 50000)) / conversions : 0,
          conversionRate: (conversions / leads) * 100,
          createdAt: createdDate,
        },
      }).catch(() => null) // Skip if LeadSource model doesn't exist
    })
  )

  console.log(`  ✓ Created ${leadSources.filter(Boolean).length} lead sources`)

  // 4. EMAIL EVENTS - Track email opens, clicks, bounces for campaigns
  const emailEvents = []
  for (const campaign of allCampaigns.filter(c => c.status === 'sent')) {
    // Create open events
    for (let i = 0; i < campaign.opened; i++) {
      const eventDate = randomDateInRange({ start: campaign.sentAt!, end: new Date(campaign.sentAt!.getTime() + 7 * 24 * 60 * 60 * 1000) })
      emailEvents.push({
        tenantId,
        campaignId: campaign.id,
        contactId: campaign.contactIds[Math.floor(Math.random() * campaign.contactIds.length)],
        eventType: 'open',
        timestamp: eventDate,
      })
    }
    
    // Create click events (subset of opens)
    for (let i = 0; i < campaign.clicked; i++) {
      const eventDate = randomDateInRange({ start: campaign.sentAt!, end: new Date(campaign.sentAt!.getTime() + 7 * 24 * 60 * 60 * 1000) })
      emailEvents.push({
        tenantId,
        campaignId: campaign.id,
        contactId: campaign.contactIds[Math.floor(Math.random() * campaign.contactIds.length)],
        eventType: 'click',
        timestamp: eventDate,
      })
    }
  }

  // Batch create email events (limit to 1000 to avoid memory issues)
  // Note: EmailEvent model may not exist in all schemas
  const eventsToCreate = emailEvents.slice(0, 1000)
  const createdEvents = []
  try {
    if (prisma.emailEvent) {
      for (let i = 0; i < eventsToCreate.length; i += 10) {
        const batch = eventsToCreate.slice(i, i + 10)
        const batchResults = await Promise.all(
          batch.map((event) =>
            prisma.emailEvent.create({ data: event }).catch(() => null)
          )
        )
        createdEvents.push(...batchResults)
        if (i + 10 < eventsToCreate.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    }
  } catch (e) {
    // EmailEvent model doesn't exist, skip
    console.log('  ⚠ EmailEvent model not available, skipping')
  }

  console.log(`  ✓ Created ${createdEvents.filter(Boolean).length} email events`)

  return {
    campaigns: allCampaigns.length,
    landingPages: landingPages.length,
    leadSources: leadSources.filter(Boolean).length,
    emailEvents: createdEvents.filter(Boolean).length,
  }
}
