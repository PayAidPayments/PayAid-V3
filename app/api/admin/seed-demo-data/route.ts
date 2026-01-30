import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import { generateTenantId } from '@/lib/utils/tenant-id'
import { seedAllModules } from '@/lib/seed/module-seeders'

// Inline industry seeding functions
async function seedIndustryDataInline(tenantId: string, contacts: any[]) {
  // Agriculture
  const crops = [
    { cropName: 'Wheat', cropType: 'CEREAL', season: 'RABI', area: 10, status: 'GROWING' },
    { cropName: 'Rice', cropType: 'CEREAL', season: 'KHARIF', area: 15, status: 'SOWN' },
    { cropName: 'Tomato', cropType: 'VEGETABLE', season: 'SUMMER', area: 5, status: 'GROWING' },
  ]
  for (const crop of crops) {
    await prisma.agricultureCrop.upsert({
      where: { id: `crop-${crop.cropName.toLowerCase()}` },
      update: {},
      create: {
        id: `crop-${crop.cropName.toLowerCase()}`,
        tenantId,
        cropName: crop.cropName,
        cropType: crop.cropType,
        season: crop.season,
        area: crop.area,
        sowingDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        status: crop.status,
      },
    })
  }

  // Healthcare - Create patients and lab tests
  if (contacts.length > 0) {
    for (let i = 0; i < Math.min(3, contacts.length); i++) {
      const contact = contacts[i]
      const patient = await prisma.healthcarePatient.upsert({
        where: { id: `patient-${i + 1}` },
        update: {},
        create: {
          id: `patient-${i + 1}`,
          tenantId,
          contactId: contact.id,
          patientId: `PAT-${String(i + 1).padStart(4, '0')}`,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
        },
      })

      await prisma.healthcareLabTest.upsert({
        where: { id: `labtest-${i + 1}` },
        update: {},
        create: {
          id: `labtest-${i + 1}`,
          tenantId,
          patientId: patient.id,
          testName: ['Complete Blood Count', 'Blood Sugar', 'Chest X-Ray'][i],
          testType: 'BLOOD',
          status: i === 0 ? 'COMPLETED' : 'ORDERED',
          labName: 'City Diagnostic Lab',
        },
      })
    }
  }

  // Education - Create students
  if (contacts.length > 0) {
    for (let i = 0; i < Math.min(5, contacts.length); i++) {
      const contact = contacts[i]
      await prisma.educationStudent.upsert({
        where: { id: `student-${i + 1}` },
        update: {},
        create: {
          id: `student-${i + 1}`,
          tenantId,
          contactId: contact.id,
          studentId: `STU-${String(i + 1).padStart(4, '0')}`,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
          admissionDate: new Date(),
          status: 'ACTIVE',
        },
      })
    }
  }
}

/**
 * GET /api/admin/seed-demo-data
 * Shows instructions or triggers seeding (for browser access)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trigger = searchParams.get('trigger') === 'true'
    
    // If trigger=true, actually seed the data
    if (trigger) {
      // Call the POST handler logic
      const result = await seedDemoData()
      return NextResponse.json({
        success: true,
        message: 'Demo data seeded successfully',
        ...result,
      })
    }
    
    // Otherwise, show instructions
    return NextResponse.json({
      message: 'Demo Data Seeding Endpoint',
      instructions: [
        'To seed demo data, use one of these methods:',
        '1. Visit this URL with ?trigger=true parameter',
        '2. Use POST request: curl -X POST https://payaid-v3.vercel.app/api/admin/seed-demo-data',
        '3. Use browser console: fetch("/api/admin/seed-demo-data", {method: "POST"})',
      ],
      quickSeed: 'Visit: /api/admin/seed-demo-data?trigger=true',
      note: 'This will create contacts, deals, tasks, and lead sources for your tenant.',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('[SEED_DEMO_DATA] GET Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        message: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seed-demo-data
 * Seeds comprehensive sample data for the demo tenant
 * This endpoint should be protected in production
 */
