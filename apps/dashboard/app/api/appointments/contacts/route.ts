import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'

/**
 * GET /api/appointments/contacts
 * Get CRM contacts for appointment booking (integrated with CRM module)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      tenantId,
      type: {
        in: ['customer', 'lead', 'contact'],
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        type: true,
        status: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    return NextResponse.json({ contacts })
  } catch (error: any) {
    console.error('Get contacts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

