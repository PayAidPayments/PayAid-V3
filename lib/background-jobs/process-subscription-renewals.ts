/**
 * Background job to process subscription renewals
 * Runs daily to check for subscriptions due for renewal
 */

import { prisma } from '@/lib/db/prisma'
import { generateSubscriptionInvoice } from '@/lib/billing/subscription-invoice'
import { processInvoicePayment } from '@/lib/billing/subscription-invoice'

/**
 * Process all subscriptions due for renewal
 */
export async function processSubscriptionRenewals(tenantId?: string) {
  const now = new Date()
  
  const where: any = {
    status: 'active',
    billingCycleEnd: {
      lte: now,
    },
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get subscriptions due for renewal
  const dueSubscriptions = await prisma.subscription.findMany({
    where,
    include: {
      plan: true,
      paymentMethod: true,
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    take: 100, // Process in batches
  })

  console.log(`Processing ${dueSubscriptions.length} subscription renewals...`)

  let successCount = 0
  let failureCount = 0

  for (const subscription of dueSubscriptions) {
    try {
      // Generate invoice
      const invoice = await generateSubscriptionInvoice(subscription)

      // Attempt payment if payment method exists
      if (subscription.paymentMethod) {
        try {
          await processInvoicePayment(invoice.id, subscription.paymentMethod.id)

          // Update subscription billing cycle
          const newBillingCycleStart = subscription.billingCycleEnd
          const newBillingCycleEnd = new Date(newBillingCycleStart)
          newBillingCycleEnd.setMonth(newBillingCycleEnd.getMonth() + 1)

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              billingCycleStart: newBillingCycleStart,
              billingCycleEnd: newBillingCycleEnd,
              status: 'active',
            },
          })

          successCount++
          console.log(`✅ Renewed subscription: ${subscription.tenantId}`)
        } catch (paymentError) {
          // Payment failed - trigger dunning
          await triggerDunning(subscription, invoice)
          failureCount++
          console.log(`❌ Payment failed for subscription: ${subscription.tenantId}`)
        }
      } else {
        // No payment method - mark for manual payment
        console.log(`⚠️  No payment method for subscription: ${subscription.tenantId}`)
        failureCount++
      }
    } catch (error) {
      console.error(`❌ Failed to process subscription ${subscription.id}:`, error)
      failureCount++
    }
  }

  console.log(
    `Renewal processing complete: ${successCount} succeeded, ${failureCount} failed`
  )

  return {
    total: dueSubscriptions.length,
    success: successCount,
    failures: failureCount,
  }
}

/**
 * Trigger dunning process for failed payment
 */
async function triggerDunning(subscription: any, invoice: any) {
  // Get existing dunning attempts
  const existingAttempts = await prisma.dunningAttempt.findMany({
    where: {
      subscriptionId: subscription.id,
      status: 'pending',
    },
    orderBy: { attemptNumber: 'desc' },
    take: 1,
  })

  const nextAttemptNumber = existingAttempts.length > 0
    ? existingAttempts[0].attemptNumber + 1
    : 1

  // Create dunning attempt
  await prisma.dunningAttempt.create({
    data: {
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      tenantId: subscription.tenantId,
      attemptNumber: nextAttemptNumber,
      status: 'pending',
      amount: invoice.totalAmount,
      paymentMethodId: subscription.paymentMethodId,
    },
  })

  // TODO: Send email notification
  // TODO: Schedule retry attempts based on dunning strategy
}

