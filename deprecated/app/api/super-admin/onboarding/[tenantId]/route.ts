import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { createAuditLogData } from '@/lib/utils/audit-helper'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requireSuperAdmin()
    const { tenantId } = await params

    const onboarding = await prisma.merchantOnboarding.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            gstin: true,
            website: true,
            createdAt: true,
            status: true,
          },
        },
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    return NextResponse.json({ data: onboarding })
  } catch (e) {
    console.error('Super admin onboarding detail error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const decoded = await requireSuperAdmin()
    const userId = decoded.userId || 'system'
    const { tenantId } = await params

    const body = await request.json()
    const { status, kycStatus, notes, rejectionReason, riskScore } = body

    // Update onboarding record
    const onboarding = await prisma.merchantOnboarding.update({
      where: { tenantId },
      data: {
        ...(status && { status }),
        ...(kycStatus && { kycStatus }),
        ...(notes !== undefined && { notes }),
        ...(rejectionReason !== undefined && { rejectionReason }),
        ...(riskScore !== undefined && { riskScore }),
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        tenant: true,
        kycDocuments: true,
      },
    })

    // If approved, activate the tenant
    if (status === 'approved') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'active',
          onboardingCompleted: true,
        },
      })
    }

    // If rejected, suspend the tenant
    if (status === 'rejected') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'suspended',
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: createAuditLogData(
        'merchant_onboarding',
        tenantId,
        userId || 'system',
        `Onboarding ${status}${rejectionReason ? `: ${rejectionReason}` : ''}`,
        tenantId,
        request,
        {},
        { status, kycStatus, notes }
      ),
    })

    return NextResponse.json({ data: onboarding })
  } catch (e) {
    console.error('Super admin onboarding update error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
