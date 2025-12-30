import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Extended Sample Data Seeder
 * Adds sample data for modules not covered in seed-all-sample-data.ts:
 * - Projects
 * - Expenses
 * - Purchase Orders & Vendors
 * - Attendance & Leave Management
 * - Industry-specific data (Restaurant, Retail)
 */
async function seedExtendedModules() {
  console.log('🌱 Starting extended modules sample data seeding...\n')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  const tenantId = tenant.id
  console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`)

  // Get existing data for relationships
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    take: 20,
  })
  const contactIds = contacts.map((c) => c.id)

  const users = await prisma.user.findMany({
    where: { tenantId },
    take: 5,
  })
  const userIds = users.map((u) => u.id)

  const products = await prisma.product.findMany({
    where: { tenantId },
    take: 10,
  })

  console.log('📁 Seeding Projects...')
  await seedProjects(tenantId, contactIds, userIds)
  console.log('✅ Projects seeded\n')

  console.log('💸 Seeding Expenses...')
  await seedExpenses(tenantId, userIds)
  console.log('✅ Expenses seeded\n')

  console.log('🏢 Seeding Vendors...')
  await seedVendors(tenantId)
  console.log('✅ Vendors seeded\n')

  console.log('🛒 Seeding Purchase Orders...')
  await seedPurchaseOrders(tenantId)
  console.log('✅ Purchase Orders seeded\n')

  console.log('📅 Seeding Attendance Records...')
  await seedAttendance(tenantId, userIds)
  console.log('✅ Attendance Records seeded\n')

  console.log('🏖️ Seeding Leave Management...')
  await seedLeaveManagement(tenantId, userIds)
  console.log('✅ Leave Management seeded\n')

  console.log('🍽️ Seeding Restaurant Data...')
  await seedRestaurantData(tenantId)
  console.log('✅ Restaurant Data seeded\n')

  console.log('🛒 Seeding Retail Data...')
  await seedRetailData(tenantId, contacts)
  console.log('✅ Retail Data seeded\n')

  console.log('\n✨ Extended modules sample data seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Projects: 5`)
  console.log(`   - Expenses: 10`)
  console.log(`   - Vendors: 5`)
  console.log(`   - Purchase Orders: 8`)
  console.log(`   - Attendance Records: 30`)
  console.log(`   - Leave Requests: 8`)
  console.log(`   - Restaurant Orders: 10`)
  console.log(`   - Restaurant Menu Items: 15`)
  console.log(`   - Restaurant Tables: 8`)
  console.log(`   - Restaurant Reservations: 5`)
  console.log(`   - Retail Transactions: 10`)
  console.log(`   - Retail Products: 12`)
}

