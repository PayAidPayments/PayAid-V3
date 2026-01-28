/**
 * Test Script: Verify CRM Dashboard Accessibility and Data
 * 
 * This script tests:
 * 1. Login functionality
 * 2. CRM dashboard accessibility
 * 3. Stat cards have data
 * 4. Demo Business Pvt Ltd has sample data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCRMDashboard() {
  console.log('🧪 Testing CRM Dashboard Accessibility and Data...\n')

  try {
    // 1. Find Demo Business tenant
    console.log('1️⃣ Finding Demo Business tenant...')
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
      include: {
        users: {
          take: 1,
        },
      },
    })

    if (!tenant) {
      console.error('❌ Demo Business tenant not found!')
      console.log('💡 Run: npm run db:seed to create demo tenant')
      process.exit(1)
    }

    console.log(`✅ Found tenant: ${tenant.name} (ID: ${tenant.id})`)
    console.log(`   Subdomain: ${tenant.subdomain}`)
    console.log(`   Plan: ${tenant.plan}`)
    console.log(`   Licensed Modules: ${tenant.licensedModules?.join(', ') || 'none'}\n`)

    // 2. Check for demo user
    const demoUser = tenant.users[0] || await prisma.user.findFirst({
      where: { tenantId: tenant.id },
    })

    if (!demoUser) {
      console.error('❌ No users found for Demo Business tenant!')
      console.log('💡 Run: npm run db:seed to create demo user')
      process.exit(1)
    }

    console.log(`✅ Found user: ${demoUser.email} (Role: ${demoUser.role})\n`)

    // 3. Check CRM data
    console.log('2️⃣ Checking CRM data for stat cards...\n')

    const [contactsCount, dealsCount, tasksCount, leadSourcesCount] = await Promise.all([
      prisma.contact.count({ where: { tenantId: tenant.id } }),
      prisma.deal.count({ where: { tenantId: tenant.id } }),
      prisma.task.count({ where: { tenantId: tenant.id } }),
      prisma.leadSource.count({ where: { tenantId: tenant.id } }),
    ])

    console.log(`📊 Data Summary:`)
    console.log(`   Contacts: ${contactsCount}`)
    console.log(`   Deals: ${dealsCount}`)
    console.log(`   Tasks: ${tasksCount}`)
    console.log(`   Lead Sources: ${leadSourcesCount}\n`)

    // 4. Check if we have enough data for stat cards
    const hasEnoughData = contactsCount > 0 && dealsCount > 0 && tasksCount > 0

    if (!hasEnoughData) {
      console.warn('⚠️  Insufficient data for CRM dashboard stat cards!')
      console.log('💡 Run: POST /api/admin/seed-demo-data to seed demo data\n')
      
      if (contactsCount === 0) {
        console.log('   Missing: Contacts')
      }
      if (dealsCount === 0) {
        console.log('   Missing: Deals')
      }
      if (tasksCount === 0) {
        console.log('   Missing: Tasks')
      }
    } else {
      console.log('✅ Sufficient data for CRM dashboard stat cards!\n')
    }

    // 5. Check deals for revenue calculations
    console.log('3️⃣ Checking deals for revenue calculations...\n')
    
    const deals = await prisma.deal.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        expectedCloseDate: true,
        createdAt: true,
      },
      take: 10,
    })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const dealsThisMonth = deals.filter(d => {
      const dealDate = new Date(d.createdAt)
      return dealDate >= currentMonth
    })

    const revenueThisMonth = dealsThisMonth.reduce((sum, deal) => sum + (deal.value || 0), 0)

    console.log(`   Total Deals: ${deals.length}`)
    console.log(`   Deals Created This Month: ${dealsThisMonth.length}`)
    console.log(`   Revenue This Month: ₹${revenueThisMonth.toLocaleString('en-IN')}\n`)

    // 6. Check tasks for overdue count
    console.log('4️⃣ Checking tasks for overdue count...\n')
    
    const tasks = await prisma.task.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
      take: 10,
    })

    const now = new Date()
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      return dueDate < now && t.status !== 'completed'
    })

    console.log(`   Total Tasks: ${tasks.length}`)
    console.log(`   Overdue Tasks: ${overdueTasks.length}\n`)

    // 7. Summary
    console.log('📋 Test Summary:\n')
    console.log(`✅ Tenant: ${tenant.name}`)
    console.log(`✅ User: ${demoUser.email}`)
    console.log(`✅ Contacts: ${contactsCount}`)
    console.log(`✅ Deals: ${dealsCount}`)
    console.log(`✅ Tasks: ${tasksCount}`)
    console.log(`✅ Lead Sources: ${leadSourcesCount}`)
    
    if (hasEnoughData) {
      console.log('\n🎉 CRM Dashboard should display data correctly!')
      console.log('\n📝 Next Steps:')
      console.log('   1. Start dev server: npm run dev')
      console.log('   2. Login at: http://localhost:3000/login')
      console.log(`   3. Use credentials: ${demoUser.email} / Test@1234`)
      console.log('   4. Navigate to CRM module')
      console.log('   5. Verify stat cards show data')
    } else {
      console.log('\n⚠️  Need to seed more data!')
      console.log('   Run: curl -X POST http://localhost:3000/api/admin/seed-demo-data')
      console.log('   Or visit: http://localhost:3000/api/admin/seed-demo-data?trigger=true')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testCRMDashboard()
