import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// POST /api/email/bounces/[id]/unsuppress - Remove email from suppression list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    const bounce = await prisma.emailBounces.update({
      where: {
        id,
        tenantId,
      },
      data: {
        isSuppressed: false,
        suppressedUntil: null,
      },
    })

    return NextResponse.json({ bounce })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Unsuppress email error:', error)
    return NextResponse.json(
      { error: 'Failed to unsuppress email' },
      { status: 500 }
    )
  }
}

