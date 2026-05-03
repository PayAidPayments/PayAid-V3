import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createSubscriptionSchema = z.object({
  planId: z.string(),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().int().min(0).max(30).optional(),
})

const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(['active', 'cancelled', 'expired', 'suspended']).optional(),
  paymentMethodId: z.string().optional(),
})

// GET /api/subscriptions - Get tenant's subscription
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        paymentMethod: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            invoices: true,
            dunningAttempts: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Create subscription
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createSubscriptionSchema.parse(body)

    // Get plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validated.planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      )
    }

    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: { tenantId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Subscription already exists' },
        { status: 400 }
      )
    }

    // Calculate billing cycle
    const now = new Date()
    const trialEndsAt = validated.trialDays
      ? new Date(now.getTime() + validated.trialDays * 24 * 60 * 60 * 1000)
      : null
    const billingCycleStart = trialEndsAt || now
    const billingCycleEnd = new Date(billingCycleStart)
    billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planId: validated.planId,
        modules: plan.modules,
        tier: plan.tier,
        monthlyPrice: plan.monthlyPrice,
        billingCycleStart,
        billingCycleEnd,
        status: 'active',
        trialEndsAt,
        paymentMethodId: validated.paymentMethodId,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    })

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionTier: plan.tier,
        licensedModules: plan.modules,
      },
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// PATCH /api/subscriptions - Update subscription
export async function PATCH(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = updateSubscriptionSchema.parse(body)

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Handle plan change
    if (validated.planId && validated.planId !== subscription.planId) {
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: validated.planId },
      })

      if (!newPlan || !newPlan.isActive) {
        return NextResponse.json(
          { error: 'Plan not found or inactive' },
          { status: 404 }
        )
      }

      // Calculate proration if needed
      const { calculateProration } = await import('@/lib/billing/proration')
      const proration = calculateProration(
        subscription.monthlyPrice,
        newPlan.monthlyPrice,
        subscription.billingCycleStart,
        subscription.billingCycleEnd
      )

      // If upgrade (charge > 0), create prorated invoice
      if (proration.chargeAmount.greaterThan(0)) {
        const { generateSubscriptionInvoice } = await import('@/lib/billing/subscription-invoice')
        const proratedInvoice = await prisma.subscriptionInvoice.create({
          data: {
            subscriptionId: subscription.id,
            tenantId: subscription.tenantId,
            invoiceNumber: `INV-PRORATE-${subscription.tenantId.substring(0, 8).toUpperCase()}-${Date.now()}`,
            amount: proration.chargeAmount,
            taxAmount: proration.chargeAmount.mul(0.18), // 18% GST
            totalAmount: proration.chargeAmount.mul(1.18),
            currency: 'INR',
            status: 'pending',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            paymentMethodId: subscription.paymentMethodId,
          },
        })
        // TODO: Process payment for prorated invoice
      }

      // Update subscription with new plan
      await prisma.subscription.update({
        where: { tenantId },
        data: {
          planId: validated.planId,
          modules: newPlan.modules,
          tier: newPlan.tier,
          monthlyPrice: newPlan.monthlyPrice,
        },
      })

      // Update tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: newPlan.tier,
          licensedModules: newPlan.modules,
        },
      })
    }

    // Update other fields
    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: {
        status: validated.status,
        paymentMethodId: validated.paymentMethodId,
        cancelledAt: validated.status === 'cancelled' ? new Date() : subscription.cancelledAt,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    })

    return NextResponse.json({ subscription: updated })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

