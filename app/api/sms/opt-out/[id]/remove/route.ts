import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// POST /api/sms/opt-out/[id]/remove - Remove phone from opt-out list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    const optOut = await prisma.sMSOptOut.update({
      where: {
        id,
        tenantId,
      },
      data: {
        isSuppressed: false,
      },
    })

    return NextResponse.json({ optOut })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Remove opt-out error:', error)
    return NextResponse.json(
      { error: 'Failed to remove opt-out' },
      { status: 500 }
    )
  }
}