// ===== PROJECTS =====
async function seedProjects(tenantId: string, contactIds: string[], userIds: string[]) {
  const projects = [
    {
      name: 'Website Redesign Project',
      description: 'Complete redesign of company website with modern UI/UX',
      code: 'PRJ-001',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      budget: 500000,
      progress: 65,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-04-30'),
      tags: ['web', 'design', 'ui/ux'],
      notes: 'Focus on mobile responsiveness and SEO optimization',
    },
    {
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android platforms',
      code: 'PRJ-002',
      status: 'PLANNING',
      priority: 'URGENT',
      budget: 800000,
      progress: 20,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-30'),
      tags: ['mobile', 'ios', 'android'],
      notes: 'Using React Native for cross-platform development',
    },
    {
      name: 'Marketing Campaign Q1',
      description: 'Digital marketing campaign for Q1 2024',
      code: 'PRJ-003',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      budget: 200000,
      progress: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      actualStartDate: new Date('2024-01-01'),
      actualEndDate: new Date('2024-03-28'),
      actualCost: 185000,
      tags: ['marketing', 'digital'],
      notes: 'Exceeded KPIs by 15%',
    },
    {
      name: 'ERP System Integration',
      description: 'Integration of new ERP system with existing infrastructure',
      code: 'PRJ-004',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      budget: 1200000,
      progress: 30,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      tags: ['erp', 'integration', 'enterprise'],
      notes: 'Waiting for vendor approval',
    },
    {
      name: 'Customer Portal Development',
      description: 'Self-service portal for customers',
      code: 'PRJ-005',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      budget: 350000,
      progress: 45,
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-05-15'),
      tags: ['portal', 'customer-service'],
      notes: 'Phase 1 completed, starting Phase 2',
    },
  ]

  for (const projectData of projects) {
    const project = await prisma.project.create({
      data: {
        ...projectData,
        tenantId,
        ownerId: userIds[Math.floor(Math.random() * userIds.length)],
        clientId: contactIds[Math.floor(Math.random() * contactIds.length)],
      },
    })

    // Add project tasks
    const taskTemplates = [
      { name: 'Requirements Gathering', status: 'COMPLETED', priority: 'HIGH' },
      { name: 'Design Mockups', status: 'IN_PROGRESS', priority: 'HIGH' },
      { name: 'Development', status: 'TODO', priority: 'MEDIUM' },
      { name: 'Testing', status: 'TODO', priority: 'MEDIUM' },
      { name: 'Deployment', status: 'TODO', priority: 'LOW' },
    ]

    for (const taskTemplate of taskTemplates) {
      await prisma.projectTask.create({
        data: {
          name: taskTemplate.name,
          description: `Task for ${project.name}`,
          status: taskTemplate.status,
          priority: taskTemplate.priority,
          projectId: project.id,
          assignedToId: userIds[Math.floor(Math.random() * userIds.length)],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Add project members (ensure unique users)
    const memberCount = Math.min(Math.floor(Math.random() * 3) + 1, userIds.length)
    const selectedUserIds = userIds.sort(() => 0.5 - Math.random()).slice(0, memberCount)
    for (const userId of selectedUserIds) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER'][Math.floor(Math.random() * 3)],
        },
      })
    }
  }
}

// ===== EXPENSES =====
async function seedExpenses(tenantId: string, userIds: string[]) {
  const expenseCategories = [
    'Travel',
    'Meals & Entertainment',
    'Office Supplies',
    'Software Subscriptions',
    'Marketing',
    'Utilities',
    'Professional Services',
    'Equipment',
  ]

  const expenses = [
    { amount: 15000, category: 'Travel', description: 'Flight tickets for client meeting', date: new Date('2024-03-15') },
    { amount: 3500, category: 'Meals & Entertainment', description: 'Client dinner meeting', date: new Date('2024-03-18') },
    { amount: 8500, category: 'Office Supplies', description: 'Office stationery and supplies', date: new Date('2024-03-20') },
    { amount: 12000, category: 'Software Subscriptions', description: 'Annual subscription for design tools', date: new Date('2024-03-22') },
    { amount: 25000, category: 'Marketing', description: 'Social media advertising campaign', date: new Date('2024-03-25') },
    { amount: 5000, category: 'Utilities', description: 'Internet and phone bills', date: new Date('2024-03-28') },
    { amount: 30000, category: 'Professional Services', description: 'Legal consultation fees', date: new Date('2024-04-01') },
    { amount: 18000, category: 'Equipment', description: 'New laptops for team', date: new Date('2024-04-05') },
    { amount: 4500, category: 'Travel', description: 'Hotel accommodation for conference', date: new Date('2024-04-10') },
    { amount: 2200, category: 'Meals & Entertainment', description: 'Team lunch', date: new Date('2024-04-12') },
  ]

  for (const expenseData of expenses) {
    await prisma.expense.create({
      data: {
        ...expenseData,
        tenantId,
        employeeId: null, // Expenses can be without employee association
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
        receiptUrl: `https://example.com/receipts/${Math.random().toString(36).substring(7)}.pdf`,
      },
    })
  }
}

