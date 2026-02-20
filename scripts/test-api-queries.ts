/**
 * Test script that mimics the exact API query logic
 * Run: npx tsx scripts/test-api-queries.ts
 */

import { PrismaClient } from '@prisma/client'
import { getTimePeriodBounds } from '../lib/utils/crm-filters'

const prisma = new PrismaClient()

async function testAPIQueries() {
  console.log('🔍 Testing API Query Logic...\n')

  // Get tenant and user
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Tenant not found')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  })

  if (!user) {
    console.error('❌ User not found')
    process.exit(1)
  }

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`✅ User: ${user.name} (role: ${user.role})`)
  console.log('')

  // Get period bounds (same as API)
  const periodBounds = getTimePeriodBounds('month')
  const periodStart = periodBounds.start
  const periodEnd = periodBounds.end

  console.log('📅 Period bounds (same as API):')
  console.log(`   Start: ${periodStart.toISOString()}`)
  console.log(`   End: ${periodEnd.toISOString()}`)
  console.log('')

  // Build filters (same as API)
  // For owner, getUserFilter returns { tenantId }
  const userFilter = { tenantId: tenant.id }
  const dealFilter = { tenantId: tenant.id }
  const contactFilter = { tenantId: tenant.id }

  console.log('🔍 Filters (same as API):')
  console.log(`   userFilter: ${JSON.stringify(userFilter)}`)
  console.log(`   dealFilter: ${JSON.stringify(dealFilter)}`)
  console.log(`   contactFilter: ${JSON.stringify(contactFilter)}`)
  console.log('')

  // Test Query 1: Deals created in period (EXACT API QUERY)
  console.log('📊 Testing Query 1: Deals created in period...')
  const dealsCreatedInPeriod = await prisma.deal.count({
    where: {
      ...dealFilter,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  })
  console.log(`   Result: ${dealsCreatedInPeriod}`)
  console.log('')

  // Test Query 7: Total leads (EXACT API QUERY)
  console.log('📊 Testing Query 7: Total leads...')
  const totalLeads = await prisma.contact.count({
    where: {
      ...contactFilter,
      stage: { in: ['prospect', 'contact'] },
    },
  })
  console.log(`   Result: ${totalLeads}`)
  console.log('')

  // Test Query 8: Converted leads (EXACT API QUERY)
  console.log('📊 Testing Query 8: Converted leads...')
  const convertedLeads = await prisma.contact.count({
    where: {
      ...contactFilter,
      stage: 'customer',
    },
  })
  console.log(`   Result: ${convertedLeads}`)
  console.log('')

  // Test Query 8b: Contacts created in period (EXACT API QUERY)
  console.log('📊 Testing Query 8b: Contacts created in period...')
  const contactsCreatedInPeriod = await prisma.contact.count({
    where: {
      ...contactFilter,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  })
  console.log(`   Result: ${contactsCreatedInPeriod}`)
  console.log('')

  // Test revenue calculation
  console.log('📊 Testing Revenue calculation...')
  const wonDeals = await prisma.deal.findMany({
    where: {
      ...dealFilter,
      stage: 'won',
    },
    select: {
      value: true,
      actualCloseDate: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const revenueInPeriod = wonDeals
    .filter(deal => {
      if (!deal) return false
      const closeDate = deal.actualCloseDate || deal.updatedAt || deal.createdAt
      if (!closeDate) return false
      const date = new Date(closeDate)
      if (isNaN(date.getTime())) return false
      const dateTime = date.getTime()
      return dateTime >= periodStart.getTime() && dateTime <= periodEnd.getTime()
    })
    .reduce((sum, deal) => sum + (deal?.value || 0), 0)

  console.log(`   Total won deals: ${wonDeals.length}`)
  console.log(`   Revenue in period: ₹${revenueInPeriod}`)
  console.log('')

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 SUMMARY (What API should return):')
  console.log(`   dealsCreatedThisMonth: ${dealsCreatedInPeriod}`)
  console.log(`   revenueThisMonth: ₹${revenueInPeriod}`)
  console.log(`   totalLeads: ${totalLeads}`)
  console.log(`   convertedLeads: ${convertedLeads}`)
  console.log(`   contactsCreatedThisMonth: ${contactsCreatedInPeriod}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await prisma.$disconnect()
}

testAPIQueries().catch(console.error)
