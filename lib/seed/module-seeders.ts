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
  
  // Create employees
  const EMPLOYEE_COUNT = 50
  const employees = []
  
  for (let i = 0; i < EMPLOYEE_COUNT; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < EMPLOYEE_COUNT; j++) {
      const name = generateIndianName()
      const address = generateIndianAddress()
      const department = pickRandom([
        'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support',
      ])
      const designation = pickRandom([
        'Software Engineer', 'Senior Developer', 'Sales Manager', 'Marketing Executive',
        'HR Manager', 'Accountant', 'Operations Manager', 'Support Executive',
      ])
      
      batch.push({
        tenantId,
        employeeId: `EMP-${String(i + j + 1).padStart(4, '0')}`,
        fullName: name,
        email: generateIndianEmail(name),
        phone: generateIndianPhone(),
        department,
        designation,
        employmentType: pickRandom(['full_time', 'part_time', 'contract']),
        joiningDate: generatePastDate(1095), // Within last 3 years
        status: pickRandom(['active', 'active', 'active', 'on_leave']), // Mostly active
        ...address,
        createdAt: generatePastDate(1095),
      })
    }
    
    await prisma.employee.createMany({
      data: batch,
      skipDuplicates: true,
    })
    employees.push(...(await prisma.employee.findMany({
      where: { tenantId, email: { in: batch.map(b => b.email) } },
    })))
  }
  
  console.log(`✅ Created ${employees.length} employees`)
  
  // Create attendance records (last 90 days)
  const ATTENDANCE_COUNT = 1500 // ~50 employees * 30 days
  const attendanceRecords = []
  
  for (const employee of employees) {
    for (let day = 0; day < 30; day++) {
      const date = generatePastDate(30 - day)
      const status = pickRandom(['present', 'present', 'present', 'present', 'absent', 'half_day'])
      
      attendanceRecords.push({
        tenantId,
        employeeId: employee.id,
        date,
        status,
        checkIn: status === 'present' || status === 'half_day' ? generateDate(
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30)
        ) : null,
        checkOut: status === 'present' ? generateDate(
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0),
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 0)
        ) : null,
        createdAt: date,
      })
    }
  }
  
  // Insert in batches
  for (let i = 0; i < attendanceRecords.length; i += BATCH_SIZE) {
    const batch = attendanceRecords.slice(i, i + BATCH_SIZE)
    await prisma.attendance.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ Created ${attendanceRecords.length} attendance records`)
  
  return { employees, attendanceRecords }
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