// ===== VENDORS =====
async function seedVendors(tenantId: string) {
  const vendors = [
    {
      name: 'Tech Supplies India',
      email: 'contact@techsupplies.in',
      phone: '+91-80-12345678',
      address: '123 Industrial Area, Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      gstin: '29ABCDE1234F1Z5',
      // category removed - not in schema
      paymentTerms: 'Net 30',
    },
    {
      name: 'Office Furniture Co.',
      email: 'sales@officefurniture.co.in',
      phone: '+91-11-23456789',
      address: '456 Commercial Street',
      city: 'Delhi',
      state: 'Delhi',
      gstin: '07FGHIJ5678K2L6',
      // category removed
      paymentTerms: 'Net 45',
    },
    {
      name: 'Marketing Services Pvt Ltd',
      email: 'hello@marketingservices.in',
      phone: '+91-22-34567890',
      address: '789 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstin: '27MNOPQ9012R3S7',
      // category removed
      paymentTerms: 'Net 15',
    },
    {
      name: 'Raw Materials Supplier',
      email: 'info@rawmaterials.in',
      phone: '+91-44-45678901',
      address: '321 Manufacturing Zone',
      city: 'Chennai',
      state: 'Tamil Nadu',
      gstin: '33TUVWX3456Y4Z8',
      // category removed
      paymentTerms: 'Net 30',
    },
    {
      name: 'Logistics Solutions',
      email: 'support@logistics.in',
      phone: '+91-40-56789012',
      address: '654 Transport Hub',
      city: 'Hyderabad',
      state: 'Telangana',
      gstin: '36ABCD1234E5F9',
      // category removed
      paymentTerms: 'Net 30',
    },
  ]

  for (const vendorData of vendors) {
    await prisma.vendor.create({
      data: {
        ...vendorData,
        tenantId,
        status: 'ACTIVE',
      },
    })
  }
}

// ===== PURCHASE ORDERS =====
async function seedPurchaseOrders(tenantId: string) {
  // Delete existing purchase orders
  await prisma.purchaseOrder.deleteMany({ where: { tenantId } })

  const vendors = await prisma.vendor.findMany({
    where: { tenantId },
    take: 5,
  })

  if (vendors.length === 0) {
    console.log('⚠️ No vendors found. Skipping purchase orders.')
    return
  }

  const purchaseOrders = [
    { poNumber: 'PO-2024-001', status: 'APPROVED', subtotalAmount: 150000 },
    { poNumber: 'PO-2024-002', status: 'PENDING', subtotalAmount: 85000 },
    { poNumber: 'PO-2024-003', status: 'APPROVED', subtotalAmount: 120000 },
    { poNumber: 'PO-2024-004', status: 'REJECTED', subtotalAmount: 45000 },
    { poNumber: 'PO-2024-005', status: 'APPROVED', subtotalAmount: 200000 },
    { poNumber: 'PO-2024-006', status: 'PENDING', subtotalAmount: 95000 },
    { poNumber: 'PO-2024-007', status: 'APPROVED', subtotalAmount: 175000 },
    { poNumber: 'PO-2024-008', status: 'DRAFT', subtotalAmount: 60000 },
  ]

  for (const poData of purchaseOrders) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)]
    const subtotal = poData.subtotalAmount
    const tax = subtotal * 0.18 // 18% GST
    const total = subtotal + tax
    
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: poData.poNumber,
        status: poData.status,
        tenantId,
        vendorId: vendor.id,
        subtotal,
        tax,
        total,
        orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
      },
    })

    // Add items to purchase order
    const itemCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < itemCount; i++) {
      const quantity = Math.floor(Math.random() * 10) + 1
      const unitPrice = Math.floor(Math.random() * 10000) + 1000
      const taxRate = 18
      const taxAmount = (unitPrice * quantity * taxRate) / 100
      const itemTotal = (unitPrice * quantity) + taxAmount
      
      await prisma.purchaseOrderItem.create({
        data: {
          poId: po.id,
          productName: `Product ${i + 1}`,
          description: `Description for product ${i + 1}`,
          quantity,
          unitPrice,
          taxRate,
          taxAmount,
          total: itemTotal,
        },
      })
    }
  }
}

