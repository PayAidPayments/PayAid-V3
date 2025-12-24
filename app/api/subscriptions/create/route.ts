import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { z } from 'zod'

const subscriptionSchema = z.object({
  planId: z.string().min(1),
  tenantId: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  startDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validated = subscriptionSchema.parse(body)
    
    const payaid = getPayAidPayments()
    const subscription = await payaid.createSubscription({
      planId: validated.planId,
      customer: validated.customer,
      startDate: validated.startDate,
      metadata: {
        tenantId: validated.tenantId,
      },
    })

    // Update tenant with subscription info
    const { prisma } = await import('@/lib/db/prisma')
    await prisma.tenant.update({
      where: { id: validated.tenantId },
      data: {
        subscriptionId: subscription.id,
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        plan: validated.planId,
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

