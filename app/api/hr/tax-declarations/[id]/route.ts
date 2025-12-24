import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/tax-declarations/[id] - Get a single tax declaration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const declaration = await prisma.employeeTaxDeclaration.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        proofDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    })

    if (!declaration) {
      return NextResponse.json(
        { error: 'Tax declaration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(declaration)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get tax declaration error:', error)
    return NextResponse.json(
      { error: 'Failed to get tax declaration' },
      { status: 500 }
    )
  }
}
