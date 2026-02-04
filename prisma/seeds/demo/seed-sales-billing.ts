/**
 * Sales & Billing Module Seeder for Demo Business
 * Seeds: Orders, OrderItems, Invoices, Payments, Subscriptions
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, distributeAcrossMonths } from './date-utils'

export interface SalesBillingSeedResult {
  orders: number
  invoices: number
  payments: number
  subscriptions: number
}

export async function seedSalesAndBillingModule(
  tenantId: string,
  contacts: any[],
  products: any[],
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient: PrismaClient
): Promise<SalesBillingSeedResult> {
  const prisma = prismaClient
  console.log('💰 Seeding Sales & Billing Module...')

  // 1. ORDERS - 400 orders across 12 months
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  const orderData = Array.from({ length: 400 }, (_, i) => {
    const customer = contacts[Math.floor(Math.random() * contacts.length)]
    const orderDate = randomDateInRange(range)
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

    return {
      tenantId,
      orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
      status,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress: customer.address || `${i + 1} Street`,
      shippingCity: customer.city || 'Bangalore',
      shippingPostal: customer.postalCode || '560001',
      shippingCountry: 'India',
      customerId: customer.id,
      createdAt: orderDate,
      paidAt,
      shippedAt,
      deliveredAt,
    }
  })

  // Create orders in batches to avoid connection pool exhaustion
  const batchSize = 5 // Very small batch size to avoid connection pool exhaustion
  const orders = []
  for (let i = 0; i < orderData.length; i += batchSize) {
    const batch = orderData.slice(i, i + batchSize)
    const batchOrders = await Promise.all(
      batch.map(async (order) => {
      const createdOrder = await prisma.order.create({ data: order })
      
      // Create 1-5 order items per order
      const numItems = Math.floor(Math.random() * 5) + 1
      const orderItems = []
      
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
        orderItems.push({ product: product.name, quantity, total })
      }
      
        return createdOrder
      })
    )
    orders.push(...batchOrders)
    // Longer delay between batches
    if (i + batchSize < orderData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${orders.length} orders with items`)

  // 2. INVOICES - 350 invoices (most orders get invoices)
  const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  const invoiceData = Array.from({ length: 350 }, (_, i) => {
    const order = orders[Math.floor(Math.random() * orders.length)]
    const invoiceDate = randomDateInRange({ start: order.createdAt, end: range.end })
    const dueDate = new Date(invoiceDate.getTime() + (Math.floor(Math.random() * 30) + 7) * 24 * 60 * 60 * 1000)
    const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)]
    
    const subtotal = order.subtotal
    const tax = order.tax
    const total = order.total
    const gstRate = 18
    const gstAmount = tax

    return {
      tenantId,
      invoiceNumber: `INV-${String(i + 1).padStart(6, '0')}`,
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
    }
  })

  // Create invoices in batches
  const invoices = []
  const invoiceBatchSize = 5
  for (let i = 0; i < invoiceData.length; i += invoiceBatchSize) {
    const batch = invoiceData.slice(i, i + batchSize)
    const batchInvoices = await Promise.all(
      batch.map((invoice) => prisma.invoice.create({ data: invoice }))
    )
    invoices.push(...batchInvoices)
    if (i + invoiceBatchSize < invoiceData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
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
