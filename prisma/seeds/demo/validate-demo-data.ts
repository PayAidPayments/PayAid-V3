/**
 * Validation Script for Demo Business Data
 * Verifies that all modules have data in the date range March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DEMO_DATE_RANGE } from './date-utils'

const prisma = new PrismaClient()

interface ValidationResult {
  module: string
  table: string
  count: number
  inRange: number
  status: 'pass' | 'fail'
}

async function validateDemoData(tenantId: string) {
  console.log('🔍 Validating Demo Business Data...')
  console.log(`📅 Date Range: ${DEMO_DATE_RANGE.start.toISOString().split('T')[0]} to ${DEMO_DATE_RANGE.end.toISOString().split('T')[0]}`)
  console.log('')

  const results: ValidationResult[] = []

  // CRM Module
  const contacts = await prisma.contact.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'CRM',
    table: 'Contact',
    count: await prisma.contact.count({ where: { tenantId } }),
    inRange: contacts,
    status: contacts > 0 ? 'pass' : 'fail',
  })

  const deals = await prisma.deal.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'CRM',
    table: 'Deal',
    count: await prisma.deal.count({ where: { tenantId } }),
    inRange: deals,
    status: deals > 0 ? 'pass' : 'fail',
  })

  const tasks = await prisma.task.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'CRM',
    table: 'Task',
    count: await prisma.task.count({ where: { tenantId } }),
    inRange: tasks,
    status: tasks > 0 ? 'pass' : 'fail',
  })

  // Sales & Billing
  const orders = await prisma.order.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'Sales',
    table: 'Order',
    count: await prisma.order.count({ where: { tenantId } }),
    inRange: orders,
    status: orders > 0 ? 'pass' : 'fail',
  })

  const invoices = await prisma.invoice.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'Sales',
    table: 'Invoice',
    count: await prisma.invoice.count({ where: { tenantId } }),
    inRange: invoices,
    status: invoices > 0 ? 'pass' : 'fail',
  })

  // Marketing
  const campaigns = await prisma.campaign.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'Marketing',
    table: 'Campaign',
    count: await prisma.campaign.count({ where: { tenantId } }),
    inRange: campaigns,
    status: campaigns > 0 ? 'pass' : 'fail',
  })

  const landingPages = await prisma.landingPage.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'Marketing',
    table: 'LandingPage',
    count: await prisma.landingPage.count({ where: { tenantId } }),
    inRange: landingPages,
    status: landingPages > 0 ? 'pass' : 'fail',
  })

  // Activity Feed
  const activityFeeds = await prisma.activityFeed.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'CRM',
    table: 'ActivityFeed',
    count: await prisma.activityFeed.count({ where: { tenantId } }),
    inRange: activityFeeds,
    status: activityFeeds > 0 ? 'pass' : 'fail',
  })

  // Meetings
  const meetings = await prisma.meeting.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  results.push({
    module: 'CRM',
    table: 'Meeting',
    count: await prisma.meeting.count({ where: { tenantId } }),
    inRange: meetings,
    status: meetings > 0 ? 'pass' : 'fail',
  })

  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Validation Results:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  let passCount = 0
  let failCount = 0

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌'
    console.log(`${icon} ${result.module} - ${result.table}:`)
    console.log(`   Total: ${result.count}, In Range: ${result.inRange}`)
    if (result.status === 'pass') {
      passCount++
    } else {
      failCount++
    }
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return { passCount, failCount, results }
}

// CLI entry point
if (require.main === module) {
  prisma.tenant
    .findUnique({ where: { subdomain: 'demo' } })
    .then((tenant) => {
      if (!tenant) {
        console.error('❌ Demo tenant not found')
        process.exit(1)
      }
      return validateDemoData(tenant.id)
    })
    .then((result) => {
      process.exit(result.failCount > 0 ? 1 : 0)
    })
    .catch((e) => {
      console.error('❌ Validation failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { validateDemoData }
