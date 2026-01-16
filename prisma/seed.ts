import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with comprehensive demo data...')

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Test@1234', 10)

  // Create Test Tenant 1 - Demo Business
  const tenant1 = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {
      industry: 'service-business',
      industrySubType: null,
      industrySettings: { 
        setForDemo: true,
        setAt: new Date().toISOString(),
      },
    },
    create: {
      name: 'Demo Business Pvt Ltd',
      subdomain: 'demo',
      plan: 'professional',
      status: 'active',
      maxContacts: 1000,
      maxInvoices: 1000,
      maxUsers: 10,
      maxStorage: 10240,
      // Business Information
      gstin: '29ABCDE1234F1Z5',
      address: '123 Business Park, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      phone: '+91-80-12345678',
      email: 'contact@demobusiness.com',
      website: 'https://demobusiness.com',
      // Industry Configuration
      industry: 'service-business',
      industrySubType: null,
      industrySettings: { 
        setForDemo: true,
        setAt: new Date().toISOString(),
      },
    },
  })

  // Create Test User 1 - Owner
  // Force update password if user exists
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: hashedPassword, // Always update password to ensure it's correct
    },
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'owner',
      tenantId: tenant1.id,
    },
  })

  // Create Test Tenant 2 - Sample Company
  const tenant2 = await prisma.tenant.upsert({
    where: { subdomain: 'sample' },
    update: {},
    create: {
      name: 'Sample Company',
      subdomain: 'sample',
      plan: 'starter',
      status: 'active',
      maxContacts: 500,
      maxInvoices: 500,
      maxUsers: 5,
      maxStorage: 5120,
      gstin: '27ABCDE5678G2Z6',
      address: '456 Corporate Tower, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400053',
      country: 'India',
      phone: '+91-22-87654321',
      email: 'info@samplecompany.com',
    },
  })

  // Create Test User 2
  const user2 = await prisma.user.upsert({
    where: { email: 'user@sample.com' },
    update: {},
    create: {
      email: 'user@sample.com',
      name: 'Sample User',
      password: hashedPassword,
      role: 'owner',
      tenantId: tenant2.id,
    },
  })

  // Create comprehensive contacts (20+ contacts with variety)
  const contactNames = [
    { name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', type: 'customer', company: 'Tech Solutions Inc' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', type: 'customer', company: 'Digital Marketing Pro' },
    { name: 'Acme Corporation', email: 'contact@acme.com', phone: '+91-22-12345678', type: 'customer', company: 'Acme Corporation' },
    { name: 'Rajesh Kumar', email: 'rajesh@startup.com', phone: '+91-9876543212', type: 'lead', company: 'StartupXYZ' },
    { name: 'Priya Sharma', email: 'priya@enterprise.com', phone: '+91-9876543213', type: 'lead', company: 'Enterprise Solutions' },
    { name: 'Amit Patel', email: 'amit@tech.com', phone: '+91-9876543214', type: 'qualified', company: 'Tech Innovations' },
    { name: 'Sneha Reddy', email: 'sneha@business.com', phone: '+91-9876543215', type: 'qualified', company: 'Business Growth Co' },
    { name: 'Vikram Singh', email: 'vikram@corp.com', phone: '+91-9876543216', type: 'customer', company: 'Corporate Ventures' },
    { name: 'Anjali Mehta', email: 'anjali@services.com', phone: '+91-9876543217', type: 'customer', company: 'Service Providers Ltd' },
    { name: 'Rahul Gupta', email: 'rahul@digital.com', phone: '+91-9876543218', type: 'lead', company: 'Digital Agency' },
    { name: 'Suresh Iyer', email: 'suresh@vendor.com', phone: '+91-9876543219', type: 'vendor', company: 'Supply Chain Co' },
    { name: 'Meera Nair', email: 'meera@vendor.com', phone: '+91-9876543220', type: 'vendor', company: 'Logistics Solutions' },
    { name: 'Kiran Desai', email: 'kiran@prospect.com', phone: '+91-9876543221', type: 'lead', company: 'Prospect Industries' },
    { name: 'Arjun Menon', email: 'arjun@client.com', phone: '+91-9876543222', type: 'customer', company: 'Client Services Inc' },
    { name: 'Divya Rao', email: 'divya@partner.com', phone: '+91-9876543223', type: 'customer', company: 'Partner Network' },
    { name: 'Nikhil Joshi', email: 'nikhil@hotlead.com', phone: '+91-9876543224', type: 'qualified', company: 'Hot Lead Corp' },
    { name: 'Pooja Shah', email: 'pooja@newlead.com', phone: '+91-9876543225', type: 'lead', company: 'New Lead Solutions' },
    { name: 'Manish Agarwal', email: 'manish@bigdeal.com', phone: '+91-9876543226', type: 'qualified', company: 'Big Deal Enterprises' },
    { name: 'Swati Verma', email: 'swati@customer.com', phone: '+91-9876543227', type: 'customer', company: 'Customer First Ltd' },
    { name: 'Rohit Malhotra', email: 'rohit@enterprise.com', phone: '+91-9876543228', type: 'customer', company: 'Enterprise Group' },
  ]

  const contacts = await Promise.all(
    contactNames.map((contact, idx) =>
      prisma.contact.upsert({
        where: { id: `contact-${idx + 1}` },
        update: {},
        create: {
          id: `contact-${idx + 1}`,
          tenantId: tenant1.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          type: contact.type as any,
          status: 'active',
          address: `${idx + 1}${idx % 2 === 0 ? ' Main Street' : ' Park Avenue'}`,
          city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][idx % 5],
          state: ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'][idx % 5],
          postalCode: ['560001', '400053', '110001', '600001', '500001'][idx % 5],
          country: 'India',
        },
      })
    )
  )

  // Create comprehensive products (15+ products)
  const productData = [
    { name: 'Premium Widget', sku: 'WID-001', costPrice: 600, salePrice: 900, quantity: 100, category: 'Widgets' },
    { name: 'Standard Widget', sku: 'WID-002', costPrice: 300, salePrice: 450, quantity: 200, category: 'Widgets' },
    { name: 'Consulting Service', sku: 'SRV-001', costPrice: 0, salePrice: 5000, quantity: 0, category: 'Services' },
    { name: 'Enterprise Software License', sku: 'SW-001', costPrice: 5000, salePrice: 15000, quantity: 50, category: 'Software' },
    { name: 'Basic Software License', sku: 'SW-002', costPrice: 2000, salePrice: 8000, quantity: 100, category: 'Software' },
    { name: 'Annual Maintenance Contract', sku: 'AMC-001', costPrice: 0, salePrice: 25000, quantity: 0, category: 'Services' },
    { name: 'Training Program', sku: 'TRG-001', costPrice: 0, salePrice: 15000, quantity: 0, category: 'Services' },
    { name: 'Custom Development', sku: 'DEV-001', costPrice: 0, salePrice: 50000, quantity: 0, category: 'Services' },
    { name: 'Hardware Component A', sku: 'HW-001', costPrice: 1200, salePrice: 2000, quantity: 75, category: 'Hardware' },
    { name: 'Hardware Component B', sku: 'HW-002', costPrice: 800, salePrice: 1500, quantity: 120, category: 'Hardware' },
    { name: 'Support Package - Basic', sku: 'SUP-001', costPrice: 0, salePrice: 5000, quantity: 0, category: 'Services' },
    { name: 'Support Package - Premium', sku: 'SUP-002', costPrice: 0, salePrice: 15000, quantity: 0, category: 'Services' },
    { name: 'Data Migration Service', sku: 'MIG-001', costPrice: 0, salePrice: 30000, quantity: 0, category: 'Services' },
    { name: 'Cloud Hosting - Monthly', sku: 'HOST-001', costPrice: 500, salePrice: 2000, quantity: 0, category: 'Services' },
    { name: 'Cloud Hosting - Annual', sku: 'HOST-002', costPrice: 5000, salePrice: 20000, quantity: 0, category: 'Services' },
  ]

  const products = await Promise.all(
    productData.map((product, idx) =>
      prisma.product.upsert({
        where: { id: `product-${idx + 1}` },
        update: {},
        create: {
          id: `product-${idx + 1}`,
          tenantId: tenant1.id,
          name: product.name,
          description: `High-quality ${product.name.toLowerCase()}`,
          sku: product.sku,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          quantity: product.quantity,
          categories: [product.category],
        },
      })
    )
  )

  // Create deals with various stages and reasons
  const now = new Date()
  const dealsData = [
    // Leads
    { name: 'New Lead - TechCorp', value: 25000, stage: 'lead', probability: 20, contactIdx: 3, reason: null },
    { name: 'Website Inquiry - StartupXYZ', value: 15000, stage: 'lead', probability: 15, contactIdx: 3, reason: null },
    { name: 'Cold Outreach - Digital Agency', value: 30000, stage: 'lead', probability: 10, contactIdx: 9, reason: null },
    
    // Qualified
    { name: 'Qualified - Tech Innovations', value: 75000, stage: 'qualified', probability: 40, contactIdx: 5, reason: null },
    { name: 'Qualified - Business Growth Co', value: 50000, stage: 'qualified', probability: 35, contactIdx: 6, reason: null },
    { name: 'Qualified - Hot Lead Corp', value: 100000, stage: 'qualified', probability: 45, contactIdx: 15, reason: null },
    { name: 'Qualified - Big Deal Enterprises', value: 200000, stage: 'qualified', probability: 50, contactIdx: 17, reason: null },
    
    // Proposal
    { name: 'Proposal Sent - Enterprise Solutions', value: 150000, stage: 'proposal', probability: 60, contactIdx: 4, reason: null },
    { name: 'Proposal Sent - Corporate Ventures', value: 125000, stage: 'proposal', probability: 55, contactIdx: 7, reason: null },
    { name: 'Proposal Sent - Service Providers', value: 80000, stage: 'proposal', probability: 65, contactIdx: 8, reason: null },
    
    // Negotiation
    { name: 'Q1 Enterprise Deal', value: 50000, stage: 'negotiation', probability: 75, contactIdx: 0, reason: null },
    { name: 'Acme Corporation Contract', value: 100000, stage: 'negotiation', probability: 70, contactIdx: 2, reason: null },
    { name: 'Enterprise Group Deal', value: 300000, stage: 'negotiation', probability: 80, contactIdx: 19, reason: null },
    
    // Won
    { name: 'Won - Customer First Ltd', value: 60000, stage: 'won', probability: 100, contactIdx: 18, reason: 'Competitive pricing and excellent support commitment' },
    { name: 'Won - Partner Network', value: 90000, stage: 'won', probability: 100, contactIdx: 14, reason: 'Strong product fit and quick implementation timeline' },
    { name: 'Won - Client Services Inc', value: 45000, stage: 'won', probability: 100, contactIdx: 13, reason: 'Best value proposition and proven track record' },
    { name: 'Won - Digital Marketing Pro', value: 35000, stage: 'won', probability: 100, contactIdx: 1, reason: 'Flexible payment terms and customization options' },
    
    // Lost
    { name: 'Lost - Prospect Industries', value: 40000, stage: 'lost', probability: 0, contactIdx: 12, reason: 'Budget constraints - client decided to postpone project' },
    { name: 'Lost - New Lead Solutions', value: 25000, stage: 'lost', probability: 0, contactIdx: 16, reason: 'Chose competitor due to lower pricing' },
    { name: 'Lost - Prospect Industries', value: 55000, stage: 'lost', probability: 0, contactIdx: 12, reason: 'Timeline mismatch - needed faster delivery than we could provide' },
  ]

  const deals = await Promise.all(
    dealsData.map((deal, idx) =>
      prisma.deal.upsert({
        where: { id: `deal-${idx + 1}` },
        update: {},
        create: {
          id: `deal-${idx + 1}`,
          tenantId: tenant1.id,
          name: deal.name,
          value: deal.value,
          stage: deal.stage as any,
          probability: deal.probability,
          expectedCloseDate: new Date(now.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000),
          contactId: contacts[deal.contactIdx].id,
          lostReason: deal.stage === 'lost' ? deal.reason || undefined : undefined,
          actualCloseDate: deal.stage === 'won' ? new Date(now.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000) : undefined,
        },
      })
    )
  )

  // Create comprehensive tasks (20+ tasks)
  const tasksData = [
    { title: 'Follow up with John Doe', status: 'pending', priority: 'high', contactIdx: 0, daysFromNow: 2 },
    { title: 'Prepare proposal for Acme', status: 'in_progress', priority: 'medium', contactIdx: 2, daysFromNow: 5 },
    { title: 'Review contract with Enterprise Group', status: 'pending', priority: 'high', contactIdx: 19, daysFromNow: 1 },
    { title: 'Send quote to Tech Innovations', status: 'pending', priority: 'medium', contactIdx: 5, daysFromNow: 3 },
    { title: 'Schedule demo for Business Growth Co', status: 'pending', priority: 'high', contactIdx: 6, daysFromNow: 2 },
    { title: 'Follow up on proposal - Corporate Ventures', status: 'pending', priority: 'medium', contactIdx: 7, daysFromNow: 4 },
    { title: 'Complete KYC for Customer First Ltd', status: 'in_progress', priority: 'low', contactIdx: 18, daysFromNow: 7 },
    { title: 'Prepare presentation for Hot Lead Corp', status: 'pending', priority: 'high', contactIdx: 15, daysFromNow: 1 },
    { title: 'Negotiate terms with Big Deal Enterprises', status: 'in_progress', priority: 'high', contactIdx: 17, daysFromNow: 2 },
    { title: 'Send thank you email to Partner Network', status: 'pending', priority: 'low', contactIdx: 14, daysFromNow: 0 },
    { title: 'Update CRM for won deals', status: 'pending', priority: 'medium', contactIdx: null, daysFromNow: 3 },
    { title: 'Review lost deals - lessons learned', status: 'pending', priority: 'low', contactIdx: null, daysFromNow: 5 },
    { title: 'Prepare monthly report', status: 'pending', priority: 'medium', contactIdx: null, daysFromNow: 7 },
    { title: 'Follow up with Digital Marketing Pro', status: 'completed', priority: 'low', contactIdx: 1, daysFromNow: -5 },
    { title: 'Send invoice to Client Services Inc', status: 'completed', priority: 'medium', contactIdx: 13, daysFromNow: -2 },
  ]

  const tasks = await Promise.all(
    tasksData.map((task, idx) =>
      prisma.task.upsert({
        where: { id: `task-${idx + 1}` },
        update: {},
        create: {
          id: `task-${idx + 1}`,
          tenantId: tenant1.id,
          title: task.title,
          description: `Task description for ${task.title}`,
          status: task.status as any,
          priority: task.priority as any,
          dueDate: new Date(now.getTime() + task.daysFromNow * 24 * 60 * 60 * 1000),
          contactId: task.contactIdx !== null ? contacts[task.contactIdx].id : null,
          assignedToId: user1.id,
          completedAt: task.status === 'completed' ? new Date(now.getTime() + task.daysFromNow * 24 * 60 * 60 * 1000) : null,
        },
      })
    )
  )

  // Create orders with revenue for past and current financial year
  // Financial year in India: April 1 to March 31
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const isCurrentFY = currentMonth >= 3 // April (3) onwards is current FY
  
  const fyStartCurrent = new Date(isCurrentFY ? currentYear : currentYear - 1, 3, 1) // April 1
  const fyEndCurrent = new Date(isCurrentFY ? currentYear + 1 : currentYear, 2, 31) // March 31
  const fyStartPrevious = new Date(isCurrentFY ? currentYear - 1 : currentYear - 2, 3, 1)
  const fyEndPrevious = new Date(isCurrentFY ? currentYear : currentYear - 1, 2, 31)

  const ordersData = [
    // Current FY orders
    { customerIdx: 0, total: 54000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 30 * 24 * 60 * 60 * 1000) },
    { customerIdx: 1, total: 31500, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 60 * 24 * 60 * 60 * 1000) },
    { customerIdx: 2, total: 135000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 90 * 24 * 60 * 60 * 1000) },
    { customerIdx: 7, total: 180000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 120 * 24 * 60 * 60 * 1000) },
    { customerIdx: 8, total: 90000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 150 * 24 * 60 * 60 * 1000) },
    { customerIdx: 13, total: 81000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 180 * 24 * 60 * 60 * 1000) },
    { customerIdx: 14, total: 162000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 210 * 24 * 60 * 60 * 1000) },
    { customerIdx: 18, total: 108000, status: 'delivered', date: new Date(fyStartCurrent.getTime() + 240 * 24 * 60 * 60 * 1000) },
    { customerIdx: 19, total: 540000, status: 'shipped', date: new Date(fyStartCurrent.getTime() + 270 * 24 * 60 * 60 * 1000) },
    { customerIdx: 0, total: 27000, status: 'confirmed', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    
    // Previous FY orders
    { customerIdx: 1, total: 45000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 30 * 24 * 60 * 60 * 1000) },
    { customerIdx: 2, total: 180000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 60 * 24 * 60 * 60 * 1000) },
    { customerIdx: 7, total: 225000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 90 * 24 * 60 * 60 * 1000) },
    { customerIdx: 8, total: 135000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 120 * 24 * 60 * 60 * 1000) },
    { customerIdx: 13, total: 108000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 150 * 24 * 60 * 60 * 1000) },
    { customerIdx: 14, total: 270000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 180 * 24 * 60 * 60 * 1000) },
    { customerIdx: 18, total: 162000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 210 * 24 * 60 * 60 * 1000) },
    { customerIdx: 19, total: 450000, status: 'delivered', date: new Date(fyStartPrevious.getTime() + 240 * 24 * 60 * 60 * 1000) },
  ]

  const orders = await Promise.all(
    ordersData.map((order, idx) => {
      const orderDate = order.date
      const subtotal = order.total / 1.18 // Remove 18% GST
      const tax = order.total - subtotal
      
      return prisma.order.upsert({
        where: { id: `order-${idx + 1}` },
        update: {},
        create: {
          id: `order-${idx + 1}`,
          tenantId: tenant1.id,
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
          createdAt: orderDate,
          paidAt: order.status === 'delivered' ? new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
          shippedAt: ['shipped', 'delivered'].includes(order.status) ? new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000) : null,
          deliveredAt: order.status === 'delivered' ? new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        },
      })
    })
  )

  // Create order items for each order
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const numItems = Math.floor(Math.random() * 3) + 1 // 1-3 items per order
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const price = product.salePrice
      const total = price * quantity
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          quantity,
          price,
          total,
        },
      })
    }
  }

  // Create invoices (mix of paid, sent, overdue, draft)
  const invoicesData = [
    { customerIdx: 0, total: 54000, status: 'paid', daysFromNow: -30 },
    { customerIdx: 1, total: 31500, status: 'paid', daysFromNow: -25 },
    { customerIdx: 2, total: 135000, status: 'paid', daysFromNow: -20 },
    { customerIdx: 7, total: 180000, status: 'paid', daysFromNow: -15 },
    { customerIdx: 8, total: 90000, status: 'sent', daysFromNow: -10 },
    { customerIdx: 13, total: 81000, status: 'sent', daysFromNow: -5 },
    { customerIdx: 14, total: 162000, status: 'overdue', daysFromNow: -35 },
    { customerIdx: 18, total: 108000, status: 'overdue', daysFromNow: -40 },
    { customerIdx: 19, total: 540000, status: 'sent', daysFromNow: -2 },
    { customerIdx: 0, total: 27000, status: 'draft', daysFromNow: 0 },
  ]

  const invoices = await Promise.all(
    invoicesData.map((inv, idx) => {
      const invoiceDate = new Date(now.getTime() + inv.daysFromNow * 24 * 60 * 60 * 1000)
      const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const subtotal = inv.total / 1.18
      const tax = inv.total - subtotal
      
      return prisma.invoice.upsert({
        where: { id: `invoice-${idx + 1}` },
        update: {},
        create: {
          id: `invoice-${idx + 1}`,
          tenantId: tenant1.id,
          invoiceNumber: `INV-${String(idx + 1).padStart(4, '0')}`,
          status: inv.status as any,
          subtotal,
          tax,
          total: inv.total,
          gstRate: 18,
          gstAmount: tax,
          invoiceDate,
          dueDate,
          paidAt: inv.status === 'paid' ? new Date(invoiceDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
          customerId: contacts[inv.customerIdx].id,
        },
      })
    })
  )

  // ============================================
  // NEW MODULES - Super SaaS Features
  // ============================================

  // 1. Websites (Website Builder)
  console.log('🌐 Creating Websites...')
  const websites = await Promise.all([
    prisma.website.upsert({
      where: { subdomain: 'demo-main' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Demo Business Main Website',
        domain: 'demobusiness.com',
        subdomain: 'demo-main',
        metaTitle: 'Demo Business - Your Trusted Partner',
        metaDescription: 'Leading provider of business solutions and services',
        trackingCode: 'payaid_demo_main_001',
        status: 'PUBLISHED',
      },
    }),
    prisma.website.upsert({
      where: { subdomain: 'products-demo' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Product Landing Site',
        domain: null,
        subdomain: 'products-demo',
        metaTitle: 'Our Products - Demo Business',
        metaDescription: 'Explore our range of innovative products',
        trackingCode: 'payaid_products_002',
        status: 'PUBLISHED',
      },
    }),
    prisma.website.upsert({
      where: { subdomain: 'campaign-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Marketing Campaign Site',
        domain: null,
        subdomain: 'campaign-2024',
        metaTitle: 'Special Campaign - Demo Business',
        metaDescription: 'Limited time offers and promotions',
        trackingCode: 'payaid_campaign_003',
        status: 'DRAFT',
      },
    }),
  ])

  // Create website pages (skip if already exist)
  for (const website of websites) {
    const pages = [
      { path: '/', title: 'Home Page', metaTitle: website.metaTitle, metaDescription: website.metaDescription },
      { path: '/about', title: 'About Us', metaTitle: `About - ${website.name}`, metaDescription: 'Learn more about our company' },
      { path: '/contact', title: 'Contact Us', metaTitle: `Contact - ${website.name}`, metaDescription: 'Get in touch with us' },
      { path: '/products', title: 'Products', metaTitle: `Products - ${website.name}`, metaDescription: 'Browse our product catalog' },
    ]
    
    for (const page of pages) {
      await prisma.websitePage.upsert({
        where: { websiteId_path: { websiteId: website.id, path: page.path } },
        update: {},
        create: {
          websiteId: website.id,
          path: page.path,
          title: page.title,
          contentJson: { type: 'page', sections: [] },
        },
      })
    }
  }

  // 2. Logos (Logo Generator)
  console.log('🎨 Creating Logos...')
  const logos = await Promise.all([
    prisma.logo.create({
      data: {
        tenantId: tenant1.id,
        businessName: 'Demo Business',
        industry: 'Technology',
        style: 'modern',
        colors: ['#0066CC', '#00CC66'],
        prompt: 'Professional logo design for Technology industry, modern style, using colors: #0066CC, #00CC66, business name: "Demo Business", clean vector style, high quality, transparent background, professional branding',
        status: 'COMPLETED',
        modelUsed: 'stable-diffusion',
      },
    }),
    prisma.logo.create({
      data: {
        tenantId: tenant1.id,
        businessName: 'Tech Solutions Inc',
        industry: 'Software',
        style: 'minimal',
        colors: ['#000000', '#FFFFFF'],
        prompt: 'Professional logo design for Software industry, minimal style, using colors: #000000, #FFFFFF, business name: "Tech Solutions Inc", clean vector style, high quality, transparent background, professional branding',
        status: 'COMPLETED',
        modelUsed: 'stable-diffusion',
      },
    }),
    prisma.logo.create({
      data: {
        tenantId: tenant1.id,
        businessName: 'Creative Agency',
        industry: 'Marketing',
        style: 'playful',
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
        prompt: 'Professional logo design for Marketing industry, playful style, using colors: #FF6B6B, #4ECDC4, #FFE66D, business name: "Creative Agency", clean vector style, high quality, transparent background, professional branding',
        status: 'GENERATING',
        modelUsed: null,
      },
    }),
  ])

  // Create logo variations (dummy image URLs - in production these would be actual generated images)
  for (const logo of logos.filter(l => l.status === 'COMPLETED')) {
    const encodedName = encodeURIComponent(logo.businessName)
    await prisma.logoVariation.createMany({
      data: [
        {
          logoId: logo.id,
          tenantId: tenant1.id,
          imageUrl: `https://placehold.co/1024x1024/2563eb/ffffff?text=${encodedName}`,
          thumbnailUrl: `https://placehold.co/256x256/2563eb/ffffff?text=${encodedName}`,
          iconStyle: 'modern',
          isSelected: true,
        },
        {
          logoId: logo.id,
          tenantId: tenant1.id,
          imageUrl: `https://placehold.co/1024x1024/10b981/ffffff?text=${encodedName}`,
          thumbnailUrl: `https://placehold.co/256x256/10b981/ffffff?text=${encodedName}`,
          iconStyle: 'minimal',
          isSelected: false,
        },
        {
          logoId: logo.id,
          tenantId: tenant1.id,
          imageUrl: `https://placehold.co/1024x1024/ef4444/ffffff?text=${encodedName}`,
          thumbnailUrl: `https://placehold.co/256x256/ef4444/ffffff?text=${encodedName}`,
          iconStyle: 'playful',
          isSelected: false,
        },
      ],
    })
  }

  // 3. Landing Pages
  console.log('📄 Creating Landing Pages...')
  const landingPages = await Promise.all([
    prisma.landingPage.upsert({
      where: { slug: 'product-launch-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Product Launch 2024',
        slug: 'product-launch-2024',
        status: 'PUBLISHED',
        contentJson: {
          hero: { title: 'Introducing Our New Product', subtitle: 'Revolutionary features for modern businesses' },
          sections: ['features', 'testimonials', 'pricing', 'cta'],
        },
        metaTitle: 'Product Launch 2024 - Demo Business',
        metaDescription: 'Discover our latest product with cutting-edge features',
        views: 1250,
        conversions: 45,
        conversionRate: 3.6,
      },
    }),
    prisma.landingPage.upsert({
      where: { slug: 'summer-sale-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Summer Sale Campaign',
        slug: 'summer-sale-2024',
        status: 'PUBLISHED',
        contentJson: {
          hero: { title: 'Summer Sale - Up to 50% Off', subtitle: 'Limited time offer' },
          sections: ['products', 'discounts', 'testimonials'],
        },
        metaTitle: 'Summer Sale 2024 - Special Offers',
        metaDescription: 'Get amazing discounts on our products',
        views: 3200,
        conversions: 180,
        conversionRate: 5.6,
      },
    }),
    prisma.landingPage.upsert({
      where: { slug: 'webinar-dec-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Webinar Registration',
        slug: 'webinar-dec-2024',
        status: 'DRAFT',
        contentJson: {
          hero: { title: 'Join Our Free Webinar', subtitle: 'Learn from industry experts' },
          sections: ['agenda', 'speakers', 'registration'],
        },
        metaTitle: 'Free Webinar - December 2024',
        metaDescription: 'Register for our upcoming webinar',
        views: 0,
        conversions: 0,
        conversionRate: null,
      },
    }),
  ])

  // 4. Checkout Pages
  console.log('💳 Creating Checkout Pages...')
  const checkoutPages = await Promise.all([
    prisma.checkoutPage.upsert({
      where: { slug: 'checkout' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Standard Checkout',
        slug: 'checkout',
        status: 'PUBLISHED',
        paymentMethods: {
          upi: true,
          cards: true,
          netbanking: true,
          wallets: true,
        },
        couponsEnabled: true,
        showOrderSummary: true,
        showShippingOptions: true,
        contentJson: {
          header: 'Complete Your Purchase',
          footer: 'Secure checkout powered by PayAid',
        },
      },
    }),
    prisma.checkoutPage.upsert({
      where: { slug: 'quick-checkout' },
      update: {},
      create: {
        tenantId: tenant1.id,
        name: 'Quick Checkout',
        slug: 'quick-checkout',
        status: 'PUBLISHED',
        paymentMethods: {
          upi: true,
          cards: true,
          netbanking: false,
          wallets: true,
        },
        couponsEnabled: false,
        showOrderSummary: false,
        showShippingOptions: false,
        contentJson: {
          header: 'Fast & Secure Checkout',
          footer: 'Powered by PayAid',
        },
      },
    }),
  ])

  // 5. Website Chatbots
  console.log('🤖 Creating Website Chatbots...')
  const chatbots = await Promise.all([
    prisma.websiteChatbot.create({
      data: {
        tenantId: tenant1.id,
        websiteId: websites[0].id,
        name: 'Main Website Assistant',
        position: 'bottom-right',
        primaryColor: '#0066CC',
        greetingMessage: 'Hello! How can I help you today?',
        autoGreet: true,
        autoGreetDelay: 3000,
        leadQualification: true,
        faqEnabled: true,
        knowledgeBase: {
          faqs: [
            { question: 'What are your business hours?', answer: 'We are open Monday to Friday, 9 AM to 6 PM IST.' },
            { question: 'Do you offer support?', answer: 'Yes, we offer 24/7 customer support via email and phone.' },
            { question: 'What payment methods do you accept?', answer: 'We accept UPI, credit/debit cards, net banking, and digital wallets.' },
          ],
        },
        isActive: true,
        temperature: 0.7,
      },
    }),
    prisma.websiteChatbot.create({
      data: {
        tenantId: tenant1.id,
        websiteId: websites[1].id,
        name: 'Product Support Bot',
        position: 'bottom-left',
        primaryColor: '#00CC66',
        greetingMessage: 'Hi! Need help finding the right product?',
        autoGreet: true,
        autoGreetDelay: 5000,
        leadQualification: true,
        faqEnabled: true,
        knowledgeBase: {
          faqs: [
            { question: 'What products do you offer?', answer: 'We offer a wide range of software solutions, consulting services, and hardware components.' },
            { question: 'Can I get a demo?', answer: 'Absolutely! Please provide your contact details and we will schedule a demo for you.' },
          ],
        },
        isActive: true,
        temperature: 0.7,
      },
    }),
  ])

  // Create chatbot conversations
  await prisma.chatbotConversation.createMany({
    data: [
      {
        chatbotId: chatbots[0].id,
        tenantId: tenant1.id,
        visitorId: 'visitor-001',
        sessionId: 'session-001',
        messages: [
          { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() },
          { role: 'user', content: 'What are your business hours?', timestamp: new Date() },
          { role: 'assistant', content: 'We are open Monday to Friday, 9 AM to 6 PM IST.', timestamp: new Date() },
        ],
        messageCount: 3,
        qualified: false,
        startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      },
      {
        chatbotId: chatbots[0].id,
        tenantId: tenant1.id,
        visitorId: 'visitor-002',
        sessionId: 'session-002',
        contactId: contacts[0].id,
        messages: [
          { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() },
          { role: 'user', content: 'I am interested in your services', timestamp: new Date() },
          { role: 'assistant', content: 'Great! Can you tell me more about your requirements?', timestamp: new Date() },
          { role: 'user', content: 'I need enterprise software solutions', timestamp: new Date() },
        ],
        messageCount: 4,
        qualified: true,
        startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        endedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      },
    ],
  })

  // 6. Events
  console.log('🎉 Creating Events...')
  const events = await Promise.all([
    prisma.event.upsert({
      where: { slug: 'product-launch-webinar-dec-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        title: 'Product Launch Webinar',
        slug: 'product-launch-webinar-dec-2024',
        description: 'Join us for an exciting product launch webinar where we will unveil our latest innovations.',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        timezone: 'Asia/Kolkata',
        locationType: 'VIRTUAL',
        virtualUrl: 'https://meet.demo.com/product-launch',
        registrationEnabled: true,
        maxAttendees: 500,
        registrationDeadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        priceInr: 0,
        streamingEnabled: true,
        streamingUrl: 'https://stream.demo.com/product-launch',
        status: 'PUBLISHED',
      },
    }),
    prisma.event.upsert({
      where: { slug: 'annual-conference-2024' },
      update: {},
      create: {
        tenantId: tenant1.id,
        title: 'Annual Business Conference 2024',
        slug: 'annual-conference-2024',
        description: 'Our flagship annual conference featuring industry leaders and networking opportunities.',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'Asia/Kolkata',
        locationType: 'PHYSICAL',
        address: 'Grand Convention Center',
        city: 'Bangalore',
        state: 'Karnataka',
        registrationEnabled: true,
        maxAttendees: 1000,
        registrationDeadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        priceInr: 5000,
        status: 'PUBLISHED',
      },
    }),
    prisma.event.upsert({
      where: { slug: 'tech-workshop-series' },
      update: {},
      create: {
        tenantId: tenant1.id,
        title: 'Tech Workshop Series',
        slug: 'tech-workshop-series',
        description: 'Hands-on workshops covering the latest technologies and best practices.',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        timezone: 'Asia/Kolkata',
        locationType: 'HYBRID',
        address: 'Tech Hub, MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        virtualUrl: 'https://meet.demo.com/tech-workshop',
        registrationEnabled: true,
        maxAttendees: 200,
        priceInr: 2000,
        status: 'PUBLISHED',
      },
    }),
  ])

  // Create event registrations
  await prisma.eventRegistration.createMany({
    skipDuplicates: true,
    data: [
      {
        eventId: events[0].id,
        tenantId: tenant1.id,
        name: contacts[0].name,
        email: contacts[0].email || 'contact@example.com',
        phone: contacts[0].phone,
        status: 'CONFIRMED',
        registeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        eventId: events[0].id,
        tenantId: tenant1.id,
        name: contacts[1].name,
        email: contacts[1].email || 'contact2@example.com',
        phone: contacts[1].phone,
        status: 'CONFIRMED',
        registeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        eventId: events[1].id,
        tenantId: tenant1.id,
        name: contacts[2].name,
        email: contacts[2].email || 'contact3@example.com',
        phone: contacts[2].phone,
        status: 'PENDING',
        registeredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  // 7. Email Templates
  console.log('✉️ Creating Email Templates...')
  // Check if templates exist, create if not
  const templateNames = ['Welcome Email', 'Invoice Reminder', 'Event Invitation', 'Deal Follow-up']
  const existingTemplates = await prisma.emailTemplate.findMany({
    where: { tenantId: tenant1.id, name: { in: templateNames } },
  })
  const existingNames = existingTemplates.map(t => t.name)
  
  const emailTemplates = await Promise.all([
    existingNames.includes('Welcome Email') 
      ? existingTemplates.find(t => t.name === 'Welcome Email')!
      : prisma.emailTemplate.create({
          data: {
            tenantId: tenant1.id,
            name: 'Welcome Email',
            category: 'onboarding',
            subject: 'Welcome to {{companyName}}!',
            htmlContent: '<h1>Welcome {{contactName}}!</h1><p>Thank you for joining us. We are excited to have you on board.</p><p>Best regards,<br>{{companyName}} Team</p>',
            variables: ['contactName', 'companyName'],
            isActive: true,
            timesUsed: 45,
            lastUsedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        }),
    existingNames.includes('Invoice Reminder')
      ? existingTemplates.find(t => t.name === 'Invoice Reminder')!
      : prisma.emailTemplate.create({
          data: {
            tenantId: tenant1.id,
            name: 'Invoice Reminder',
            category: 'billing',
            subject: 'Reminder: Invoice {{invoiceNumber}} is Due',
            htmlContent: '<p>Dear {{contactName}},</p><p>This is a friendly reminder that invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}.</p><p>Please make the payment at your earliest convenience.</p>',
            variables: ['contactName', 'invoiceNumber', 'amount', 'dueDate'],
            isActive: true,
            timesUsed: 120,
            lastUsedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        }),
    existingNames.includes('Event Invitation')
      ? existingTemplates.find(t => t.name === 'Event Invitation')!
      : prisma.emailTemplate.create({
          data: {
            tenantId: tenant1.id,
            name: 'Event Invitation',
            category: 'marketing',
            subject: 'You are Invited: {{eventTitle}}',
            htmlContent: '<h2>Join Us for {{eventTitle}}</h2><p>Dear {{contactName}},</p><p>We would like to invite you to our upcoming event on {{eventDate}}.</p><p><a href="{{registrationLink}}">Register Now</a></p>',
            variables: ['contactName', 'eventTitle', 'eventDate', 'registrationLink'],
            isActive: true,
            timesUsed: 30,
            lastUsedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          },
        }),
    existingNames.includes('Deal Follow-up')
      ? existingTemplates.find(t => t.name === 'Deal Follow-up')!
      : prisma.emailTemplate.create({
          data: {
            tenantId: tenant1.id,
            name: 'Deal Follow-up',
            category: 'sales',
            subject: 'Following Up on Our Discussion',
            htmlContent: '<p>Hi {{contactName}},</p><p>I wanted to follow up on our recent discussion about {{dealName}}.</p><p>Please let me know if you have any questions or would like to schedule a call.</p>',
            variables: ['contactName', 'dealName'],
            isActive: true,
            timesUsed: 85,
            lastUsedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        }),
  ])

  // 8. AI Calls (AI Calling Bot)
  console.log('📞 Creating AI Calls...')
  const aiCalls = await Promise.all([
    prisma.aICall.create({
      data: {
        tenantId: tenant1.id,
        contactId: contacts[0].id,
        phoneNumber: contacts[0].phone || '+91-9876543210',
        direction: 'OUTBOUND',
        status: 'COMPLETED',
        duration: 180,
        startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        answeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 1000),
        endedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 180 * 1000),
        handledByAI: true,
        aiIntent: 'product_inquiry',
        aiConfidence: 0.85,
        dealId: deals[0].id,
        leadId: deals[0].id,
      },
    }),
    prisma.aICall.create({
      data: {
        tenantId: tenant1.id,
        contactId: contacts[1].id,
        phoneNumber: contacts[1].phone || '+91-9876543211',
        direction: 'OUTBOUND',
        status: 'COMPLETED',
        duration: 240,
        startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        answeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 8 * 1000),
        endedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 240 * 1000),
        handledByAI: true,
        aiIntent: 'general_info',
        aiConfidence: 0.70,
      },
    }),
    prisma.aICall.create({
      data: {
        tenantId: tenant1.id,
        contactId: contacts[5].id,
        phoneNumber: contacts[5].phone || '+91-9876543215',
        direction: 'INBOUND',
        status: 'COMPLETED',
        duration: 300,
        startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        answeredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3 * 1000),
        endedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 300 * 1000),
        handledByAI: true,
        aiIntent: 'sales_qualified',
        aiConfidence: 0.90,
        dealId: deals[4].id,
        leadId: deals[4].id,
      },
    }),
  ])

  // Create call recordings and transcripts
  for (let i = 0; i < aiCalls.length; i++) {
    const call = aiCalls[i]
    await prisma.callRecording.create({
      data: {
        callId: call.id,
        tenantId: tenant1.id,
        recordingUrl: `https://recordings.demo.com/call-${String(i + 1).padStart(3, '0')}.mp3`,
        duration: call.duration || 0,
        format: 'mp3',
      },
    })
    
    await prisma.callTranscript.create({
      data: {
        callId: call.id,
        tenantId: tenant1.id,
        transcript: `Call transcript for call ${i + 1}. This is a sample transcript showing the conversation between the AI assistant and the customer.`,
        segments: [
          { speaker: 'AI', text: 'Hello! How can I help you today?', timestamp: 0 },
          { speaker: 'Customer', text: 'I am interested in your services', timestamp: 5 },
          { speaker: 'AI', text: 'Great! Let me provide you with more information...', timestamp: 10 },
        ],
        language: 'en',
        sentiment: i === 0 || i === 2 ? 'positive' : 'neutral',
        sentimentScore: i === 0 ? 0.75 : i === 2 ? 0.85 : 0.50,
      },
    })
  }

  // Create call FAQs
  await prisma.callFAQ.createMany({
    data: [
      {
        tenantId: tenant1.id,
        question: 'What are your business hours?',
        answer: 'We are open Monday to Friday, 9 AM to 6 PM IST. You can also reach us via email 24/7.',
        category: 'general',
        timesUsed: 45,
        lastUsedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        tenantId: tenant1.id,
        question: 'What payment methods do you accept?',
        answer: 'We accept UPI, credit/debit cards, net banking, and all major digital wallets.',
        category: 'billing',
        timesUsed: 32,
        lastUsedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        tenantId: tenant1.id,
        question: 'Do you offer technical support?',
        answer: 'Yes, we offer 24/7 technical support via phone, email, and live chat for all our customers.',
        category: 'support',
        timesUsed: 28,
        lastUsedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        tenantId: tenant1.id,
        question: 'What is your refund policy?',
        answer: 'We offer a 30-day money-back guarantee on all our products and services. Contact our support team for refund requests.',
        category: 'billing',
        timesUsed: 15,
        lastUsedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  })

  // 9. Custom Dashboards
  console.log('📊 Creating Custom Dashboards...')
  const customDashboards = await Promise.all([
    prisma.customDashboard.create({
      data: {
        tenantId: tenant1.id,
        name: 'Sales Overview',
        description: 'Comprehensive sales metrics and KPIs',
        layoutJson: {
          layout: 'grid',
          columns: 12,
        },
        widgets: [
          { type: 'revenue', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
          { type: 'deals', position: { x: 6, y: 0, w: 6, h: 4 }, config: {} },
          { type: 'conversion', position: { x: 0, y: 4, w: 12, h: 4 }, config: {} },
        ],
        isDefault: false,
        isPublic: false,
      },
    }),
    prisma.customDashboard.create({
      data: {
        tenantId: tenant1.id,
        name: 'Marketing Performance',
        description: 'Track marketing campaigns and ROI',
        layoutJson: {
          layout: 'grid',
          columns: 12,
        },
        widgets: [
          { type: 'campaigns', position: { x: 0, y: 0, w: 8, h: 4 }, config: {} },
          { type: 'leads', position: { x: 8, y: 0, w: 4, h: 4 }, config: {} },
          { type: 'conversions', position: { x: 0, y: 4, w: 12, h: 4 }, config: {} },
        ],
        isDefault: false,
        isPublic: false,
      },
    }),
  ])

  // 11. Social Media Accounts & Posts
  console.log('📱 Creating Social Media Accounts & Posts...')
  const socialAccounts = await Promise.all([
    prisma.socialMediaAccount.upsert({
      where: {
        tenantId_platform_accountId: {
          tenantId: tenant1.id,
          platform: 'facebook',
          accountId: 'fb_demo_001',
        },
      },
      update: {},
      create: {
        tenantId: tenant1.id,
        platform: 'facebook',
        accountName: 'Demo Business Page',
        accountId: 'fb_demo_001',
        accessToken: 'demo_access_token_facebook', // In production, encrypt this
        refreshToken: 'demo_refresh_token_facebook',
        isConnected: true,
        followerCount: 1250,
        lastSyncAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.socialMediaAccount.upsert({
      where: {
        tenantId_platform_accountId: {
          tenantId: tenant1.id,
          platform: 'linkedin',
          accountId: 'li_demo_001',
        },
      },
      update: {},
      create: {
        tenantId: tenant1.id,
        platform: 'linkedin',
        accountName: 'Demo Business Company Page',
        accountId: 'li_demo_001',
        accessToken: 'demo_access_token_linkedin',
        refreshToken: 'demo_refresh_token_linkedin',
        isConnected: true,
        followerCount: 850,
        lastSyncAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.socialMediaAccount.upsert({
      where: {
        tenantId_platform_accountId: {
          tenantId: tenant1.id,
          platform: 'twitter',
          accountId: 'tw_demo_001',
        },
      },
      update: {},
      create: {
        tenantId: tenant1.id,
        platform: 'twitter',
        accountName: '@demobusiness',
        accountId: 'tw_demo_001',
        accessToken: 'demo_access_token_twitter',
        refreshToken: 'demo_refresh_token_twitter',
        isConnected: true,
        followerCount: 3200,
        lastSyncAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  // Create published posts
  const socialPosts = await Promise.all([
    prisma.socialPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[0].id,
        content: '🎉 Excited to announce our new product line! We\'ve been working hard to bring you innovative solutions that will transform your business. Check out our website for more details! #BusinessGrowth #Innovation',
        platform: 'facebook',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        platformPostId: 'fb_post_001',
        reach: 1250,
        impressions: 2100,
        engagement: 145,
        likes: 98,
        comments: 32,
        shares: 15,
        clicks: 45,
      },
    }),
    prisma.socialPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[1].id,
        content: 'We\'re thrilled to share insights from our latest industry report. The future of business is digital, and we\'re here to help you navigate this transformation. Read more on our blog.',
        platform: 'linkedin',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        platformPostId: 'li_post_001',
        reach: 850,
        impressions: 1200,
        engagement: 78,
        likes: 65,
        comments: 12,
        shares: 1,
        clicks: 23,
      },
    }),
    prisma.socialPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[2].id,
        content: '🚀 Big news! Our platform just hit 10,000 active users! Thank you to everyone who has been part of this journey. Here\'s to continued growth! #Milestone #ThankYou',
        platform: 'twitter',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        platformPostId: 'tw_post_001',
        reach: 3200,
        impressions: 4500,
        engagement: 320,
        likes: 280,
        comments: 25,
        shares: 15,
        clicks: 67,
      },
    }),
    prisma.socialPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[0].id,
        content: 'Join us for our upcoming webinar on digital transformation strategies. Learn from industry experts and network with peers. Register now!',
        platform: 'facebook',
        status: 'DRAFT',
      },
    }),
  ])

  // Create scheduled posts
  const scheduledPosts = await Promise.all([
    prisma.scheduledPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[0].id,
        content: 'Happy Monday! Start your week with our latest business tips and insights. What are your goals for this week? Share in the comments! 💼',
        platform: 'facebook',
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'SCHEDULED',
      },
    }),
    prisma.scheduledPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[1].id,
        content: 'Industry insights: The top 5 trends shaping business in 2024. From AI integration to sustainable practices, here\'s what you need to know.',
        platform: 'linkedin',
        scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'SCHEDULED',
      },
    }),
    prisma.scheduledPost.create({
      data: {
        tenantId: tenant1.id,
        accountId: socialAccounts[2].id,
        content: 'Quick tip: Automate your social media posting to save time and maintain consistency. Our platform makes it easy! 🎯',
        platform: 'twitter',
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'SCHEDULED',
      },
    }),
  ])

  // 10. Custom Reports
  console.log('📈 Creating Custom Reports...')
  const customReports = await Promise.all([
    prisma.customReport.create({
      data: {
        tenantId: tenant1.id,
        name: 'Monthly Sales Report',
        description: 'Detailed sales performance for the month',
        reportType: 'sales',
        filters: { dateRange: 'month', status: 'all' },
        columns: ['contact', 'deal', 'value', 'stage', 'probability'],
        scheduleEnabled: true,
        scheduleFrequency: 'monthly',
        scheduleDay: 1,
        scheduleTime: '09:00',
        exportFormats: ['csv', 'pdf', 'excel'],
      },
    }),
    prisma.customReport.create({
      data: {
        tenantId: tenant1.id,
        name: 'Customer Acquisition Report',
        description: 'Track new customer acquisition and sources',
        reportType: 'marketing',
        filters: { dateRange: 'quarter', source: 'all' },
        columns: ['contact', 'source', 'date', 'value'],
        scheduleEnabled: true,
        scheduleFrequency: 'weekly',
        scheduleDay: 1, // Monday
        scheduleTime: '08:00',
        exportFormats: ['csv', 'pdf'],
      },
    }),
  ])

  console.log('✅ Comprehensive seeding completed!')
  console.log('\n📋 Test Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Demo Business Account:')
  console.log('  Email: admin@demo.com')
  console.log('  Password: Test@1234')
  console.log('  Subdomain: demo')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📊 Sample Data Created:')
  console.log(`  - 2 Tenants`)
  console.log(`  - 2 Users`)
  console.log(`  - ${contacts.length} Contacts (customers, leads, vendors)`)
  console.log(`  - ${products.length} Products`)
  console.log(`  - ${deals.length} Deals (leads, qualified, proposal, negotiation, won, lost)`)
  console.log(`  - ${tasks.length} Tasks`)
  console.log(`  - ${orders.length} Orders (with revenue for past & current FY)`)
  console.log(`  - ${invoices.length} Invoices (paid, sent, overdue, draft)`)
  console.log('\n🆕 NEW MODULES - Super SaaS Features:')
  console.log(`  - ${websites.length} Websites (with pages)`)
  console.log(`  - ${logos.length} Logos (with variations)`)
  console.log(`  - ${landingPages.length} Landing Pages`)
  console.log(`  - ${checkoutPages.length} Checkout Pages`)
  console.log(`  - ${chatbots.length} Website Chatbots (with conversations)`)
  console.log(`  - ${events.length} Events (with registrations)`)
  console.log(`  - ${emailTemplates.length} Email Templates`)
  console.log(`  - ${aiCalls.length} AI Calls (with FAQs)`)
  console.log(`  - ${customDashboards.length} Custom Dashboards`)
  console.log(`  - ${customReports.length} Custom Reports`)
  console.log(`  - ${socialAccounts.length} Social Media Accounts`)
  console.log(`  - ${socialPosts.length} Social Media Posts`)
  console.log(`  - ${scheduledPosts.length} Scheduled Posts`)

  // 12. Multi-Industry Modules - Service Business
  console.log('💼 Setting Demo Business as Service Business Industry...')
  
  // Set tenant1 as service-business industry
  await prisma.tenant.update({
    where: { id: tenant1.id },
    data: {
      industry: 'service-business',
      industrySubType: null,
      industrySettings: { 
        setForDemo: true,
        setAt: new Date().toISOString(),
      },
    },
  })

  // Enable restaurant features
  await Promise.all([
    prisma.featureToggle.upsert({
      where: { tenantId_featureName: { tenantId: tenant1.id, featureName: 'qr_menu' } },
      update: { isEnabled: true },
      create: { tenantId: tenant1.id, featureName: 'qr_menu', isEnabled: true },
    }),
    prisma.featureToggle.upsert({
      where: { tenantId_featureName: { tenantId: tenant1.id, featureName: 'kitchen_display' } },
      update: { isEnabled: true },
      create: { tenantId: tenant1.id, featureName: 'kitchen_display', isEnabled: true },
    }),
    prisma.featureToggle.upsert({
      where: { tenantId_featureName: { tenantId: tenant1.id, featureName: 'restaurant_orders' } },
      update: { isEnabled: true },
      create: { tenantId: tenant1.id, featureName: 'restaurant_orders', isEnabled: true },
    }),
  ])

  // Create menu items
  const menuItems = await Promise.all([
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Butter Chicken',
        description: 'Creamy tomato-based curry with tender chicken pieces',
        category: 'Main Course',
        price: 280,
        isVegetarian: false,
        isSpicy: false,
        preparationTime: 20,
        calories: 450,
        displayOrder: 1,
      },
    }),
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese marinated in spices',
        category: 'Appetizers',
        price: 180,
        isVegetarian: true,
        isSpicy: true,
        preparationTime: 15,
        calories: 280,
        displayOrder: 1,
      },
    }),
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Biryani',
        description: 'Fragrant basmati rice with spiced meat',
        category: 'Main Course',
        price: 320,
        isVegetarian: false,
        isSpicy: true,
        preparationTime: 25,
        calories: 550,
        displayOrder: 2,
      },
    }),
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Gulab Jamun',
        description: 'Sweet milk dumplings in sugar syrup',
        category: 'Desserts',
        price: 80,
        isVegetarian: true,
        isSpicy: false,
        preparationTime: 5,
        calories: 200,
        displayOrder: 1,
      },
    }),
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Mango Lassi',
        description: 'Refreshing yogurt drink with mango',
        category: 'Beverages',
        price: 120,
        isVegetarian: true,
        isVegan: false,
        isSpicy: false,
        preparationTime: 3,
        calories: 150,
        displayOrder: 1,
      },
    }),
    prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenant1.id,
        name: 'Garlic Naan',
        description: 'Fresh baked bread with garlic and butter',
        category: 'Main Course',
        price: 60,
        isVegetarian: true,
        isSpicy: false,
        preparationTime: 8,
        calories: 180,
        displayOrder: 3,
      },
    }),
  ])

  // Delete existing restaurant orders for tenant1 to ensure idempotency
  await prisma.restaurantOrder.deleteMany({
    where: { tenantId: tenant1.id },
  })

  // Create sample restaurant orders
  const restaurantOrders = await Promise.all([
    prisma.restaurantOrder.create({
      data: {
        tenantId: tenant1.id,
        orderNumber: 'ORD-001',
        tableNumber: 5,
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 9876543210',
        status: 'COOKING',
        totalAmount: 560,
        paymentStatus: 'PENDING',
        items: {
          create: [
            {
              menuItemId: menuItems[0].id,
              quantity: 2,
              price: menuItems[0].price,
              subtotal: Number(menuItems[0].price) * 2,
            },
          ],
        },
      },
    }),
    prisma.restaurantOrder.create({
      data: {
        tenantId: tenant1.id,
        orderNumber: 'ORD-002',
        tableNumber: 3,
        customerName: 'Priya Sharma',
        status: 'PENDING',
        totalAmount: 500,
        paymentStatus: 'PENDING',
        items: {
          create: [
            {
              menuItemId: menuItems[1].id,
              quantity: 1,
              price: menuItems[1].price,
              subtotal: menuItems[1].price,
            },
            {
              menuItemId: menuItems[2].id,
              quantity: 1,
              price: menuItems[2].price,
              subtotal: menuItems[2].price,
            },
          ],
        },
      },
    }),
    prisma.restaurantOrder.create({
      data: {
        tenantId: tenant1.id,
        orderNumber: 'ORD-003',
        tableNumber: 8,
        customerName: 'Amit Patel',
        status: 'READY',
        totalAmount: 200,
        paymentStatus: 'PAID',
        items: {
          create: [
            {
              menuItemId: menuItems[3].id,
              quantity: 2,
              price: menuItems[3].price,
              subtotal: Number(menuItems[3].price) * 2,
              specialInstructions: 'Extra syrup please',
            },
          ],
        },
      },
    }),
  ])

  // 13. Retail Industry Data
  console.log('🛒 Creating Retail Industry Data...')
  
  // Delete existing retail data for tenant2 to ensure idempotency
  await prisma.retailTransactionItem.deleteMany({
    where: {
      transaction: {
        tenantId: tenant2.id,
      },
    },
  })
  await prisma.retailTransaction.deleteMany({
    where: { tenantId: tenant2.id },
  })
  await prisma.retailProduct.deleteMany({
    where: { tenantId: tenant2.id },
  })
  
  // Create a retail tenant (tenant2)
  await prisma.tenant.update({
    where: { id: tenant2.id },
    data: {
      industry: 'retail',
      industrySubType: 'electronics',
      industrySettings: { multiTill: true, offlineMode: true },
    },
  })

  // Enable retail features
  await Promise.all([
    prisma.featureToggle.upsert({
      where: { tenantId_featureName: { tenantId: tenant2.id, featureName: 'pos_system' } },
      update: { isEnabled: true },
      create: { tenantId: tenant2.id, featureName: 'pos_system', isEnabled: true },
    }),
    prisma.featureToggle.upsert({
      where: { tenantId_featureName: { tenantId: tenant2.id, featureName: 'retail_inventory' } },
      update: { isEnabled: true },
      create: { tenantId: tenant2.id, featureName: 'retail_inventory', isEnabled: true },
    }),
  ])

  // Delete existing retail data for tenant2 to ensure idempotency
  await prisma.retailTransactionItem.deleteMany({
    where: {
      transaction: {
        tenantId: tenant2.id,
      },
    },
  })
  await prisma.retailTransaction.deleteMany({
    where: { tenantId: tenant2.id },
  })
  await prisma.retailProduct.deleteMany({
    where: { tenantId: tenant2.id },
  })

  // Create retail products (after deletion)
  const retailProducts = await Promise.all([
    prisma.retailProduct.create({
      data: {
        tenantId: tenant2.id,
        name: 'Samsung Galaxy S23',
        description: 'Latest flagship smartphone',
        sku: 'SAM-GAL-S23-128',
        barcode: '1234567890123',
        category: 'Electronics',
        brand: 'Samsung',
        price: 79999,
        costPrice: 65000,
        stockQuantity: 15,
        minStockLevel: 5,
        maxStockLevel: 50,
      },
    }),
    prisma.retailProduct.create({
      data: {
        tenantId: tenant2.id,
        name: 'Apple AirPods Pro',
        description: 'Wireless earbuds with noise cancellation',
        sku: 'APP-AIR-PRO-2',
        barcode: '1234567890124',
        category: 'Electronics',
        brand: 'Apple',
        price: 24999,
        costPrice: 20000,
        stockQuantity: 25,
        minStockLevel: 10,
        maxStockLevel: 100,
      },
    }),
    prisma.retailProduct.create({
      data: {
        tenantId: tenant2.id,
        name: 'OnePlus 11',
        description: 'Premium Android smartphone',
        sku: 'OP-11-256',
        barcode: '1234567890125',
        category: 'Electronics',
        brand: 'OnePlus',
        price: 56999,
        costPrice: 48000,
        stockQuantity: 8,
        minStockLevel: 3,
        maxStockLevel: 30,
      },
    }),
  ])

  // Create sample retail transactions
  const retailTransactions = await Promise.all([
    prisma.retailTransaction.create({
      data: {
        tenantId: tenant2.id,
        transactionNumber: 'TXN-001',
        subtotal: 79999,
        tax: 14400,
        discount: 0,
        total: 94399,
        paymentMethod: 'card',
        paymentStatus: 'PAID',
        receiptPrinted: true,
        items: {
          create: [
            {
              productId: retailProducts[0].id,
              quantity: 1,
              unitPrice: retailProducts[0].price,
              subtotal: retailProducts[0].price,
            },
          ],
        },
      },
    }),
    prisma.retailTransaction.create({
      data: {
        tenantId: tenant2.id,
        transactionNumber: 'TXN-002',
        subtotal: 24999,
        tax: 4500,
        discount: 500,
        total: 28999,
        paymentMethod: 'upi',
        paymentStatus: 'PAID',
        receiptPrinted: false,
        items: {
          create: [
            {
              productId: retailProducts[1].id,
              quantity: 1,
              unitPrice: retailProducts[1].price,
              subtotal: retailProducts[1].price,
            },
          ],
        },
      },
    }),
  ])

  // 14. Email & Chat Services
  console.log('📧 Creating Email & Chat Services Data...')

  // Create email accounts for tenant1
  const emailAccounts = await Promise.all([
    prisma.emailAccount.create({
      data: {
        tenantId: tenant1.id,
        userId: user1.id,
        email: 'admin@demobusiness.com',
        displayName: 'Admin User',
        password: await bcrypt.hash('Email@1234', 12),
        storageQuotaMB: 25000,
        storageUsedMB: 1250,
        imapHost: 'imap.payaid.io',
        smtpHost: 'smtp.payaid.io',
        isActive: true,
      },
    }),
    prisma.emailAccount.create({
      data: {
        tenantId: tenant1.id,
        userId: user1.id,
        email: 'sales@demobusiness.com',
        displayName: 'Sales Team',
        password: await bcrypt.hash('Email@1234', 12),
        storageQuotaMB: 25000,
        storageUsedMB: 850,
        imapHost: 'imap.payaid.io',
        smtpHost: 'smtp.payaid.io',
        isActive: true,
      },
    }),
  ])

  // Create default folders for each account
  for (const account of emailAccounts) {
    const defaultFolders = [
      { name: 'Inbox', type: 'inbox', displayOrder: 1 },
      { name: 'Sent', type: 'sent', displayOrder: 2 },
      { name: 'Drafts', type: 'drafts', displayOrder: 3 },
      { name: 'Trash', type: 'trash', displayOrder: 4 },
      { name: 'Spam', type: 'spam', displayOrder: 5 },
      { name: 'Archive', type: 'archive', displayOrder: 6 },
    ]

    await Promise.all(
      defaultFolders.map((folder) =>
        prisma.emailFolder.create({
          data: {
            accountId: account.id,
            name: folder.name,
            type: folder.type,
            displayOrder: folder.displayOrder,
          },
        })
      )
    )
  }

  // Get Inbox folder for first account
  const inboxFolder = await prisma.emailFolder.findFirst({
    where: {
      accountId: emailAccounts[0].id,
      type: 'inbox',
    },
  })

  // Create sample email messages
  let emailMessages: any[] = []
  if (inboxFolder) {
    emailMessages = await Promise.all([
      prisma.emailMessage.create({
        data: {
          accountId: emailAccounts[0].id,
          folderId: inboxFolder.id,
          messageId: `<msg-${Date.now()}-1@payaid.io>`,
          fromEmail: 'customer@example.com',
          fromName: 'John Customer',
          toEmails: [emailAccounts[0].email],
          subject: 'Inquiry about your services',
          body: 'Hello,\n\nI am interested in learning more about your services. Can you please provide more information?\n\nBest regards,\nJohn Customer',
          htmlBody: '<p>Hello,</p><p>I am interested in learning more about your services. Can you please provide more information?</p><p>Best regards,<br>John Customer</p>',
          isRead: false,
          receivedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.emailMessage.create({
        data: {
          accountId: emailAccounts[0].id,
          folderId: inboxFolder.id,
          messageId: `<msg-${Date.now()}-2@payaid.io>`,
          fromEmail: 'partner@company.com',
          fromName: 'Sarah Partner',
          toEmails: [emailAccounts[0].email],
          subject: 'Partnership opportunity',
          body: 'Hi there,\n\nWe would like to discuss a potential partnership. Are you available for a call this week?\n\nThanks,\nSarah',
          htmlBody: '<p>Hi there,</p><p>We would like to discuss a potential partnership. Are you available for a call this week?</p><p>Thanks,<br>Sarah</p>',
          isRead: true,
          isStarred: true,
          receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.emailMessage.create({
        data: {
          accountId: emailAccounts[0].id,
          folderId: inboxFolder.id,
          messageId: `<msg-${Date.now()}-3@payaid.io>`,
          fromEmail: 'support@vendor.com',
          fromName: 'Support Team',
          toEmails: [emailAccounts[0].email],
          subject: 'Your order has been shipped',
          body: 'Your order #12345 has been shipped and will arrive within 3-5 business days.\n\nTracking number: TRACK123456',
          htmlBody: '<p>Your order #12345 has been shipped and will arrive within 3-5 business days.</p><p>Tracking number: <strong>TRACK123456</strong></p>',
          isRead: false,
          receivedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
      }),
    ])

    // Update folder counts
    await prisma.emailFolder.update({
      where: { id: inboxFolder.id },
      data: {
        unreadCount: emailMessages.filter((m) => !m.isRead).length,
        totalCount: emailMessages.length,
      },
    })
  }

  // Create chat workspace for tenant1
  const chatWorkspace = await prisma.chatWorkspace.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      name: 'Demo Business Workspace',
      description: 'Team communication workspace',
    },
  })

  // Create chat member
  const chatMember = await prisma.chatMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: chatWorkspace.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      workspaceId: chatWorkspace.id,
      userId: user1.id,
      displayName: user1.name || user1.email,
      avatar: user1.avatar,
      status: 'online',
    },
  })

  // Create default channels
  const channels = await Promise.all([
    prisma.chatChannel.upsert({
      where: {
        workspaceId_name: {
          workspaceId: chatWorkspace.id,
          name: 'general',
        },
      },
      update: {},
      create: {
        workspaceId: chatWorkspace.id,
        name: 'general',
        description: 'General team discussions',
        isPrivate: false,
      },
    }),
    prisma.chatChannel.upsert({
      where: {
        workspaceId_name: {
          workspaceId: chatWorkspace.id,
          name: 'sales',
        },
      },
      update: {},
      create: {
        workspaceId: chatWorkspace.id,
        name: 'sales',
        description: 'Sales team discussions',
        isPrivate: false,
      },
    }),
    prisma.chatChannel.upsert({
      where: {
        workspaceId_name: {
          workspaceId: chatWorkspace.id,
          name: 'announcements',
        },
      },
      update: {},
      create: {
        workspaceId: chatWorkspace.id,
        name: 'announcements',
        description: 'Company announcements',
        isPrivate: false,
      },
    }),
  ])

  // Add member to channels
  for (const channel of channels) {
    await prisma.chatChannelMember.upsert({
      where: {
        channelId_memberId: {
          channelId: channel.id,
          memberId: chatMember.id,
        },
      },
      update: {},
      create: {
        channelId: channel.id,
        memberId: chatMember.id,
        role: 'admin',
      },
    })
  }

  // Create sample chat messages
  const chatMessages = await Promise.all([
    prisma.chatChannelMessage.create({
      data: {
        channelId: channels[0].id, // general
        senderId: chatMember.id,
        content: 'Welcome to the team chat! 👋',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.chatChannelMessage.create({
      data: {
        channelId: channels[0].id, // general
        senderId: chatMember.id,
        content: 'Let\'s discuss the Q4 goals. We need to focus on customer acquisition.',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.chatChannelMessage.create({
      data: {
        channelId: channels[1].id, // sales
        senderId: chatMember.id,
        content: 'New lead from @contact-1 - TechCorp wants to discuss a deal worth ₹5L',
        mentionedContactIds: ['contact-1'],
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.chatChannelMessage.create({
      data: {
        channelId: channels[1].id, // sales
        senderId: chatMember.id,
        content: 'Great! Let\'s schedule a call with them this week.',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log('✅ Email & Chat Services seeding completed!')
  console.log(`  - ${emailAccounts.length} Email Accounts`)
  console.log(`  - ${emailMessages.length} Email Messages`)
  console.log(`  - 1 Chat Workspace`)
  console.log(`  - ${channels.length} Chat Channels`)
  console.log(`  - ${chatMessages.length} Chat Messages`)

  // 15. WhatsApp Services
  console.log('📱 Creating WhatsApp Services Data...')

  // Create WhatsApp account for tenant1
  const whatsappAccount = await prisma.whatsappAccount.create({
    data: {
      tenantId: tenant1.id,
      channelType: 'web',
      wahaBaseUrl: 'http://localhost:3000', // Default WAHA URL (user will update)
      wahaApiKey: 'demo-api-key', // In production, this should be encrypted
      isWebConnected: false, // Not connected until user configures WAHA
      businessName: 'Demo Business WhatsApp',
      primaryPhone: '+919876543210',
      status: 'active',
    },
  })

  // Create a sample session (pending QR)
  const whatsappSession = await prisma.whatsappSession.create({
    data: {
      accountId: whatsappAccount.id,
      employeeId: user1.id,
      providerSessionId: `${tenant1.id}-${user1.id}-${Date.now()}`,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=demo-qr-code',
      status: 'pending_qr',
      deviceName: 'Admin Phone',
    },
  })

  // Create WhatsApp contact identity for an existing contact
  const existingContact = await prisma.contact.findFirst({
    where: { tenantId: tenant1.id },
  })

  if (existingContact) {
    await prisma.whatsappContactIdentity.create({
      data: {
        contactId: existingContact.id,
        whatsappNumber: existingContact.phone || '+919876543210',
        verified: true,
        verificationDate: new Date(),
      },
    })

    // Create a sample conversation
    const whatsappConversation = await prisma.whatsappConversation.create({
      data: {
        accountId: whatsappAccount.id,
        contactId: existingContact.id,
        sessionId: whatsappSession.id,
        status: 'open',
        lastMessageAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastDirection: 'in',
        unreadCount: 1,
      },
    })

    // Create sample messages
    await Promise.all([
      prisma.whatsappMessage.create({
        data: {
          conversationId: whatsappConversation.id,
          sessionId: whatsappSession.id,
          direction: 'in',
          messageType: 'text',
          whatsappMessageId: `msg-${Date.now()}-1`,
          fromNumber: existingContact.phone || '+919876543210',
          toNumber: '+919876543210',
          text: 'Hello! I need help with my order.',
          status: 'delivered',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
      }),
      prisma.whatsappMessage.create({
        data: {
          conversationId: whatsappConversation.id,
          sessionId: whatsappSession.id,
          employeeId: user1.id,
          direction: 'out',
          messageType: 'text',
          whatsappMessageId: `msg-${Date.now()}-2`,
          fromNumber: '+919876543210',
          toNumber: existingContact.phone || '+919876543210',
          text: 'Hi! I can help you with that. What\'s your order number?',
          status: 'read',
          sentAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          deliveredAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          readAt: new Date(now.getTime() - 55 * 60 * 1000),
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        },
      }),
    ])
  }

  // Create a sample template
  await prisma.whatsappTemplate.create({
    data: {
      accountId: whatsappAccount.id,
      name: 'Order Confirmation',
      category: 'order_update',
      languageCode: 'en',
      bodyTemplate: 'Hi {{1}}, your order {{2}} has been confirmed and will be delivered on {{3}}.',
      createdById: user1.id,
    },
  })

  console.log('✅ WhatsApp Services seeding completed!')
  console.log(`  - 1 WhatsApp Account`)
  console.log(`  - 1 WhatsApp Session`)
  console.log(`  - 1 WhatsApp Template`)
  if (existingContact) {
    console.log(`  - 1 WhatsApp Contact Identity`)
    console.log(`  - 1 WhatsApp Conversation`)
    console.log(`  - 2 WhatsApp Messages`)
  }

  console.log('✅ Multi-Industry seeding completed!')
  console.log(`  - ${menuItems.length} Restaurant Menu Items`)
  console.log(`  - ${restaurantOrders.length} Restaurant Orders`)
  console.log(`  - ${retailProducts.length} Retail Products`)
  console.log(`  - ${retailTransactions.length} Retail Transactions`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