export async function POST(request: NextRequest) {
  try {
    const result = await seedDemoData()
    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('[SEED_DEMO_DATA] POST Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        message: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Shared seeding logic
 */
async function seedDemoData() {
  try {
    // Disconnect any existing connections to free up the pool
    try {
      await prisma.$disconnect()
      // Wait a moment for connections to close
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (disconnectError) {
      // Ignore disconnect errors - connections may already be closed
      console.warn('Disconnect warning (non-critical):', disconnectError)
    }

    // Get or create demo tenant with personalized ID
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' },
    })

    const businessName = 'Demo Business Pvt Ltd'
    const expectedPrefix = businessName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
    
    // Check if existing tenant has personalized ID format
    const hasPersonalizedId = tenant ? (tenant.id.startsWith(expectedPrefix) && tenant.id.includes('-')) : false
    
    if (!tenant || !hasPersonalizedId) {
      // If tenant exists but doesn't have personalized ID, delete it first
      if (tenant) {
        console.log(`⚠️  Existing demo tenant has non-personalized ID: ${tenant.id}`)
        console.log(`   Deleting and recreating with personalized ID...`)
        
        // Delete all related data first (cascade should handle most, but be explicit for safety)
        const tenantIdToDelete = tenant.id
        
        // Delete in transaction to ensure clean deletion
        await prisma.$transaction(async (tx) => {
          // Delete users first (they reference tenant)
          await tx.user.deleteMany({ where: { tenantId: tenantIdToDelete } })
          // Delete tenant (cascade will handle related records)
          await tx.tenant.delete({ where: { id: tenantIdToDelete } })
        })
        
        console.log(`   ✅ Deleted old tenant`)
      }
      
      // Generate personalized tenant ID from business name
      const existingTenants = await prisma.tenant.findMany({
        select: { id: true },
      })
      const existingIds = existingTenants.map(t => t.id)
      const personalizedTenantId = generateTenantId(businessName, existingIds)

      // Create demo tenant with personalized ID
      tenant = await prisma.tenant.create({
        data: {
          id: personalizedTenantId, // Use personalized ID instead of default CUID
          name: businessName,
          subdomain: 'demo',
          plan: 'professional',
          status: 'active',
          maxContacts: 1000,
          maxInvoices: 1000,
          maxUsers: 10,
          maxStorage: 10240,
          gstin: '29ABCDE1234F1Z5',
          address: '123 Business Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91-80-12345678',
          email: 'contact@demobusiness.com',
          website: 'https://demobusiness.com',
        },
      })
      console.log(`✅ Created demo tenant with personalized ID: ${tenant.id}`)
    } else {
      console.log(`✅ Using existing demo tenant with personalized ID: ${tenant.id}`)
    }

    const tenantId = tenant.id
    console.log(`🌱 Seeding sample data for tenant: ${tenant.name} (${tenantId})`)

    // Get current date for all date calculations
    const now = new Date()

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('Test@1234', 10)

    // Ensure admin user exists
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId: tenantId,
      },
    })

    // Lead source names for assignment
    const sourceNames = [
      'Google Search',
      'Facebook Ads',
      'LinkedIn',
      'Referral',
      'Website Form',
      'Email Campaign',
      'Trade Show',
      'Cold Call',
      'YouTube Ads',
      'Partner Channel',
    ]

    // Create sample contacts (20+ contacts)
    const contactNames = [
      { name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', type: 'customer', company: 'Tech Solutions Inc' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', type: 'customer', company: 'Digital Marketing Pro' },
      { name: 'Acme Corporation', email: 'contact@acme.com', phone: '+91-22-12345678', type: 'customer', company: 'Acme Corporation' },
      { name: 'Rajesh Kumar', email: 'rajesh@startup.com', phone: '+91-9876543212', type: 'lead', company: 'StartupXYZ' },
      { name: 'Priya Sharma', email: 'priya@enterprise.com', phone: '+91-9876543213', type: 'lead', company: 'Enterprise Solutions' },
      { name: 'Amit Patel', email: 'amit@tech.com', phone: '+91-9876543214', type: 'lead', company: 'Tech Innovations' },
      { name: 'Sneha Reddy', email: 'sneha@business.com', phone: '+91-9876543215', type: 'lead', company: 'Business Growth Co' },
      { name: 'Vikram Singh', email: 'vikram@corp.com', phone: '+91-9876543216', type: 'customer', company: 'Corporate Ventures' },
      { name: 'Anjali Mehta', email: 'anjali@services.com', phone: '+91-9876543217', type: 'lead', company: 'Professional Services Ltd' },
      { name: 'Rahul Gupta', email: 'rahul@consulting.com', phone: '+91-9876543218', type: 'lead', company: 'Consulting Group' },
      { name: 'Meera Nair', email: 'meera@digital.com', phone: '+91-9876543219', type: 'customer', company: 'Digital Solutions' },
      { name: 'Prospect Industries', email: 'info@prospect.com', phone: '+91-22-87654321', type: 'lead', company: 'Prospect Industries' },
      { name: 'Client Services Inc', email: 'contact@clientservices.com', phone: '+91-9876543220', type: 'customer', company: 'Client Services Inc' },
      { name: 'Partner Network', email: 'hello@partnernetwork.com', phone: '+91-9876543221', type: 'customer', company: 'Partner Network' },
      { name: 'Hot Lead Corp', email: 'sales@hotlead.com', phone: '+91-9876543222', type: 'lead', company: 'Hot Lead Corp' },
      { name: 'New Lead Solutions', email: 'info@newlead.com', phone: '+91-9876543223', type: 'lead', company: 'New Lead Solutions' },
      { name: 'Big Deal Enterprises', email: 'contact@bigdeal.com', phone: '+91-9876543224', type: 'lead', company: 'Big Deal Enterprises' },
      { name: 'Customer First Ltd', email: 'hello@customerfirst.com', phone: '+91-9876543225', type: 'customer', company: 'Customer First Ltd' },
      { name: 'Enterprise Group', email: 'info@enterprisegroup.com', phone: '+91-9876543226', type: 'lead', company: 'Enterprise Group' },
      { name: 'Global Solutions', email: 'contact@globalsolutions.com', phone: '+91-9876543227', type: 'customer', company: 'Global Solutions' },
    ]

    // Delete existing contacts and recreate (to ensure fresh data)
    await prisma.contact.deleteMany({ where: { tenantId } })
    
    // Create contacts in batches to avoid connection pool exhaustion
    const contacts: any[] = []
    const BATCH_SIZE = 3 // Process 3 contacts at a time (reduced to avoid pool exhaustion)
    
    for (let i = 0; i < contactNames.length; i += BATCH_SIZE) {
      const batch = contactNames.slice(i, i + BATCH_SIZE)
      const batchContacts = await Promise.all(
        batch.map((contact, batchIdx) => {
          const idx = i + batchIdx
          // Spread contacts across last 12 months, with some in March 2025
          let createdAt: Date
          if (idx < 5) {
            // First 5 contacts in March 2025
            createdAt = new Date(2025, 2, 1 + (idx % 28)) // March 2025
          } else {
            // Rest spread across last 12 months
            const monthsAgo = (idx - 5) % 12
            createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + (idx % 28))
          }
          
          return prisma.contact.create({
            data: {
              tenantId,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              type: contact.type as any,
              status: 'active',
              country: 'India',
              city: 'Bangalore',
              state: 'Karnataka',
              postalCode: '560001',
              address: `${contact.company}, Bangalore`,
              source: sourceNames[idx % sourceNames.length],
              createdAt,
            },
          })
        })
      )
      contacts.push(...batchContacts)
      // Delay between batches to allow connections to be released
      if (i + BATCH_SIZE < contactNames.length) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
      }
    }

    console.log(`✅ Created ${contacts.length} contacts`)

    // Create sample deals (20+ deals with various stages)
    const dealsData = [
      // Active deals
      { name: 'Tech Solutions Enterprise Deal', value: 150000, stage: 'proposal', probability: 60, contactIdx: 0 },
      { name: 'Digital Marketing Annual Contract', value: 120000, stage: 'negotiation', probability: 75, contactIdx: 1 },
      { name: 'Acme Corporation Expansion', value: 200000, stage: 'qualified', probability: 50, contactIdx: 2 },
      { name: 'StartupXYZ Series A Support', value: 80000, stage: 'proposal', probability: 65, contactIdx: 3 },
      { name: 'Enterprise Solutions Partnership', value: 300000, stage: 'negotiation', probability: 80, contactIdx: 4 },
      { name: 'Tech Innovations Platform', value: 180000, stage: 'qualified', probability: 55, contactIdx: 5 },
      { name: 'Business Growth Co Strategy', value: 95000, stage: 'proposal', probability: 70, contactIdx: 6 },
      { name: 'Corporate Ventures Deal', value: 220000, stage: 'negotiation', probability: 75, contactIdx: 7 },
      { name: 'Professional Services Contract', value: 110000, stage: 'qualified', probability: 60, contactIdx: 8 },
      { name: 'Consulting Group Engagement', value: 140000, stage: 'proposal', probability: 65, contactIdx: 9 },
      { name: 'Digital Solutions Upgrade', value: 75000, stage: 'qualified', probability: 50, contactIdx: 10 },
      { name: 'Prospect Industries Deal', value: 160000, stage: 'proposal', probability: 70, contactIdx: 11 },
      { name: 'Client Services Expansion', value: 190000, stage: 'negotiation', probability: 80, contactIdx: 12 },
      { name: 'Partner Network Collaboration', value: 130000, stage: 'qualified', probability: 55, contactIdx: 13 },
      { name: 'Hot Lead Corp Opportunity', value: 170000, stage: 'proposal', probability: 75, contactIdx: 14 },
      { name: 'New Lead Solutions Deal', value: 100000, stage: 'qualified', probability: 60, contactIdx: 15 },
      { name: 'Big Deal Enterprises Contract', value: 250000, stage: 'negotiation', probability: 85, contactIdx: 16 },
      { name: 'Customer First Partnership', value: 145000, stage: 'proposal', probability: 70, contactIdx: 17 },
      { name: 'Enterprise Group Deal', value: 300000, stage: 'negotiation', probability: 80, contactIdx: 18 },
      
      // Won deals - Created this month for revenue
      { name: 'Won - Customer First Ltd', value: 150000, stage: 'won', probability: 100, contactIdx: 17 },
      { name: 'Won - Partner Network', value: 85000, stage: 'won', probability: 100, contactIdx: 13 },
      { name: 'Won - Client Services Inc', value: 200000, stage: 'won', probability: 100, contactIdx: 12 },
      { name: 'Won - Digital Marketing Pro', value: 120000, stage: 'won', probability: 100, contactIdx: 1 },
      { name: 'Won - Enterprise Solutions', value: 95000, stage: 'won', probability: 100, contactIdx: 4 },
    ]

    // Delete existing deals and recreate
    await prisma.deal.deleteMany({ where: { tenantId } })
    
    // Get current month dates
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const daysInMonth = endOfMonth.getDate()
    const daysElapsed = now.getDate() // Days elapsed in current month
    
    // Create deals in batches to avoid connection pool exhaustion
    const deals: any[] = []
    const DEAL_BATCH_SIZE = 3 // Reduced to avoid pool exhaustion
    
    for (let i = 0; i < dealsData.length; i += DEAL_BATCH_SIZE) {
      const batch = dealsData.slice(i, i + DEAL_BATCH_SIZE)
      const batchDeals = await Promise.all(
        batch.map((deal, batchIdx) => {
          const idx = i + batchIdx
          // For won deals, create them within current month for revenue calculation
          // For regular deals, create some this month and some in future months
          let dealCreatedAt: Date
          let dealExpectedCloseDate: Date
          
          if (deal.stage === 'won') {
            // Won deals: created this month (spread across the month)
            const dayInMonth = Math.min((idx % daysInMonth) + 1, daysInMonth)
            dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
            dealExpectedCloseDate = dealCreatedAt
          } else if (idx < 5) {
            // First 5 regular deals: created this month
            const dayInMonth = Math.min((idx % daysElapsed) + 1, daysElapsed)
            dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
            // Expected close date: within current month (for "Deals Closing This Month")
            const closeDay = Math.min(dayInMonth + 7, daysInMonth)
            dealExpectedCloseDate = new Date(now.getFullYear(), now.getMonth(), closeDay, 12, 0, 0)
          } else {
            // Other deals: created in past months or future
            const monthsAgo = (idx - 5) % 6 // Spread across last 6 months
            dealCreatedAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15, 12, 0, 0)
            dealExpectedCloseDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
          
          return prisma.deal.create({
            data: {
              tenantId,
              name: deal.name,
              value: deal.value,
              stage: deal.stage as any,
              probability: deal.probability,
              expectedCloseDate: dealExpectedCloseDate,
              contactId: contacts[deal.contactIdx].id,
              actualCloseDate: deal.stage === 'won' ? dealCreatedAt : undefined,
              createdAt: dealCreatedAt,
            },
          })
        })
      )
      deals.push(...batchDeals)
      // Delay between batches to allow connections to be released
      if (i + DEAL_BATCH_SIZE < dealsData.length) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
      }
    }

    console.log(`✅ Created ${deals.length} deals`)

    // Create sample products
    const productsData = [
      { name: 'Premium Software License', sku: 'PROD-001', costPrice: 5000, salePrice: 10000 },
      { name: 'Enterprise Support Package', sku: 'PROD-002', costPrice: 15000, salePrice: 30000 },
      { name: 'Basic Plan Subscription', sku: 'PROD-003', costPrice: 2000, salePrice: 5000 },
      { name: 'Professional Services', sku: 'PROD-004', costPrice: 10000, salePrice: 25000 },
      { name: 'Custom Development', sku: 'PROD-005', costPrice: 25000, salePrice: 60000 },
    ]

    await prisma.product.deleteMany({ where: { tenantId } })
    
    const products = await Promise.all(
      productsData.map((product) =>
        prisma.product.create({
          data: {
            tenantId,
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            quantity: 100,
            categories: ['Software', 'Services'],
          },
        })
      )
    )

    console.log(`✅ Created ${products.length} products`)

    // Create sample invoices
    const invoicesData = [
      { customerIdx: 0, total: 54000, status: 'paid' },
      { customerIdx: 1, total: 31500, status: 'paid' },
      { customerIdx: 2, total: 135000, status: 'paid' },
      { customerIdx: 7, total: 180000, status: 'paid' },
      { customerIdx: 10, total: 90000, status: 'paid' },
      { customerIdx: 12, total: 81000, status: 'paid' },
      { customerIdx: 13, total: 162000, status: 'paid' },
      { customerIdx: 17, total: 108000, status: 'paid' },
      { customerIdx: 19, total: 540000, status: 'pending' },
      { customerIdx: 0, total: 27000, status: 'overdue' },
    ]

    await prisma.invoice.deleteMany({ where: { tenantId } })
    
    const invoices = await Promise.all(
      invoicesData.map((invoice, idx) => {
        const subtotal = invoice.total / 1.18
        const tax = invoice.total - subtotal
        // Create invoices in current month for Finance dashboard stats
        const invoiceDate = new Date(now.getFullYear(), now.getMonth(), Math.min(idx + 1, 28), 12, 0, 0)
        return prisma.invoice.create({
          data: {
            tenantId,
            invoiceNumber: `INV-${String(idx + 1).padStart(4, '0')}`,
            status: invoice.status as any,
            subtotal,
            tax,
            total: invoice.total,
            customerId: contacts[invoice.customerIdx].id,
            invoiceDate,
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            // For paid invoices, set paidAt in current month (within last 7 days) for Finance dashboard stats
            paidAt: invoice.status === 'paid' ? new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - (idx % 7)), 14, 0, 0) : null,
            createdAt: invoiceDate, // Set createdAt to current month for stats
          },
        })
      })
    )

    console.log(`✅ Created ${invoices.length} invoices`)

    // Create sample orders
    const ordersData = [
      { customerIdx: 0, total: 54000, status: 'delivered' },
      { customerIdx: 1, total: 31500, status: 'delivered' },
      { customerIdx: 2, total: 135000, status: 'delivered' },
      { customerIdx: 7, total: 180000, status: 'delivered' },
      { customerIdx: 10, total: 90000, status: 'shipped' },
      { customerIdx: 12, total: 81000, status: 'confirmed' },
    ]

    await prisma.order.deleteMany({ where: { tenantId } })
    
    const orders = await Promise.all(
      ordersData.map((order, idx) => {
        const subtotal = order.total / 1.18
        const tax = order.total - subtotal
        return prisma.order.create({
          data: {
            tenantId,
            orderNumber: `ORD-${String(idx + 1).padStart(4, '0')}`,
            status: order.status as any,
            subtotal,
            tax,
            shipping: 0,
            total: order.total,
            shippingAddress: contacts[order.customerIdx].address || '',
            shippingCity: contacts[order.customerIdx].city || '',
            shippingPostal: contacts[order.customerIdx].postalCode || '',
            shippingCountry: 'India',
            customerId: contacts[order.customerIdx].id,
            paidAt: order.status === 'delivered' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
            shippedAt: ['shipped', 'delivered'].includes(order.status) ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) : null,
            deliveredAt: order.status === 'delivered' ? new Date(now.getTime()) : null,
          },
        })
      })
    )

    console.log(`✅ Created ${orders.length} orders`)

    // Create sample tasks (mix of overdue and upcoming)
    const tasksData = [
      // Overdue tasks (past due dates)
      { title: 'Follow up with John Doe', status: 'pending', priority: 'high', contactIdx: 0, daysOffset: -5 },
      { title: 'Prepare proposal for Acme', status: 'in_progress', priority: 'medium', contactIdx: 2, daysOffset: -3 },
      { title: 'Review contract with Enterprise Group', status: 'pending', priority: 'high', contactIdx: 18, daysOffset: -7 },
      { title: 'Send quote to Tech Innovations', status: 'pending', priority: 'medium', contactIdx: 5, daysOffset: -2 },
      { title: 'Schedule demo for Business Growth Co', status: 'pending', priority: 'high', contactIdx: 6, daysOffset: -1 },
      // More overdue tasks
      { title: 'Call back Customer First Ltd', status: 'pending', priority: 'high', contactIdx: 17, daysOffset: -10 },
      { title: 'Send contract to Partner Network', status: 'in_progress', priority: 'medium', contactIdx: 13, daysOffset: -4 },
      { title: 'Follow up on proposal - Client Services', status: 'pending', priority: 'high', contactIdx: 12, daysOffset: -6 },
      { title: 'Update CRM records for Digital Marketing', status: 'pending', priority: 'low', contactIdx: 1, daysOffset: -8 },
      { title: 'Schedule meeting with Enterprise Solutions', status: 'pending', priority: 'medium', contactIdx: 4, daysOffset: -9 },
      // Upcoming tasks (not overdue)
      { title: 'Prepare presentation for Global Solutions', status: 'pending', priority: 'high', contactIdx: 19, daysOffset: 7 },
      { title: 'Review proposal draft', status: 'in_progress', priority: 'medium', contactIdx: 10, daysOffset: 5 },
      { title: 'Send follow-up email', status: 'pending', priority: 'low', contactIdx: 11, daysOffset: 3 },
      { title: 'Schedule product demo', status: 'pending', priority: 'high', contactIdx: 14, daysOffset: 10 },
      { title: 'Prepare contract documents', status: 'pending', priority: 'medium', contactIdx: 15, daysOffset: 6 },
    ]

    await prisma.task.deleteMany({ where: { tenantId } })
    
    const tasks = await Promise.all(
      tasksData.map((task) =>
        prisma.task.create({
          data: {
            tenantId,
            title: task.title,
            description: `Task: ${task.title}`,
            status: task.status as any,
            priority: task.priority as any,
            dueDate: new Date(now.getTime() + task.daysOffset * 24 * 60 * 60 * 1000),
            contactId: contacts[task.contactIdx]?.id || contacts[0].id,
            assignedToId: adminUser.id,
          },
        })
      )
    )

    console.log(`✅ Created ${tasks.length} tasks`)

    // Create Lead Sources and assign to contacts
    const leadSourcesData = [
      { name: 'Google Search', type: 'organic' },
      { name: 'Facebook Ads', type: 'paid_ad' },
      { name: 'LinkedIn', type: 'social' },
      { name: 'Referral', type: 'referral' },
      { name: 'Website Form', type: 'organic' },
      { name: 'Email Campaign', type: 'email' },
      { name: 'Trade Show', type: 'event' },
      { name: 'Cold Call', type: 'direct' },
      { name: 'YouTube Ads', type: 'paid_ad' },
      { name: 'Partner Channel', type: 'partner' },
    ]

    await prisma.leadSource.deleteMany({ where: { tenantId } })
    
    const leadSources = await Promise.all(
      leadSourcesData.map((source) =>
        prisma.leadSource.create({
          data: {
            tenantId,
            name: source.name,
            type: source.type,
            leadsCount: 0,
            conversionsCount: 0,
            totalValue: 0,
            avgDealValue: 0,
            conversionRate: 0,
            roi: 0,
          },
        })
      )
    )

    // Assign lead sources to contacts in batches (already set source field above, now link sourceId)
    const UPDATE_BATCH_SIZE = 3 // Reduced to avoid pool exhaustion
    for (let i = 0; i < contacts.length; i += UPDATE_BATCH_SIZE) {
      const batch = contacts.slice(i, i + UPDATE_BATCH_SIZE)
      await Promise.all(
        batch.map((contact, batchIdx) => {
          const idx = i + batchIdx
          return prisma.contact.update({
            where: { id: contact.id },
            data: {
              sourceId: leadSources[idx % leadSources.length].id,
            },
          })
        })
      )
      // Delay between batches to allow connections to be released
      if (i + UPDATE_BATCH_SIZE < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
      }
    }

    // Update lead source counts (with delay to avoid connection pool exhaustion)
    for (let i = 0; i < leadSources.length; i++) {
      const source = leadSources[i]
      const sourceContacts = await prisma.contact.count({
        where: { tenantId, sourceId: source.id },
      })
      const sourceDeals = await prisma.deal.findMany({
        where: {
          tenantId,
          contact: { sourceId: source.id },
        },
        select: { value: true, stage: true },
      })
      const wonDeals = sourceDeals.filter(d => d.stage === 'won')
      const totalValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      
      await prisma.leadSource.update({
        where: { id: source.id },
        data: {
          leadsCount: sourceContacts,
          conversionsCount: wonDeals.length,
          totalValue,
          avgDealValue: wonDeals.length > 0 ? totalValue / wonDeals.length : 0,
          conversionRate: sourceContacts > 0 ? (wonDeals.length / sourceContacts) * 100 : 0,
        },
      })
      
      // Small delay between updates
      if (i < leadSources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Created ${leadSources.length} lead sources`)

    // Create sample purchase orders for Finance dashboard
    const purchaseOrdersData = [
      { vendorName: 'Vendor A', total: 50000, status: 'ordered' },
      { vendorName: 'Vendor B', total: 75000, status: 'ordered' },
      { vendorName: 'Vendor C', total: 120000, status: 'approved' },
      { vendorName: 'Vendor D', total: 90000, status: 'received' },
      { vendorName: 'Vendor E', total: 60000, status: 'ordered' },
    ]

    // Create vendors first if they don't exist
    const vendors = await Promise.all(
      purchaseOrdersData.map((po, idx) =>
        prisma.vendor.upsert({
          where: { id: `vendor-${idx + 1}` },
          update: {},
          create: {
            id: `vendor-${idx + 1}`,
            tenantId,
            name: po.vendorName,
            companyName: `${po.vendorName} Pvt Ltd`,
            email: `contact@${po.vendorName.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+91-9876543${String(idx + 1).padStart(3, '0')}`,
            address: 'Bangalore, Karnataka',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
          },
        })
      )
    )

    await prisma.purchaseOrder.deleteMany({ where: { tenantId } })
    
    const purchaseOrders = await Promise.all(
      purchaseOrdersData.map((po, idx) => {
        const poDate = new Date(now.getFullYear(), now.getMonth(), Math.min(idx + 1, 28), 12, 0, 0)
        return prisma.purchaseOrder.create({
          data: {
            tenantId,
            poNumber: `PO-${String(idx + 1).padStart(4, '0')}`,
            vendorId: vendors[idx].id,
            status: po.status as any,
            orderDate: poDate,
            expectedDeliveryDate: new Date(poDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            subtotal: po.total / 1.18,
            tax: po.total - (po.total / 1.18),
            total: po.total,
            requestedById: adminUser.id,
            createdAt: poDate, // Set createdAt to current month for stats
          },
        })
      })
    )

    console.log(`✅ Created ${purchaseOrders.length} purchase orders`)

    // Seed industry-specific data
    console.log('🌾 Seeding Industry Data...')
    try {
      await seedIndustryDataInline(tenantId, contacts)
      console.log('✅ Industry Data seeded')
    } catch (industryError) {
      console.warn('Industry data seeding failed (non-critical):', industryError)
    }

    // Invalidate cache
    try {
      const { cache } = await import('@/lib/redis/client')
      await cache.deletePattern(`contacts:${tenantId}:*`)
      await cache.deletePattern(`deals:${tenantId}:*`)
      await cache.deletePattern(`dashboard:stats:${tenantId}`)
    } catch (cacheError) {
      console.warn('Cache invalidation failed (non-critical):', cacheError)
    }

    return {
      success: true,
      message: 'Sample data seeded successfully',
      tenantId: tenant.id,
      businessName: tenant.name,
      hasPersonalizedId: tenant.id.startsWith('demo-') && tenant.id.includes('-'),
      counts: {
        contacts: contacts.length + (moduleData.crm?.contacts?.length || 0),
        deals: deals.length + (moduleData.crm?.deals?.length || 0),
        products: products.length + (moduleData.inventory?.products?.length || 0),
        invoices: invoices.length + (moduleData.finance?.invoices?.length || 0),
        orders: orders.length + (moduleData.sales?.orders?.length || 0),
        tasks: tasks.length + (moduleData.crm?.tasks?.length || 0),
        leadSources: leadSources.length,
        purchaseOrders: purchaseOrders.length,
        employees: moduleData.hr?.employees?.length || 0,
        attendance: moduleData.hr?.attendanceRecords?.length || 0,
      },
    }
  } catch (error) {
    console.error('Seed demo data error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    throw new Error(`Failed to seed demo data: ${errorMessage}`)
  }
}

