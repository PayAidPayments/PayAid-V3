import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/email/bounces - List email bounces
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const bounceType = request.nextUrl.searchParams.get('bounceType')
    const isSuppressed = request.nextUrl.searchParams.get('isSuppressed')
    const email = request.nextUrl.searchParams.get('email')

    const where: any = { tenantId }
    if (bounceType) where.bounceType = bounceType
    if (isSuppressed !== null) where.isSuppressed = isSuppressed === 'true'
    if (email) where.emailAddress = { contains: email, mode: 'insensitive' }

    const bounces = await prisma.emailBounces.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ bounces })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get email bounces error:', error)
    return NextResponse.json(
      { error: 'Failed to get email bounces' },
      { status: 500 }
    )
  }
}

