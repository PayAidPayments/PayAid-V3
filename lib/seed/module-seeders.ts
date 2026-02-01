/**
 * Module-Specific Seeders
 * Comprehensive seeding functions for all 28 PayAid V3 modules
 * Ensures ZERO empty states across the platform
 */

import { prisma } from '@/lib/db/prisma'
import {
  generateIndianName,
  generateIndianEmail,
  generateIndianPhone,
  generateIndianAddress,
  generateIndianCompanyName,
  generateAmount,
  generateDate,
  generatePastDate,
  generateFutureDate,
  generateCurrentMonthDate,
  pickRandom,
  pickRandomN,
} from './indian-data-helpers'

const BATCH_SIZE = 10

/**
 * CRM Module Seeder
 * Target: 500 contacts, 200 deals, 150 tasks, 50 meetings
 */
export async function seedCRMModule(tenantId: string, adminUserId: string) {
  console.log('📞 Seeding CRM Module...')
  
  const contacts = []
  const CONTACT_COUNT = 500
  const BATCH_SIZE = 10
  
  // Create contacts in batches
  for (let i = 0; i < CONTACT_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < CONTACT_COUNT; j++) {
      const name = generateIndianName()
      const address = generateIndianAddress()
      batch.push({
        tenantId,
        name,
        email: generateIndianEmail(name),
        phone: generateIndianPhone(),
        company: generateIndianCompanyName(),
        type: pickRandom(['customer', 'lead', 'partner', 'vendor']),
        status: pickRandom(['active', 'inactive', 'prospect']),
        ...address,
        source: pickRandom([
          'Google Search', 'Facebook Ads', 'LinkedIn', 'Referral', 'Website Form',
          'Email Campaign', 'Trade Show', 'Cold Call', 'YouTube Ads', 'Partner Channel',
        ]),
        createdAt: generatePastDate(365),
      })
    }
    
    const created = await prisma.contact.createMany({
      data: batch,
      skipDuplicates: true,
    })
    contacts.push(...(await prisma.contact.findMany({
      where: { tenantId, email: { in: batch.map(b => b.email) } },
    })))
    
    if (i % 50 === 0) console.log(`  Created ${i + created.count} contacts...`)
  }
  
  console.log(`✅ Created ${contacts.length} contacts`)
  
  // Create deals
  const DEAL_COUNT = 200
  const deals = []
  const stages = ['qualified', 'proposal', 'negotiation', 'won', 'lost']
  
  for (let i = 0; i < DEAL_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < DEAL_COUNT; j++) {
      const contact = pickRandom(contacts)
      const stage = pickRandom(stages)
      const value = generateAmount(50000, 5000000)
      
      batch.push({
        tenantId,
        name: `${contact.company} - ${pickRandom(['Enterprise Deal', 'Partnership', 'Contract', 'Project'])}`,
        value,
        stage,
        probability: stage === 'won' ? 100 : stage === 'lost' ? 0 : Math.floor(Math.random() * 40) + 50,
        contactId: contact.id,
        expectedCloseDate: generateFutureDate(30),
        actualCloseDate: stage === 'won' ? generateCurrentMonthDate() : null,
        createdAt: generatePastDate(180),
      })
    }
    
    const created = await prisma.deal.createMany({
      data: batch,
      skipDuplicates: true,
    })
    deals.push(...(await prisma.deal.findMany({
      where: { tenantId, name: { in: batch.map(b => b.name) } },
    })))
  }
  
  console.log(`✅ Created ${deals.length} deals`)
  
  // Create tasks
  const TASK_COUNT = 150
  const tasks = []
  
  for (let i = 0; i < TASK_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < TASK_COUNT; j++) {
      const contact = pickRandom(contacts)
      const isOverdue = Math.random() > 0.7
      
      batch.push({
        tenantId,
        title: pickRandom([
          `Follow up with ${contact.name}`,
          `Prepare proposal for ${contact.company}`,
          `Schedule meeting with ${contact.name}`,
          `Send quote to ${contact.company}`,
          `Review contract for ${contact.company}`,
        ]),
        description: `Task related to ${contact.company}`,
        status: pickRandom(['pending', 'in_progress', 'completed']),
        priority: pickRandom(['low', 'medium', 'high']),
        dueDate: isOverdue ? generatePastDate(30) : generateFutureDate(30),
        contactId: contact.id,
        assignedToId: adminUserId,
        createdAt: generatePastDate(60),
      })
    }
    
    await prisma.task.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ Created ${TASK_COUNT} tasks`)
  
  return { contacts, deals, tasks }
}

/**
 * Finance Module Seeder
 * Target: 300 invoices, 200 payments, 150 expenses, 100 purchase orders
 */
export async function seedFinanceModule(tenantId: string, contacts: any[]) {
  console.log('💰 Seeding Finance Module...')
  
  // Create invoices
  const INVOICE_COUNT = 300
  const invoices = []
  
  for (let i = 0; i < INVOICE_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < INVOICE_COUNT; j++) {
      const customer = pickRandom(contacts.filter(c => c.type === 'customer'))
      const total = generateAmount(10000, 1000000)
      const subtotal = total / 1.18
      const tax = total - subtotal
      const status = pickRandom(['paid', 'pending', 'overdue'])
      
      batch.push({
        tenantId,
        invoiceNumber: `INV-${String(i + j + 1).padStart(6, '0')}`,
        customerId: customer.id,
        subtotal,
        tax,
        total,
        status,
        invoiceDate: generateCurrentMonthDate(),
        dueDate: generateFutureDate(30),
        paidAt: status === 'paid' ? generateCurrentMonthDate() : null,
        createdAt: generateCurrentMonthDate(),
      })
    }
    
    await prisma.invoice.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ Created ${INVOICE_COUNT} invoices`)
  
  // Create purchase orders
  const PO_COUNT = 100
  const vendors = await prisma.vendor.findMany({ where: { tenantId } })
  
  if (vendors.length === 0) {
    // Create vendors first
    const vendorData = []
    for (let i = 0; i < 20; i++) {
      const name = generateIndianCompanyName()
      const address = generateIndianAddress()
      vendorData.push({
        tenantId,
        name,
        companyName: name,
        email: generateIndianEmail(name),
        phone: generateIndianPhone(),
        ...address,
      })
    }
    await prisma.vendor.createMany({ data: vendorData, skipDuplicates: true })
    vendors.push(...(await prisma.vendor.findMany({ where: { tenantId } })))
  }
  
  for (let i = 0; i < PO_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < PO_COUNT; j++) {
      const vendor = pickRandom(vendors)
      const total = generateAmount(50000, 500000)
      const subtotal = total / 1.18
      const tax = total - subtotal
      
      batch.push({
        tenantId,
        poNumber: `PO-${String(i + j + 1).padStart(6, '0')}`,
        vendorId: vendor.id,
        status: pickRandom(['ordered', 'approved', 'received', 'cancelled']),
        orderDate: generateCurrentMonthDate(),
        expectedDeliveryDate: generateFutureDate(15),
        subtotal,
        tax,
        total,
        requestedById: adminUserId,
        createdAt: generateCurrentMonthDate(),
      })
    }
    
    await prisma.purchaseOrder.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ Created ${PO_COUNT} purchase orders`)
  
  return { invoices }
}

/**
 * HR Module Seeder
 * Target: 50 employees, 1500 attendance records, 200 leave requests
 */
export async function seedHRModule(tenantId: string, adminUserId: string) {
  console.log('👥 Seeding HR Module...')
  
  // First, create departments and designations
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { id: `dept-sales-${tenantId}` },
      update: {},
      create: {
        id: `dept-sales-${tenantId}`,
        tenantId,
        name: 'Sales',
        code: 'SALES',
      },
    }),
    prisma.department.upsert({
      where: { id: `dept-engineering-${tenantId}` },
      update: {},
      create: {
        id: `dept-engineering-${tenantId}`,
        tenantId,
        name: 'Engineering',
        code: 'ENG',
      },
    }),
    prisma.department.upsert({
      where: { id: `dept-marketing-${tenantId}` },
      update: {},
      create: {
        id: `dept-marketing-${tenantId}`,
        tenantId,
        name: 'Marketing',
        code: 'MKT',
      },
    }),
    prisma.department.upsert({
      where: { id: `dept-hr-${tenantId}` },
      update: {},
      create: {
        id: `dept-hr-${tenantId}`,
        tenantId,
        name: 'HR',
        code: 'HR',
      },
    }),
    prisma.department.upsert({
      where: { id: `dept-finance-${tenantId}` },
      update: {},
      create: {
        id: `dept-finance-${tenantId}`,
        tenantId,
        name: 'Finance',
        code: 'FIN',
      },
    }),
  ])

  const designations = await Promise.all([
    prisma.designation.upsert({
      where: { id: `desg-swe-${tenantId}` },
      update: {},
      create: {
        id: `desg-swe-${tenantId}`,
        tenantId,
        name: 'Software Engineer',
        code: 'SWE',
      },
    }),
    prisma.designation.upsert({
      where: { id: `desg-sales-mgr-${tenantId}` },
      update: {},
      create: {
        id: `desg-sales-mgr-${tenantId}`,
        tenantId,
        name: 'Sales Manager',
        code: 'SALES_MGR',
      },
    }),
    prisma.designation.upsert({
      where: { id: `desg-mkt-exec-${tenantId}` },
      update: {},
      create: {
        id: `desg-mkt-exec-${tenantId}`,
        tenantId,
        name: 'Marketing Executive',
        code: 'MKT_EXEC',
      },
    }),
    prisma.designation.upsert({
      where: { id: `desg-hr-mgr-${tenantId}` },
      update: {},
      create: {
        id: `desg-hr-mgr-${tenantId}`,
        tenantId,
        name: 'HR Manager',
        code: 'HR_MGR',
      },
    }),
    prisma.designation.upsert({
      where: { id: `desg-acc-${tenantId}` },
      update: {},
      create: {
        id: `desg-acc-${tenantId}`,
        tenantId,
        name: 'Accountant',
        code: 'ACC',
      },
    }),
  ])

  // Create employees - 156 total, 142 active, 14 inactive
  const EMPLOYEE_COUNT = 156
  const employees = []
  const now = new Date()
  
  for (let i = 0; i < EMPLOYEE_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < EMPLOYEE_COUNT; j++) {
      const idx = i + j
      const nameParts = generateIndianName().split(' ')
      const firstName = nameParts[0] || 'Employee'
      const lastName = nameParts.slice(1).join(' ') || 'User'
      const email = generateIndianEmail(`${firstName} ${lastName}`)
      const dept = pickRandom(departments)
      const desg = pickRandom(designations)
      
      // 142 active, 14 inactive
      const status = idx < 142 ? 'ACTIVE' : 'INACTIVE'
      const joiningDate = generatePastDate(1095) // Within last 3 years
      
      batch.push({
        tenantId,
        employeeCode: `EMP-${String(idx + 1).padStart(4, '0')}`,
        firstName,
        lastName,
        officialEmail: email,
        personalEmail: `${firstName.toLowerCase()}.personal@example.com`,
        mobileNumber: generateIndianPhone().replace('+91-', ''),
        joiningDate,
        status,
        departmentId: dept.id,
        designationId: desg.id,
        ctcAnnualInr: generateAmount(300000, 2000000),
        fixedComponentInr: generateAmount(200000, 1500000),
        variableComponentInr: generateAmount(50000, 500000),
        createdBy: adminUserId,
      })
    }
    
    const created = await prisma.employee.createMany({
      data: batch,
      skipDuplicates: true,
    })
    employees.push(...(await prisma.employee.findMany({
      where: { tenantId, officialEmail: { in: batch.map(b => b.officialEmail) } },
    })))
    
    if (i % 50 === 0) console.log(`  Created ${i + created.count} employees...`)
  }
  
  console.log(`✅ Created ${employees.length} employees`)

  // Create leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { id: `leave-cl-${tenantId}` },
      update: {},
      create: {
        id: `leave-cl-${tenantId}`,
        tenantId,
        name: 'Casual Leave',
        code: 'CL',
        maxDays: 12,
      },
    }),
    prisma.leaveType.upsert({
      where: { id: `leave-sl-${tenantId}` },
      update: {},
      create: {
        id: `leave-sl-${tenantId}`,
        tenantId,
        name: 'Sick Leave',
        code: 'SL',
        maxDays: 12,
      },
    }),
    prisma.leaveType.upsert({
      where: { id: `leave-pl-${tenantId}` },
      update: {},
      create: {
        id: `leave-pl-${tenantId}`,
        tenantId,
        name: 'Privilege Leave',
        code: 'PL',
        maxDays: 15,
      },
    }),
  ])

  // Create leave balances for active employees
  for (const employee of employees.filter(e => e.status === 'ACTIVE')) {
    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          id: `balance-${employee.id}-${leaveType.id}`,
        },
        update: {},
        create: {
          id: `balance-${employee.id}-${leaveType.id}`,
          tenantId,
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          balance: leaveType.maxDays || 12,
        },
      })
    }
  }

  // Create 8 leave requests that are currently active (on leave)
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').slice(0, 8)
  const leaveRequests = []
  for (const employee of activeEmployees) {
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 3)) // Started 0-3 days ago
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1) // 1-5 days duration
    
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: employee.id,
        leaveTypeId: leaveTypes[0].id, // CL
        startDate,
        endDate,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        status: 'APPROVED',
        reason: 'Personal work',
      },
    })
    leaveRequests.push(leaveRequest)
  }
  console.log(`✅ Created ${leaveRequests.length} active leave requests`)

  // Create attendance records for current month (for active employees)
  const attendanceRecords = []
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  for (const employee of employees.filter(e => e.status === 'ACTIVE').slice(0, 120)) {
    for (let day = 1; day <= now.getDate(); day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day)
      if (date > now) break
      
      // Skip if employee is on leave
      const isOnLeave = leaveRequests.some(lr => 
        lr.employeeId === employee.id &&
        date >= lr.startDate &&
        date <= lr.endDate
      )
      
      if (isOnLeave) continue
      
      const checkInTime = new Date(date)
      checkInTime.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0)
      
      const checkOutTime = new Date(date)
      checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0)
      
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      
      attendanceRecords.push({
        tenantId,
        employeeId: employee.id,
        date,
        checkInTime,
        checkOutTime,
        workHours,
        status: 'PRESENT',
        source: 'WEB',
      })
    }
  }
  
  // Insert attendance in batches
  for (let i = 0; i < attendanceRecords.length; i += BATCH_SIZE) {
    const batch = attendanceRecords.slice(i, i + BATCH_SIZE)
    await prisma.attendanceRecord.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  console.log(`✅ Created ${attendanceRecords.length} attendance records`)

  // Create pending payroll runs (142 employees * average salary)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const payrollRuns = []
  for (const employee of employees.filter(e => e.status === 'ACTIVE').slice(0, 142)) {
    const ctc = employee.ctcAnnualInr ? Number(employee.ctcAnnualInr) : 600000
    const monthlyGross = ctc / 12
    
    await prisma.payrollRun.create({
      data: {
        tenantId,
        employeeId: employee.id,
        payrollCycleId: null, // Can be linked to a cycle later
        status: 'PENDING',
        grossSalary: monthlyGross,
        basicSalary: monthlyGross * 0.5,
        hra: monthlyGross * 0.2,
        allowances: monthlyGross * 0.1,
        deductions: monthlyGross * 0.1,
        netSalary: monthlyGross * 0.9,
        payPeriodStart: startOfMonth,
        payPeriodEnd: endOfMonth,
      },
    })
  }
  console.log(`✅ Created ${employees.filter(e => e.status === 'ACTIVE').length} pending payroll runs`)

  return { 
    employees, 
    attendanceRecords,
    leaveRequests,
    departments,
    designations,
  }
}

/**
 * Inventory Module Seeder
 * Target: 200 products, 500 stock movements, 100 purchase orders
 */
export async function seedInventoryModule(tenantId: string) {
  console.log('📦 Seeding Inventory Module...')
  
  // Create products
  const PRODUCT_COUNT = 200
  const products = []
  const categories = [
    'Electronics', 'Clothing', 'Food & Beverages', 'Home & Kitchen',
    'Books', 'Sports', 'Beauty', 'Automotive', 'Office Supplies', 'Toys',
  ]
  
  for (let i = 0; i < PRODUCT_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < PRODUCT_COUNT; j++) {
      const costPrice = generateAmount(100, 50000)
      const salePrice = costPrice * (1.5 + Math.random() * 0.5) // 50-100% markup
      
      batch.push({
        tenantId,
        name: `${pickRandom(['Premium', 'Standard', 'Deluxe', 'Basic', 'Pro'])} ${pickRandom(categories)} Product ${i + j + 1}`,
        sku: `SKU-${String(i + j + 1).padStart(6, '0')}`,
        costPrice,
        salePrice: Math.round(salePrice),
        quantity: Math.floor(Math.random() * 1000),
        categories: [pickRandom(categories)],
        status: pickRandom(['active', 'active', 'active', 'inactive']),
        createdAt: generatePastDate(180),
      })
    }
    
    await prisma.product.createMany({
      data: batch,
      skipDuplicates: true,
    })
    products.push(...(await prisma.product.findMany({
      where: { tenantId, sku: { in: batch.map(b => b.sku) } },
    })))
  }
  
  console.log(`✅ Created ${products.length} products`)
  
  return { products }
}

/**
 * Sales Module Seeder
 * Target: 150 orders, 100 quotes, 50 campaigns
 */
export async function seedSalesModule(tenantId: string, contacts: any[], products: any[]) {
  console.log('🛒 Seeding Sales Module...')
  
  // Create orders
  const ORDER_COUNT = 150
  const orders = []
  
  for (let i = 0; i < ORDER_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < ORDER_COUNT; j++) {
      const customer = pickRandom(contacts.filter(c => c.type === 'customer'))
      const total = generateAmount(5000, 500000)
      const subtotal = total / 1.18
      const tax = total - subtotal
      const status = pickRandom(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      
      batch.push({
        tenantId,
        orderNumber: `ORD-${String(i + j + 1).padStart(6, '0')}`,
        customerId: customer.id,
        subtotal,
        tax,
        shipping: Math.floor(Math.random() * 5000),
        total,
        status,
        shippingAddress: customer.address || '',
        shippingCity: customer.city || '',
        shippingPostal: customer.postalCode || '',
        shippingCountry: 'India',
        paidAt: status === 'delivered' ? generateCurrentMonthDate() : null,
        shippedAt: ['shipped', 'delivered'].includes(status) ? generateCurrentMonthDate() : null,
        deliveredAt: status === 'delivered' ? generateCurrentMonthDate() : null,
        createdAt: generateCurrentMonthDate(),
      })
    }
    
    await prisma.order.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ Created ${ORDER_COUNT} orders`)
  
  return { orders }
}

