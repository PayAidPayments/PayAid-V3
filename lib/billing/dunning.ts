/**
 * Dunning management for failed subscription payments
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface DunningStrategy {
  maxAttempts: number
  retryIntervals: number[] // Days between attempts
  escalationActions: string[]
}

const DEFAULT_DUNNING_STRATEGY: DunningStrategy = {
  maxAttempts: 3,
  retryIntervals: [1, 3, 7], // Retry after 1 day, 3 days, 7 days
  escalationActions: ['email', 'sms', 'suspend'],
}

/**
 * Create a dunning attempt for failed payment
 */
export async function createDunningAttempt(
  subscriptionId: string,
  invoiceId: string,
  tenantId: string,
  amount: Decimal,
  paymentMethodId?: string
) {
  // Get existing attempts to determine next attempt number
  const existingAttempts = await prisma.dunningAttempt.findMany({
    where: {
      subscriptionId,
      status: { in: ['pending', 'failed'] },
    },
    orderBy: { attemptNumber: 'desc' },
    take: 1,
  })

  const nextAttemptNumber = existingAttempts.length > 0
    ? existingAttempts[0].attemptNumber + 1
    : 1

  // Check if max attempts reached
  const strategy = DEFAULT_DUNNING_STRATEGY
  if (nextAttemptNumber > strategy.maxAttempts) {
    // Suspend subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'suspended',
      },
    })

    // TODO: Send suspension notification
    throw new Error('Max dunning attempts reached. Subscription suspended.')
  }

  // Create dunning attempt
  const attempt = await prisma.dunningAttempt.create({
    data: {
      subscriptionId,
      invoiceId,
      tenantId,
      attemptNumber: nextAttemptNumber,
      status: 'pending',
      amount,
      paymentMethodId,
    },
  })

  // Schedule next retry
  const retryInterval = strategy.retryIntervals[nextAttemptNumber - 1] || 7
  const retryDate = new Date()
  retryDate.setDate(retryDate.getDate() + retryInterval)

  // TODO: Schedule retry job (using cron or queue system)
  // For now, we'll rely on manual retry or cron job

  // Send notification
  await sendDunningNotification(attempt, nextAttemptNumber)

  return attempt
}

/**
 * Process a dunning attempt (retry payment)
 */
export async function processDunningAttempt(attemptId: string) {
  const attempt = await prisma.dunningAttempt.findUnique({
    where: { id: attemptId },
    include: {
      subscription: {
        include: {
          paymentMethod: true,
        },
      },
    },
  })

  if (!attempt || attempt.status !== 'pending') {
    throw new Error('Invalid dunning attempt')
  }

  // TODO: Process payment via payment gateway
  // For now, simulate payment attempt
  const paymentSuccess = false // This should be actual payment processing

  if (paymentSuccess) {
    // Mark attempt as success
    await prisma.dunningAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'success',
        succeededAt: new Date(),
      },
    })

    // Update invoice
    await prisma.subscriptionInvoice.update({
      where: { id: attempt.invoiceId! },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    })

    // Update subscription
    await prisma.subscription.update({
      where: { id: attempt.subscriptionId },
      data: {
        status: 'active',
      },
    })

    return { success: true, attempt }
  } else {
    // Mark attempt as failed
    await prisma.dunningAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'failed',
        errorMessage: 'Payment processing failed',
      },
    })

    // Create next attempt if not at max
    const strategy = DEFAULT_DUNNING_STRATEGY
    if (attempt.attemptNumber < strategy.maxAttempts) {
      await createDunningAttempt(
        attempt.subscriptionId,
        attempt.invoiceId!,
        attempt.tenantId,
        attempt.amount,
        attempt.paymentMethodId || undefined
      )
    } else {
      // Suspend subscription
      await prisma.subscription.update({
        where: { id: attempt.subscriptionId },
        data: {
          status: 'suspended',
        },
      })
    }

    return { success: false, attempt }
  }
}

/**
 * Send dunning notification
 */
async function sendDunningNotification(attempt: any, attemptNumber: number) {
  // TODO: Implement email/SMS notification
  console.log(`Dunning notification sent for attempt ${attemptNumber}`)
}

/**
 * Get dunning attempts for a subscription
 */
export async function getDunningAttempts(subscriptionId: string) {
  return prisma.dunningAttempt.findMany({
    where: { subscriptionId },
    orderBy: { attemptNumber: 'asc' },
    include: {
      paymentMethod: true,
    },
  })
}

