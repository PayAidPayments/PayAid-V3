/**
 * Subscription invoice generation and management
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Generate a subscription invoice
 */
export async function generateSubscriptionInvoice(subscription: any) {
  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + 7) // 7 days to pay

  // Generate invoice number
  const invoiceNumber = `INV-${subscription.tenantId.substring(0, 8).toUpperCase()}-${Date.now()}`

  // Calculate amounts
  const amount = subscription.monthlyPrice
  const taxRate = new Decimal(0.18) // 18% GST
  const taxAmount = amount.mul(taxRate)
  const totalAmount = amount.add(taxAmount)

  // Create invoice
  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      invoiceNumber,
      amount,
      taxAmount,
      totalAmount,
      currency: 'INR',
      status: 'pending',
      dueDate,
      paymentMethodId: subscription.paymentMethodId,
    },
  })

  return invoice
}

/**
 * Process payment for an invoice
 */
export async function processInvoicePayment(
  invoiceId: string,
  paymentMethodId: string
) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: true,
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice already paid')
  }

  // TODO: Process payment via payment gateway
  // For now, simulate success
  const paymentSuccess = true

  if (paymentSuccess) {
    await prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethodId,
      },
    })

    return { success: true, invoice }
  } else {
    throw new Error('Payment processing failed')
  }
}

