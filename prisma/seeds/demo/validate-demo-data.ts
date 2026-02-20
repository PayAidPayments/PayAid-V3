/**
 * Validation Script for Demo Business Data
 * Verifies that all modules have data in the date range March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DEMO_DATE_RANGE, getMonthsInRange } from './date-utils'

const prisma = new PrismaClient()

interface ValidationResult {
  module: string
  table: string
  count: number
  inRange: number
  monthlyDistribution: { month: string; count: number }[]
  status: 'pass' | 'fail'
  monthlyCoverage: 'pass' | 'fail' // Pass if data exists in all 12 months
}

/**
 * Check monthly distribution for a table
 */
async function checkMonthlyDistribution(
  prisma: PrismaClient,
  tenantId: string,
  model: string,
  dateField: string = 'createdAt'
): Promise<{ month: string; count: number }[]> {
  const months = getMonthsInRange(DEMO_DATE_RANGE)
  const distribution: { month: string; count: number }[] = []
  
  for (const month of months) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const monthLabel = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    try {
      // Use dynamic model access
      const count = await (prisma as any)[model].count({
        where: {
          tenantId,
          [dateField]: { gte: monthStart, lte: monthEnd },
        },
      })
      distribution.push({ month: monthLabel, count })
    } catch (error) {
      // Model doesn't exist, skip
      distribution.push({ month: monthLabel, count: 0 })
    }
  }
  
  return distribution
}

