import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { generateSubscriptionInvoice } from '@/lib/billing/subscription-invoice'
import { createDunningAttempt } from '@/lib/billing/dunning'

// POST /api/subscriptions/[id]/renew - Renew subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')
    const resolvedParams = await Promise.resolve(params)
    const subscriptionId = resolvedParams.id

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        tenantId,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      )
    }

    // Check if renewal is due
    const now = new Date()
    if (subscription.billingCycleEnd > now) {
      return NextResponse.json(
        { error: 'Subscription is not due for renewal yet' },
        { status: 400 }
      )
    }

    // Generate invoice
    const invoice = await generateSubscriptionInvoice(subscription)

    // Attempt payment
    let paymentSuccess = false
    if (subscription.paymentMethod) {
      // TODO: Process payment via PayAid Payments or other gateway
      // For now, mark as pending
      paymentSuccess = false
    }

    if (paymentSuccess) {
      // Update subscription
      const newBillingCycleStart = subscription.billingCycleEnd
      const newBillingCycleEnd = new Date(newBillingCycleStart)
      newBillingCycleEnd.setMonth(newBillingCycleEnd.getMonth() + 1)

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          billingCycleStart: newBillingCycleStart,
          billingCycleEnd: newBillingCycleEnd,
          status: 'active',
        },
      })

      // Update invoice
      await prisma.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        subscription: await prisma.subscription.findUnique({
          where: { id: subscriptionId },
          include: { plan: true },
        }),
        invoice,
      })
    } else {
      // Payment failed - trigger dunning
      await triggerDunning(subscription, invoice)

      return NextResponse.json({
        success: false,
        message: 'Payment failed - dunning process initiated',
        invoice,
      }, { status: 402 })
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Renew subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to renew subscription' },
      { status: 500 }
    )
  }
}

async function triggerDunning(subscription: any, invoice: any) {
  // Use dunning service
  await createDunningAttempt(
    subscription.id,
    invoice.id,
    subscription.tenantId,
    invoice.totalAmount,
    subscription.paymentMethodId || undefined
  )
}

