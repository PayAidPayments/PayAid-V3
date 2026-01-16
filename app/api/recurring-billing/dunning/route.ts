import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/recurring-billing/dunning - Get dunning attempts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const invoiceId = searchParams.get('invoiceId')

    const where: any = {
      tenantId,
    }

    if (status) {
      where.status = status
    }

    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    const dunningAttempts = await prisma.dunningAttempt.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            customerName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ dunningAttempts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get dunning attempts error:', error)
    return NextResponse.json(
      { error: 'Failed to get dunning attempts' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-billing/dunning - Create dunning attempt (retry failed payment)
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const { invoiceId, retryMethod, notes } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Get the failed invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        status: 'failed',
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Failed invoice not found' },
        { status: 404 }
      )
    }

    // Count existing attempts
    const attemptCount = await prisma.dunningAttempt.count({
      where: {
        invoiceId,
        tenantId,
      },
    })

    // Get subscription if invoice is part of a subscription
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found. Dunning attempts require a subscription.' },
        { status: 400 }
      )
    }

    // Create dunning attempt (requires subscriptionId)
    const dunningAttempt = await prisma.dunningAttempt.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        invoiceId,
        attemptNumber: attemptCount + 1,
        status: 'pending',
        amount: invoice.total,
        retryMethod: retryMethod || 'email',
      },
    })

    // TODO: Trigger payment retry based on retryMethod
    // - email: Send payment reminder email
    // - sms: Send payment reminder SMS
    // - auto: Automatically retry payment if payment method exists

    return NextResponse.json({ dunningAttempt }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create dunning attempt error:', error)
    return NextResponse.json(
      { error: 'Failed to create dunning attempt' },
      { status: 500 }
    )
  }
}