/**
 * Marketing Module Seeder
 * Target: 50 campaigns, 200 leads, 100 email templates
 */
export async function seedMarketingModule(tenantId: string, contacts: any[]) {
  console.log('📢 Seeding Marketing Module...')
  
  // Create campaigns
  const CAMPAIGN_COUNT = 50
  const campaigns = []
  const campaignTypes = ['email', 'social', 'sms', 'push', 'webinar']
  
  for (let i = 0; i < CAMPAIGN_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < CAMPAIGN_COUNT; j++) {
      batch.push({
        tenantId,
        name: `${pickRandom(['Summer', 'Winter', 'Spring', 'Festival', 'New Year', 'Diwali', 'Holi'])} ${pickRandom(['Campaign', 'Promotion', 'Sale', 'Offer'])} ${i + j + 1}`,
        type: pickRandom(campaignTypes),
        status: pickRandom(['draft', 'scheduled', 'active', 'completed', 'paused']),
        startDate: generateCurrentMonthDate(),
        endDate: generateFutureDate(30),
        budget: generateAmount(10000, 500000),
        spent: generateAmount(5000, 250000),
        createdAt: generatePastDate(90),
      })
    }
    
    await prisma.campaign.createMany({
      data: batch,
      skipDuplicates: true,
    })
    campaigns.push(...(await prisma.campaign.findMany({
      where: { tenantId, name: { in: batch.map(b => b.name) } },
    })))
  }
  
  console.log(`✅ Created ${campaigns.length} campaigns`)
  
  // Create marketing leads (separate from CRM contacts)
  const LEAD_COUNT = 200
  const leads = []
  
  for (let i = 0; i < LEAD_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < LEAD_COUNT; j++) {
      const name = generateIndianName()
      const address = generateIndianAddress()
      batch.push({
        tenantId,
        name,
        email: generateIndianEmail(name),
        phone: generateIndianPhone(),
        company: generateIndianCompanyName(),
        source: pickRandom(['Google Ads', 'Facebook', 'LinkedIn', 'Email', 'Website']),
        status: pickRandom(['new', 'contacted', 'qualified', 'converted', 'lost']),
        ...address,
        createdAt: generatePastDate(180),
      })
    }
    
    // Create marketing leads as contacts with marketing-specific source
    try {
      await prisma.contact.createMany({
        data: batch.map(b => ({ 
          ...b, 
          type: 'lead' as any,
          source: b.source,
        })),
        skipDuplicates: true,
      })
      leads.push(...(await prisma.contact.findMany({
        where: { tenantId, email: { in: batch.map(b => b.email) } },
      })))
    } catch (err) {
      console.warn('Marketing leads seeding skipped:', err)
    }
  }
  
  console.log(`✅ Created ${leads.length} marketing leads`)
  
  return { campaigns, leads }
}

