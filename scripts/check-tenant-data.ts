/**
 * Script to check tenant data counts
 * Usage: npx tsx scripts/check-tenant-data.ts [tenantId]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const tenantId = process.argv[2] || 'cmjptk2mw0000aocw31u48n64'

async function checkTenantData() {
  try {
    console.log(`🔍 Checking data for tenant: ${tenantId}\n`)
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subdomain: true },
    })
    
    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`)
      console.log('\nAvailable tenants:')
      const allTenants = await prisma.tenant.findMany({
        select: { id: true, name: true, subdomain: true },
      })
      allTenants.forEach(t => {
        console.log(`  - ${t.id} (${t.name}, subdomain: ${t.subdomain})`)
      })
      process.exit(1)
    }
    
    console.log(`✅ Tenant found: ${tenant.name} (subdomain: ${tenant.subdomain})\n`)
    
    // Count all data types
    const [
      contacts,
      deals,
      tasks,
      meetings,
      leadSources,
      products,
      invoices,
      orders,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.meeting.count({ where: { tenantId } }),
      prisma.leadSource.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
    ])
    
    console.log('📊 Data Counts:')
    console.log(`  Contacts: ${contacts}`)
    console.log(`  Deals: ${deals}`)
    console.log(`  Tasks: ${tasks}`)
    console.log(`  Meetings: ${meetings}`)
    console.log(`  Lead Sources: ${leadSources}`)
    console.log(`  Products: ${products}`)
    console.log(`  Invoices: ${invoices}`)
    console.log(`  Orders: ${orders}`)
    console.log(`\n  Total CRM Records: ${contacts + deals + tasks + meetings}`)
    
    // Check for admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@demo.com',
        tenantId: tenantId,
      },
      select: { id: true, email: true, tenantId: true },
    })
    
    console.log(`\n👤 Admin User:`)
    if (adminUser) {
      console.log(`  ✅ Found: ${adminUser.email} (tenantId: ${adminUser.tenantId})`)
    } else {
      console.log(`  ❌ Not found for this tenant`)
      const adminAnywhere = await prisma.user.findFirst({
        where: { email: 'admin@demo.com' },
        select: { id: true, email: true, tenantId: true },
      })
      if (adminAnywhere) {
        console.log(`  ⚠️  Admin user exists but with different tenantId: ${adminAnywhere.tenantId}`)
      }
    }
    
    // Check recent deals
    if (deals > 0) {
      const recentDeals = await prisma.deal.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, value: true, stage: true, createdAt: true },
      })
      console.log(`\n📋 Recent Deals (last 5):`)
      recentDeals.forEach(deal => {
        console.log(`  - ${deal.name}: ₹${deal.value} (${deal.stage}) - ${deal.createdAt.toISOString().split('T')[0]}`)
      })
    }
    
    // Check current month deals
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    const currentMonthDeals = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })
    
    console.log(`\n📅 Current Month Stats:`)
    console.log(`  Deals created this month: ${currentMonthDeals}`)
    
    const wonDeals = await prisma.deal.findMany({
      where: {
        tenantId,
        status: 'won',
        OR: [
          {
            actualCloseDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          {
            AND: [
              { actualCloseDate: null },
              { updatedAt: { gte: startOfMonth, lte: endOfMonth } },
            ],
          },
        ],
      },
      select: { value: true },
    })
    
    const revenueThisMonth = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    console.log(`  Revenue this month: ₹${revenueThisMonth.toLocaleString('en-IN')}`)
    
    const closingDeals = await prisma.deal.count({
      where: {
        tenantId,
        expectedCloseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          notIn: ['won', 'lost'],
        },
      },
    })
    console.log(`  Deals closing this month: ${closingDeals}`)
    
    const overdueTasks = await prisma.task.count({
      where: {
        tenantId,
        status: {
          not: 'completed',
        },
        dueDate: {
          lt: now,
        },
      },
    })
    console.log(`  Overdue tasks: ${overdueTasks}`)
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkTenantData()