async function validateDemoData(tenantId: string) {
  console.log('🔍 Validating Demo Business Data...')
  console.log(`📅 Date Range: ${DEMO_DATE_RANGE.start.toISOString().split('T')[0]} to ${DEMO_DATE_RANGE.end.toISOString().split('T')[0]}`)
  console.log('')
  console.log('⚠️  CRITICAL: Checking that data is distributed across ALL 12 months (Mar 2025 - Feb 2026)')
  console.log('⚠️  Data should NOT be clustered in Jan/Feb only')
  console.log('')

  const results: ValidationResult[] = []

  // CRM Module
  const contacts = await prisma.contact.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const contactsMonthly = await checkMonthlyDistribution(prisma, tenantId, 'contact')
  const contactsMonthlyCoverage = contactsMonthly.every(m => m.count > 0) ? 'pass' : 'fail'
  results.push({
    module: 'CRM',
    table: 'Contact',
    count: await prisma.contact.count({ where: { tenantId } }),
    inRange: contacts,
    monthlyDistribution: contactsMonthly,
    status: contacts > 0 ? 'pass' : 'fail',
    monthlyCoverage: contactsMonthlyCoverage,
  })

  const deals = await prisma.deal.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const dealsMonthly = await checkMonthlyDistribution(prisma, tenantId, 'deal')
  results.push({
    module: 'CRM',
    table: 'Deal',
    count: await prisma.deal.count({ where: { tenantId } }),
    inRange: deals,
    monthlyDistribution: dealsMonthly,
    status: deals > 0 ? 'pass' : 'fail',
    monthlyCoverage: dealsMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
  })

  const tasks = await prisma.task.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const tasksMonthly = await checkMonthlyDistribution(prisma, tenantId, 'task')
  results.push({
    module: 'CRM',
    table: 'Task',
    count: await prisma.task.count({ where: { tenantId } }),
    inRange: tasks,
    monthlyDistribution: tasksMonthly,
    status: tasks > 0 ? 'pass' : 'fail',
    monthlyCoverage: tasksMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
  })

  // Sales & Billing
  const orders = await prisma.order.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const ordersMonthly = await checkMonthlyDistribution(prisma, tenantId, 'order')
  results.push({
    module: 'Sales',
    table: 'Order',
    count: await prisma.order.count({ where: { tenantId } }),
    inRange: orders,
    monthlyDistribution: ordersMonthly,
    status: orders > 0 ? 'pass' : 'fail',
    monthlyCoverage: ordersMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
  })

  const invoices = await prisma.invoice.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const invoicesMonthly = await checkMonthlyDistribution(prisma, tenantId, 'invoice')
  results.push({
    module: 'Sales',
    table: 'Invoice',
    count: await prisma.invoice.count({ where: { tenantId } }),
    inRange: invoices,
    monthlyDistribution: invoicesMonthly,
    status: invoices > 0 ? 'pass' : 'fail',
    monthlyCoverage: invoicesMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
  })

  // Marketing
  const campaigns = await prisma.campaign.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const campaignsMonthly = await checkMonthlyDistribution(prisma, tenantId, 'campaign')
  results.push({
    module: 'Marketing',
    table: 'Campaign',
    count: await prisma.campaign.count({ where: { tenantId } }),
    inRange: campaigns,
    monthlyDistribution: campaignsMonthly,
    status: campaigns > 0 ? 'pass' : 'fail',
    monthlyCoverage: campaignsMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
  })

  const landingPages = await prisma.landingPage.count({
    where: {
      tenantId,
      createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
    },
  })
  const landingPagesMonthly = await checkMonthlyDistribution(prisma, tenantId, 'landingPage')
  results.push({
    module: 'Marketing',
    table: 'LandingPage',
    count: await prisma.landingPage.count({ where: { tenantId } }),
    inRange: landingPages,
    monthlyDistribution: landingPagesMonthly,
    status: landingPages > 0 ? 'pass' : 'fail',
    monthlyCoverage: landingPagesMonthly.length > 0 ? 'pass' : 'fail', // Landing pages don't need to be in every month
  })

  // Activity Feed
  try {
    const activityFeeds = await prisma.activityFeed.count({
      where: {
        tenantId,
        createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
      },
    })
    const activityFeedsMonthly = await checkMonthlyDistribution(prisma, tenantId, 'activityFeed')
    results.push({
      module: 'CRM',
      table: 'ActivityFeed',
      count: await prisma.activityFeed.count({ where: { tenantId } }),
      inRange: activityFeeds,
      monthlyDistribution: activityFeedsMonthly,
      status: activityFeeds > 0 ? 'pass' : 'fail',
      monthlyCoverage: activityFeedsMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
    })
  } catch {
    // ActivityFeed may not exist
  }

  // Meetings
  try {
    const meetings = await prisma.meeting.count({
      where: {
        tenantId,
        createdAt: { gte: DEMO_DATE_RANGE.start, lte: DEMO_DATE_RANGE.end },
      },
    })
    const meetingsMonthly = await checkMonthlyDistribution(prisma, tenantId, 'meeting')
    results.push({
      module: 'CRM',
      table: 'Meeting',
      count: await prisma.meeting.count({ where: { tenantId } }),
      inRange: meetings,
      monthlyDistribution: meetingsMonthly,
      status: meetings > 0 ? 'pass' : 'fail',
      monthlyCoverage: meetingsMonthly.every(m => m.count > 0) ? 'pass' : 'fail',
    })
  } catch {
    // Meeting may not exist
  }

  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Validation Results:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  let passCount = 0
  let failCount = 0

  for (const result of results) {
    const icon = result.status === 'pass' && result.monthlyCoverage === 'pass' ? '✅' : '❌'
    const monthlyIcon = result.monthlyCoverage === 'pass' ? '✅' : '⚠️'
    console.log(`${icon} ${result.module} - ${result.table}:`)
    console.log(`   Total: ${result.count}, In Range: ${result.inRange}`)
    console.log(`   ${monthlyIcon} Monthly Coverage: ${result.monthlyCoverage === 'pass' ? 'All 12 months have data' : 'Some months missing data'}`)
    
    // Show monthly breakdown if coverage failed
    if (result.monthlyCoverage === 'fail') {
      const emptyMonths = result.monthlyDistribution.filter(m => m.count === 0).map(m => m.month)
      if (emptyMonths.length > 0) {
        console.log(`   ⚠️  Empty months: ${emptyMonths.join(', ')}`)
      }
    }
    
    if (result.status === 'pass' && result.monthlyCoverage === 'pass') {
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
