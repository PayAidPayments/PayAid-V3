// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/documents/[id]/sign
 * E-sign a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { signatureData } = body

    const document = await prisma.document.findFirst({
      where: {
        id: id,
        tenantId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.requiresSignature) {
      return NextResponse.json({ error: 'Document does not require signature' }, { status: 400 })
    }

    const updated = await prisma.document.update({
      where: {
        id: id,
      },
      data: {
        status: 'SIGNED',
        signedBy: userId,
        signedAt: new Date(),
        signatureData: signatureData || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