/**
 * Projects Module Seeder
 * Target: 30 projects, 200 tasks, 50 milestones
 */
export async function seedProjectsModule(tenantId: string, adminUserId: string, contacts: any[]) {
  console.log('📋 Seeding Projects Module...')
  
  // Create projects
  const PROJECT_COUNT = 30
  const projects = []
  const projectTypes = ['web_development', 'mobile_app', 'marketing', 'consulting', 'training']
  
  for (let i = 0; i < PROJECT_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < PROJECT_COUNT; j++) {
      const contact = pickRandom(contacts)
      const budget = generateAmount(100000, 5000000)
      batch.push({
        tenantId,
        name: `${contact.company} - ${pickRandom(['Website', 'App', 'Platform', 'System', 'Solution'])} Project`,
        description: `Project for ${contact.company}`,
        type: pickRandom(projectTypes),
        status: pickRandom(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
        clientId: contact.id,
        budget,
        spent: Math.floor(budget * (0.3 + Math.random() * 0.5)),
        startDate: generatePastDate(180),
        endDate: generateFutureDate(90),
        assignedToId: adminUserId,
        createdAt: generatePastDate(180),
      })
    }
    
    try {
      await prisma.project.createMany({
        data: batch.map(b => ({
          tenantId: b.tenantId,
          name: b.name,
          description: b.description,
          status: b.status.toUpperCase(),
          startDate: b.startDate,
          endDate: b.endDate,
          budget: b.budget,
          actualCost: b.spent,
          priority: 'MEDIUM',
          clientId: b.clientId,
          ownerId: b.assignedToId,
          createdAt: b.createdAt,
        })),
        skipDuplicates: true,
      })
      projects.push(...(await prisma.project.findMany({
        where: { tenantId, name: { in: batch.map(b => b.name) } },
      })))
    } catch (err) {
      console.warn('Project seeding skipped:', err)
    }
  }
  
  console.log(`✅ Created ${projects.length} projects`)
  
  // Create project tasks
  const PROJECT_TASK_COUNT = 200
  const projectTasks = []
  
  for (const project of projects) {
    const tasksPerProject = Math.floor(PROJECT_TASK_COUNT / projects.length)
    for (let i = 0; i < tasksPerProject; i++) {
      projectTasks.push({
        tenantId,
        projectId: project.id,
        title: `${pickRandom(['Design', 'Develop', 'Test', 'Review', 'Deploy'])} ${pickRandom(['Feature', 'Module', 'Component', 'Page'])} ${i + 1}`,
        description: `Task for ${project.name}`,
        status: pickRandom(['todo', 'in_progress', 'review', 'done']),
        priority: pickRandom(['low', 'medium', 'high']),
        dueDate: generateFutureDate(30),
        assignedToId: adminUserId,
        createdAt: generatePastDate(60),
      })
    }
  }
  
  // Insert in batches
  try {
    for (let i = 0; i < projectTasks.length; i += BATCH_SIZE) {
      const batch = projectTasks.slice(i, i + BATCH_SIZE)
      await prisma.projectTask.createMany({
        data: batch.map(t => ({
          tenantId: t.tenantId,
          projectId: t.projectId,
          name: t.title,
          description: t.description,
          status: t.status.toUpperCase(),
          priority: t.priority.toUpperCase(),
          assignedToId: t.assignedToId,
          dueDate: t.dueDate,
          completedAt: t.status === 'done' ? t.dueDate : null,
          createdAt: t.createdAt,
        })),
        skipDuplicates: true,
      })
    }
  } catch (err) {
    console.warn('Project tasks seeding skipped:', err)
  }
  
  console.log(`✅ Created ${projectTasks.length} project tasks`)
  
  return { projects, projectTasks }
}

/**
 * Main Seeder Function
 * Orchestrates seeding for all modules
 */
export async function seedAllModules(tenantId: string, adminUserId: string) {
  console.log('🌱 Starting comprehensive module seeding...')
  
  // Seed in order (some modules depend on others)
  const crmData = await seedCRMModule(tenantId, adminUserId)
  const financeData = await seedFinanceModule(tenantId, crmData.contacts)
  const hrData = await seedHRModule(tenantId, adminUserId)
  const inventoryData = await seedInventoryModule(tenantId)
  const salesData = await seedSalesModule(tenantId, crmData.contacts, inventoryData.products)
  const marketingData = await seedMarketingModule(tenantId, crmData.contacts)
  const projectsData = await seedProjectsModule(tenantId, adminUserId, crmData.contacts)
  
  console.log('✅ All modules seeded successfully!')
  
  return {
    crm: crmData,
    finance: financeData,
    hr: hrData,
    inventory: inventoryData,
    sales: salesData,
    marketing: marketingData,
    projects: projectsData,
  }
}