// ===== ATTENDANCE =====
async function seedAttendance(tenantId: string, userIds: string[]) {
  // Get employees (attendance is linked to employees, not users)
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    take: 5,
  })

  if (employees.length === 0) {
    console.log('⚠️ No employees found. Skipping attendance records.')
    return
  }

  // Create attendance records for the last 30 days
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    for (const employee of employees) {
      // Random check-in time between 9 AM and 10 AM
      const checkInHour = 9 + Math.floor(Math.random() * 2)
      const checkInMinute = Math.floor(Math.random() * 60)
      const checkInTime = new Date(date)
      checkInTime.setHours(checkInHour, checkInMinute, 0, 0)

      // Random check-out time between 5 PM and 7 PM
      const checkOutHour = 17 + Math.floor(Math.random() * 3)
      const checkOutMinute = Math.floor(Math.random() * 60)
      const checkOutTime = new Date(date)
      checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0)

      await prisma.attendanceRecord.create({
        data: {
          tenantId,
          employeeId: employee.id,
          date,
          checkInTime: checkInTime,
          checkOutTime: checkOutTime,
          status: 'PRESENT',
          workHours: (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60),
        },
      })
    }
  }
}

// ===== LEAVE MANAGEMENT =====
async function seedLeaveManagement(tenantId: string, userIds: string[]) {
  // Create leave types
  const leaveTypes = [
    { name: 'Annual Leave', code: 'AL', isPaid: true },
    { name: 'Sick Leave', code: 'SL', isPaid: true },
    { name: 'Casual Leave', code: 'CL', isPaid: true },
    { name: 'Personal Leave', code: 'PL', isPaid: false },
  ]

  const createdLeaveTypes = []
  for (const leaveTypeData of leaveTypes) {
    const leaveType = await prisma.leaveType.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: leaveTypeData.name,
        },
      },
      update: {},
      create: {
        ...leaveTypeData,
        tenantId,
      },
    })
    createdLeaveTypes.push(leaveType)
  }

  // Create leave requests
  const leaveRequests = [
    { startDate: new Date('2024-04-01'), endDate: new Date('2024-04-03'), reason: 'Family vacation' },
    { startDate: new Date('2024-04-10'), endDate: new Date('2024-04-10'), reason: 'Personal work' },
    { startDate: new Date('2024-04-15'), endDate: new Date('2024-04-17'), reason: 'Medical appointment' },
    { startDate: new Date('2024-04-20'), endDate: new Date('2024-04-22'), reason: 'Wedding' },
    { startDate: new Date('2024-05-01'), endDate: new Date('2024-05-05'), reason: 'Holiday trip' },
    { startDate: new Date('2024-05-10'), endDate: new Date('2024-05-10'), reason: 'Sick leave' },
    { startDate: new Date('2024-05-15'), endDate: new Date('2024-05-16'), reason: 'Family function' },
    { startDate: new Date('2024-05-20'), endDate: new Date('2024-05-20'), reason: 'Personal' },
  ]

  // Get employees for leave requests
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    take: 5,
  })

  if (employees.length === 0) {
    console.log('⚠️ No employees found. Skipping leave requests.')
    return
  }

  for (const leaveRequestData of leaveRequests) {
    const leaveType = createdLeaveTypes[Math.floor(Math.random() * createdLeaveTypes.length)]
    const employee = employees[Math.floor(Math.random() * employees.length)]
    const status = ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)]

    await prisma.leaveRequest.create({
      data: {
        ...leaveRequestData,
        tenantId,
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        status,
        days: Math.ceil((leaveRequestData.endDate.getTime() - leaveRequestData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      },
    })
  }
}

