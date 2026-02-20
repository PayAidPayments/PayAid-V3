import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const document = await prisma.kYCDocument.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        onboarding: {
          select: {
            id: true,
            status: true,
            kycStatus: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ data: document })
  } catch (e) {
    console.error('Super admin KYC document detail error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireSuperAdmin()
    const userId = decoded.userId || 'system'
    const { id } = await params

    const body = await request.json()
    const { verificationStatus, notes, rejectionReason, ocrData } = body

    const document = await prisma.kYCDocument.findUnique({
      where: { id },
      include: { tenant: true, onboarding: true },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update document verification status
    const updated = await prisma.kYCDocument.update({
      where: { id },
      data: {
        ...(verificationStatus && { verificationStatus }),
        ...(notes !== undefined && { notes }),
        ...(rejectionReason !== undefined && { rejectionReason }),
        ...(ocrData !== undefined && { ocrData }),
        verifiedBy: userId,
        verifiedAt: new Date(),
      },
      include: {
        tenant: true,
        onboarding: true,
      },
    })

    // Update onboarding KYC status if all documents are verified
    if (updated.onboardingId) {
      const allDocuments = await prisma.kYCDocument.findMany({
        where: { tenantId: document.tenantId },
      })

      const allVerified = allDocuments.every((d) => d.verificationStatus === 'verified')
      const anyRejected = allDocuments.some((d) => d.verificationStatus === 'rejected')

      if (allVerified) {
        await prisma.merchantOnboarding.update({
          where: { id: updated.onboardingId },
          data: { kycStatus: 'verified' },
        })
      } else if (anyRejected) {
        await prisma.merchantOnboarding.update({
          where: { id: updated.onboardingId },
          data: { kycStatus: 'failed' },
        })
      } else {
        await prisma.merchantOnboarding.update({
          where: { id: updated.onboardingId },
          data: { kycStatus: 'in_progress' },
        })
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'kyc_document',
        entityId: id,
        changedBy: userId || 'system',
        changeSummary: `Document ${verificationStatus}${rejectionReason ? `: ${rejectionReason}` : ''}`,
        tenantId: document.tenantId,
        beforeSnapshot: { verificationStatus: document.verificationStatus },
        afterSnapshot: { verificationStatus },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (e) {
    console.error('Super admin KYC document update error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
