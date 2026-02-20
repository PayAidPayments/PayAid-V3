import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const kycStatus = searchParams.get('kycStatus') || undefined
    const sort = searchParams.get('sort') || 'created_desc' // risk_asc, risk_desc, created_asc, created_desc, revenue_desc

    const orderBy: any =
      sort === 'risk_asc'
        ? [{ riskScore: 'asc' }, { createdAt: 'desc' }]
        : sort === 'risk_desc'
          ? [{ riskScore: 'desc' }, { createdAt: 'desc' }]
          : sort === 'created_asc'
            ? { createdAt: 'asc' }
            : { createdAt: 'desc' }

    const onboardingRecords = await prisma.merchantOnboarding.findMany({
      where: {
        ...(status && { status }),
        ...(kycStatus && { kycStatus }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            status: true,
          },
        },
        kycDocuments: {
          select: {
            id: true,
            documentType: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy,
    })

    const data = onboardingRecords.map((record) => ({
      id: record.id,
      tenantId: record.tenantId,
      tenant: record.tenant,
      status: record.status,
      kycStatus: record.kycStatus,
      riskScore: record.riskScore,
      documents: record.documents,
      reviewedById: record.reviewedBy,
      reviewedAt: record.reviewedAt?.toISOString(),
      rejectionReason: record.rejectionReason,
      notes: record.notes,
      kycDocuments: record.kycDocuments,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }))

    // Calculate summary stats
    const stats = {
      total: onboardingRecords.length,
      pendingReview: onboardingRecords.filter((r) => r.status === 'pending_review').length,
      approved: onboardingRecords.filter((r) => r.status === 'approved').length,
      rejected: onboardingRecords.filter((r) => r.status === 'rejected').length,
      needsInfo: onboardingRecords.filter((r) => r.status === 'needs_info').length,
      kycVerified: onboardingRecords.filter((r) => r.kycStatus === 'verified').length,
      kycPending: onboardingRecords.filter((r) => r.kycStatus === 'in_progress' || r.kycStatus === 'not_started').length,
    }

    return NextResponse.json({ data, stats })
  } catch (e) {
    console.error('Super admin onboarding list error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
