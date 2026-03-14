import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/users - Get all users in the tenant for assignment
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const users = await prisma.user.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      users,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error?.message },
      { status: 500 }
    )
  }
}

