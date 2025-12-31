import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  cancelImmediately: z.boolean().optional().default(false),
})

// POST /api/subscriptions/[id]/cancel - Cancel subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')
    const resolvedParams = await Promise.resolve(params)
    const subscriptionId = resolvedParams.id

    const body = await request.json()
    const validated = cancelSubscriptionSchema.parse(body)

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        tenantId,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel subscription
    const cancelled = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: validated.reason,
        // If cancel immediately, set end date to now
        ...(validated.cancelImmediately && {
          billingCycleEnd: new Date(),
        }),
      },
      include: {
        plan: true,
      },
    })

    // Update tenant to free tier if cancelling immediately
    if (validated.cancelImmediately) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: 'free',
          licensedModules: [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      subscription: cancelled,
      message: validated.cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at end of billing period',
    })
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
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