// ===== RESTAURANT DATA =====
async function seedRestaurantData(tenantId: string) {
  // Delete existing restaurant data
  await prisma.restaurantOrderItem.deleteMany({ where: { order: { tenantId } } })
  await prisma.restaurantOrder.deleteMany({ where: { tenantId } })
  await prisma.restaurantReservation.deleteMany({ where: { tenantId } })
  await prisma.restaurantTable.deleteMany({ where: { tenantId } })
  await prisma.restaurantMenuItem.deleteMany({ where: { tenantId } })

  // Create restaurant tables
  const tables = []
  for (let i = 1; i <= 8; i++) {
    const table = await prisma.restaurantTable.create({
      data: {
        tenantId,
        tableNumber: i,
        capacity: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
        status: ['AVAILABLE', 'OCCUPIED', 'RESERVED'][Math.floor(Math.random() * 3)],
        location: ['Indoor', 'Outdoor', 'VIP'][Math.floor(Math.random() * 3)],
      },
    })
    tables.push(table)
  }

  // Create menu items
  const menuItems = [
    { name: 'Margherita Pizza', category: 'Pizza', price: 350, description: 'Classic tomato and mozzarella' },
    { name: 'Pepperoni Pizza', category: 'Pizza', price: 450, description: 'Spicy pepperoni with cheese' },
    { name: 'Caesar Salad', category: 'Salads', price: 280, description: 'Fresh romaine with caesar dressing' },
    { name: 'Grilled Chicken', category: 'Main Course', price: 550, description: 'Herb-marinated grilled chicken' },
    { name: 'Pasta Carbonara', category: 'Pasta', price: 420, description: 'Creamy pasta with bacon' },
    { name: 'Chocolate Brownie', category: 'Desserts', price: 180, description: 'Warm chocolate brownie with ice cream' },
    { name: 'Mango Smoothie', category: 'Beverages', price: 150, description: 'Fresh mango smoothie' },
    { name: 'Cappuccino', category: 'Beverages', price: 120, description: 'Espresso with steamed milk' },
    { name: 'Garlic Bread', category: 'Appetizers', price: 200, description: 'Crispy garlic bread' },
    { name: 'Chicken Wings', category: 'Appetizers', price: 380, description: 'Spicy buffalo wings' },
    { name: 'Fish Curry', category: 'Main Course', price: 480, description: 'Spicy fish curry with rice' },
    { name: 'Vegetable Biryani', category: 'Main Course', price: 320, description: 'Fragrant vegetable biryani' },
    { name: 'Tiramisu', category: 'Desserts', price: 250, description: 'Classic Italian dessert' },
    { name: 'Iced Tea', category: 'Beverages', price: 100, description: 'Refreshing iced tea' },
    { name: 'Spring Rolls', category: 'Appetizers', price: 220, description: 'Crispy vegetable spring rolls' },
  ]

  for (const menuItemData of menuItems) {
    await prisma.restaurantMenuItem.create({
      data: {
        ...menuItemData,
        tenantId,
        isAvailable: Math.random() > 0.2, // 80% available
      },
    })
  }

  // Create restaurant orders
  const menuItemsList = await prisma.restaurantMenuItem.findMany({
    where: { tenantId },
    take: 15,
  })

  for (let i = 0; i < 10; i++) {
    const table = tables[Math.floor(Math.random() * tables.length)]
    const order = await prisma.restaurantOrder.create({
      data: {
        tenantId,
        tableId: table.id,
        orderNumber: `ORD-${Date.now()}-${i}`,
        status: ['PENDING', 'PREPARING', 'READY', 'SERVED'][Math.floor(Math.random() * 4)],
        // orderType removed - not in schema
        totalAmount: 0,
      },
    })

    // Add items to order
    const itemCount = Math.floor(Math.random() * 4) + 1
    let totalAmount = 0
    for (let j = 0; j < itemCount; j++) {
      const menuItem = menuItemsList[Math.floor(Math.random() * menuItemsList.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const itemTotal = Number(menuItem.price) * quantity
      totalAmount += itemTotal

      await prisma.restaurantOrderItem.create({
        data: {
          orderId: order.id,
          menuItemId: menuItem.id,
          quantity,
          price: menuItem.price,
          subtotal: itemTotal,
          specialInstructions: j === 0 ? 'No onions please' : null,
        },
      })
    }

    // Update order total
    await prisma.restaurantOrder.update({
      where: { id: order.id },
      data: { totalAmount },
    })
  }

  // Create reservations
  for (let i = 0; i < 5; i++) {
    const table = tables[Math.floor(Math.random() * tables.length)]
    const reservationDate = new Date()
    reservationDate.setDate(reservationDate.getDate() + Math.floor(Math.random() * 7))
    reservationDate.setHours(18 + Math.floor(Math.random() * 4), 0, 0, 0)

    await prisma.restaurantReservation.create({
      data: {
        tenantId,
        tableId: table.id,
        reservationNumber: `RES-${Date.now()}-${i}`,
        customerName: `Customer ${i + 1}`,
        customerPhone: `+91-98765${Math.floor(Math.random() * 100000)}`,
        customerEmail: `customer${i + 1}@example.com`,
        reservationDate,
        partySize: table.capacity,
        status: ['CONFIRMED', 'PENDING', 'CANCELLED'][Math.floor(Math.random() * 3)],
        specialRequests: i === 0 ? 'Window seat preferred' : null,
      },
    })
  }
}

// ===== RETAIL DATA =====
async function seedRetailData(tenantId: string, contacts: any[]) {
  // Delete existing retail data
  await prisma.retailTransactionItem.deleteMany({ where: { transaction: { tenantId } } })
  await prisma.retailTransaction.deleteMany({ where: { tenantId } })
  await prisma.retailProduct.deleteMany({ where: { tenantId } })

  // Create retail products
  const retailProducts = [
    { name: 'Wireless Mouse', sku: 'RT-001', price: 599, stockQuantity: 50, category: 'Electronics' },
    { name: 'USB Keyboard', sku: 'RT-002', price: 899, stockQuantity: 30, category: 'Electronics' },
    { name: 'Laptop Stand', sku: 'RT-003', price: 1299, stockQuantity: 25, category: 'Accessories' },
    { name: 'Webcam HD', sku: 'RT-004', price: 2499, stockQuantity: 15, category: 'Electronics' },
    { name: 'Desk Organizer', sku: 'RT-005', price: 499, stockQuantity: 40, category: 'Accessories' },
    { name: 'Monitor Stand', sku: 'RT-006', price: 1799, stockQuantity: 20, category: 'Accessories' },
    { name: 'Cable Management', sku: 'RT-007', price: 299, stockQuantity: 60, category: 'Accessories' },
    { name: 'USB Hub', sku: 'RT-008', price: 799, stockQuantity: 35, category: 'Electronics' },
    { name: 'Laptop Bag', sku: 'RT-009', price: 1999, stockQuantity: 20, category: 'Accessories' },
    { name: 'Wireless Charger', sku: 'RT-010', price: 1499, stockQuantity: 18, category: 'Electronics' },
    { name: 'Phone Stand', sku: 'RT-011', price: 399, stockQuantity: 45, category: 'Accessories' },
    { name: 'Bluetooth Speaker', sku: 'RT-012', price: 3499, stockQuantity: 12, category: 'Electronics' },
  ]

  for (const productData of retailProducts) {
    await prisma.retailProduct.create({
      data: {
        ...productData,
        tenantId,
        description: `High-quality ${productData.name.toLowerCase()}`,
        isActive: true,
      },
    })
  }

  // Create retail transactions
  const retailProductsList = await prisma.retailProduct.findMany({
    where: { tenantId },
    take: 12,
  })

  for (let i = 0; i < 10; i++) {
    const contact = contacts[Math.floor(Math.random() * contacts.length)]
    const transaction = await prisma.retailTransaction.create({
      data: {
        tenantId,
        customerId: contact?.id || null,
        transactionNumber: `TXN-${Date.now()}-${i}`,
        paymentMethod: ['cash', 'card', 'upi', 'wallet'][Math.floor(Math.random() * 4)],
        paymentStatus: ['PAID', 'PENDING', 'REFUNDED'][Math.floor(Math.random() * 3)],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      },
    })

    // Add items to transaction
    const itemCount = Math.floor(Math.random() * 3) + 1
    let totalAmount = 0
    for (let j = 0; j < itemCount; j++) {
      const product = retailProductsList[Math.floor(Math.random() * retailProductsList.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const itemTotal = Number(product.price) * quantity
      totalAmount += itemTotal

      await prisma.retailTransactionItem.create({
        data: {
          transactionId: transaction.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          subtotal: itemTotal,
        },
      })
    }

    // Calculate tax and total
    const tax = totalAmount * 0.18 // 18% GST
    const finalTotal = totalAmount + tax
    
    // Update transaction totals
    await prisma.retailTransaction.update({
      where: { id: transaction.id },
      data: { 
        subtotal: totalAmount,
        tax,
        total: finalTotal,
      },
    })
  }
}

// Run the seeder
seedExtendedModules()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

