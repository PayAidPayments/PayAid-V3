import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const verificationStatus = searchParams.get('verificationStatus') || undefined
    const documentType = searchParams.get('documentType') || undefined
    const tenantId = searchParams.get('tenantId') || undefined

    const documents = await prisma.kYCDocument.findMany({
      where: {
        ...(verificationStatus && { verificationStatus }),
        ...(documentType && { documentType }),
        ...(tenantId && { tenantId }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const data = documents.map((doc) => ({
      id: doc.id,
      tenantId: doc.tenantId,
      tenant: doc.tenant,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      ocrData: doc.ocrData,
      verificationStatus: doc.verificationStatus,
      verifiedById: doc.verifiedBy,
      verifiedAt: doc.verifiedAt?.toISOString(),
      notes: doc.notes,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt.toISOString(),
      onboarding: doc.onboarding,
    }))

    const stats = {
      total: documents.length,
      pending: documents.filter((d) => d.verificationStatus === 'pending').length,
      verified: documents.filter((d) => d.verificationStatus === 'verified').length,
      rejected: documents.filter((d) => d.verificationStatus === 'rejected').length,
      needsReview: documents.filter((d) => d.verificationStatus === 'needs_review').length,
    }

    return NextResponse.json({ data, stats })
  } catch (e) {
    console.error('Super admin KYC documents list error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
