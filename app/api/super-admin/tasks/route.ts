import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Get KYC reviews needed
    const kycReviews = await prisma.merchantOnboarding.findMany({
      where: {
        status: 'pending_review',
        kycStatus: { in: ['pending', 'needs_info'] },
      },
      take: 20,
      select: {
        id: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get plan change requests (mock - would come from a requests table)
    const planChangeRequests: any[] = [] // TODO: Implement plan change requests

    // Get data export requests (mock - would come from a requests table)
    const dataExportRequests: any[] = [] // TODO: Implement data export requests

    // Get compliance tickets (mock - would come from a tickets table)
    const complianceTickets: any[] = [] // TODO: Implement compliance tickets

    const tasks = [
      ...kycReviews.map((kyc) => ({
        id: `kyc-${kyc.id}`,
        type: 'kyc_review' as const,
        title: `KYC Review: ${kyc.tenant.name}`,
        description: 'KYC documents pending review',
        priority: 'high' as const,
        status: 'pending' as const,
        assignedTo: null,
        createdAt: kyc.createdAt.toISOString(),
        dueDate: null,
        metadata: { tenantId: kyc.tenantId, onboardingId: kyc.id },
      })),
      ...planChangeRequests,
      ...dataExportRequests,
      ...complianceTickets,
    ]

    // Filter by status if provided
    const filtered = statusFilter && statusFilter !== 'all'
      ? tasks.filter((t) => t.status === statusFilter)
      : tasks

    // Sort by priority and created date
    const sorted = filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ data: sorted })
  } catch (e) {
    console.error('Tasks error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
