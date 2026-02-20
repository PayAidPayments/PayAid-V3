/**
 * Sales & Billing Module Seeder for Demo Business
 * Seeds: Orders, OrderItems, Invoices, Payments, Subscriptions
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, distributeAcrossMonths, ensureMonthlyDistribution, getMonthsInRange } from './date-utils'

export interface SalesBillingSeedResult {
  orders: number
  invoices: number
  payments: number
  subscriptions: number
}

export interface SeedSalesBillingOptions {
  maxOrders?: number
  maxInvoices?: number
}

export async function seedSalesAndBillingModule(
  tenantId: string,
  contacts: any[],
  products: any[],
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient: PrismaClient,
  options?: SeedSalesBillingOptions
): Promise<SalesBillingSeedResult> {
  const prisma = prismaClient
  const maxOrders = options?.maxOrders ?? 400
  const maxInvoices = options?.maxInvoices ?? 350
  console.log(`💰 Seeding Sales & Billing Module... (max ${maxOrders} orders, ${maxInvoices} invoices)`)

  // Unique prefix per tenant + run so Order.orderNumber and Invoice.invoiceNumber (global @unique) never collide across tenants or re-runs
  const runId = Date.now().toString(36)
  const tenantPrefix = tenantId.slice(0, 6)
  const orderPrefix = `ORD-${tenantPrefix}-${runId}`
  const invoicePrefix = `INV-${tenantPrefix}-${runId}`

  // Ensure we only use contact IDs that exist in DB (avoid Order_customerId_fkey)
  let validContacts = contacts.filter((c) => c && typeof (c as any).id === 'string')
  if (validContacts.length === 0) {
    console.log('  📋 No valid contacts passed; fetching from database...')
    validContacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, address: true, city: true, postalCode: true },
      take: 200,
    })
  }
  if (validContacts.length === 0) {
    console.warn('  ⚠️  No contacts for tenant; skipping orders.')
    return { orders: 0, invoices: 0, payments: 0, subscriptions: 0 }
  }
  console.log(`  ✓ Using ${validContacts.length} contacts for order customerId`)

  // 1. ORDERS - distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  const months = getMonthsInRange(range)
  const ordersPerMonth = Math.floor(maxOrders / months.length) || 1
  const orderData: Array<{
    tenantId: string
    orderNumber: string
    status: string
    subtotal: number
    tax: number
    shipping: number
    total: number
    shippingAddress: string
    shippingCity: string
    shippingPostal: string
    shippingCountry: string
    customerId: string
    createdAt: Date
    paidAt: Date | null
    shippedAt: Date | null
    deliveredAt: Date | null
  }> = []
  
  // Generate orders distributed across all months
  let orderIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const ordersThisMonth = monthIdx === months.length - 1 
      ? maxOrders - orderIndex // Last month gets remaining orders
      : ordersPerMonth
    
    for (let i = 0; i < ordersThisMonth && orderIndex < maxOrders; i++) {
      const customer = validContacts[Math.floor(Math.random() * validContacts.length)]
      const orderDate = randomDateInRange({ start: monthStart, end: monthEnd })
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
      
      // Calculate dates based on status
      const paidAt = ['shipped', 'delivered'].includes(status) 
        ? randomDateInRange({ start: orderDate, end: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000) })
        : null
      const shippedAt = ['shipped', 'delivered'].includes(status)
        ? randomDateInRange({ start: orderDate, end: new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000) })
        : null
      const deliveredAt = status === 'delivered'
        ? randomDateInRange({ start: shippedAt || orderDate, end: new Date((shippedAt || orderDate).getTime() + 5 * 24 * 60 * 60 * 1000) })
        : null

      const subtotal = Math.floor(Math.random() * 50000) + 5000
      const tax = subtotal * 0.18 // 18% GST
      const shipping = Math.floor(Math.random() * 500) + 100
      const total = subtotal + tax + shipping

      orderData.push({
        tenantId,
        orderNumber: `${orderPrefix}-${String(orderIndex + 1).padStart(4, '0')}`,
        status,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress: customer.address || `${orderIndex + 1} Street`,
        shippingCity: customer.city || 'Bangalore',
        shippingPostal: customer.postalCode || '560001',
        shippingCountry: 'India',
        customerId: customer.id,
        createdAt: orderDate,
        paidAt,
        shippedAt,
        deliveredAt,
      })
      orderIndex++
    }
  }

  // Create orders SEQUENTIALLY to avoid connection pool exhaustion
  const orders = []
  for (let i = 0; i < orderData.length; i++) {
    try {
      const order = orderData[i]
      if (!order.customerId) {
        console.warn(`  ⚠️  Skipping order ${i + 1}: no customerId`)
        continue
      }
      const createdOrder = await prisma.order.create({ data: order })
      
      // Create 1-5 order items per order (also sequential)
      const numItems = Math.floor(Math.random() * 5) + 1
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 5) + 1
        const price = product.salePrice
        const total = price * quantity
        
        await prisma.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: product.id,
            productName: product.name,
            quantity,
            price,
            total,
          },
        })
      }
      
      orders.push(createdOrder)
      
      // Small delay every 10 orders to allow connection pool recovery
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create order ${i + 1}:`, error?.message || error)
      // Continue with next order instead of failing completely
    }
  }

  console.log(`  ✓ Created ${orders.length} orders with items`)

  // 2. INVOICES - 350 invoices distributed across all months (linked to orders)
  const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  const invoiceData: Array<{
    tenantId: string
    invoiceNumber: string
    status: string
    subtotal: number
    tax: number
    total: number
    gstRate: number
    gstAmount: number
    invoiceDate: Date
    dueDate: Date
    paidAt: Date | null
    customerId: string
    orderNumber: string
    createdAt: Date
  }> = []
  
  // Distribute invoices across all months, ensuring each month has invoices
  const invoicesPerMonth = Math.floor(maxInvoices / months.length) || 1
  let invoiceIndex = 0
  
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const invoicesThisMonth = monthIdx === months.length - 1 
      ? maxInvoices - invoiceIndex // Last month gets remaining invoices
      : invoicesPerMonth
    
    // Get orders from this month or nearby months for invoice linking
    const ordersForInvoices = orders.filter(o => {
      const orderMonth = new Date(o.createdAt.getFullYear(), o.createdAt.getMonth())
      return orderMonth.getTime() <= monthEnd.getTime()
    })
    
    for (let i = 0; i < invoicesThisMonth && invoiceIndex < maxInvoices && ordersForInvoices.length > 0; i++) {
      const order = ordersForInvoices[Math.floor(Math.random() * ordersForInvoices.length)]
      const invoiceDate = randomDateInRange({ 
        start: order.createdAt > monthStart ? order.createdAt : monthStart, 
        end: monthEnd 
      })
      const dueDate = new Date(invoiceDate.getTime() + (Math.floor(Math.random() * 30) + 7) * 24 * 60 * 60 * 1000)
      const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)]
      
      const subtotal = order.subtotal
      const tax = order.tax
      const total = order.total
      const gstRate = 18
      const gstAmount = tax

      invoiceData.push({
        tenantId,
        invoiceNumber: `${invoicePrefix}-${String(invoiceIndex + 1).padStart(4, '0')}`,
        status,
        subtotal,
        tax,
        total,
        gstRate,
        gstAmount,
        invoiceDate,
        dueDate,
        paidAt: status === 'paid' ? randomDateInRange({ start: invoiceDate, end: dueDate }) : null,
        customerId: order.customerId,
        orderNumber: order.orderNumber,
        createdAt: invoiceDate,
      })
      invoiceIndex++
    }
  }

  // Create invoices SEQUENTIALLY to avoid connection pool exhaustion
  const invoices = []
  for (let i = 0; i < invoiceData.length; i++) {
    try {
      const invoice = invoiceData[i]
      const createdInvoice = await prisma.invoice.create({ data: invoice })
      invoices.push(createdInvoice)
      
      // Small delay every 10 invoices to allow connection pool recovery
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create invoice ${i + 1}:`, error?.message || error)
      // Continue with next invoice instead of failing completely
    }
  }

  console.log(`  ✓ Created ${invoices.length} invoices`)

  // Note: Payment and Subscription models have different structures in this schema
  // Payment is handled through PaymentMethod and invoice payments
  // Subscription is tenant-level, not customer-level

  return {
    orders: orders.length,
    invoices: invoices.length,
    payments: 0, // Payments handled through PaymentMethod (not seeded here)
    subscriptions: 0, // Subscription is tenant-level (already exists for tenant)
  }
}
