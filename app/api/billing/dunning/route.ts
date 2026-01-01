import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getDunningAttempts, processDunningAttempt } from '@/lib/billing/dunning'

// GET /api/billing/dunning - Get dunning attempts for subscription
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    // Verify subscription belongs to tenant
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

    const attempts = await getDunningAttempts(subscriptionId)

    return NextResponse.json({ attempts })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get dunning attempts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dunning attempts' },
      { status: 500 }
    )
  }
}

// POST /api/billing/dunning - Process a dunning attempt
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const { attemptId } = body

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      )
    }

    // Verify attempt belongs to tenant
    const attempt = await prisma.dunningAttempt.findUnique({
      where: { id: attemptId },
      include: {
        subscription: true,
      },
    })

    if (!attempt || attempt.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Dunning attempt not found' },
        { status: 404 }
      )
    }

    const result = await processDunningAttempt(attemptId)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Process dunning attempt error:', error)
    return NextResponse.json(
      { error: 'Failed to process dunning attempt' },
      { status: 500 }
    )
  }
}

