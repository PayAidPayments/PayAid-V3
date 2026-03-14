import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/contractors
 * List contractors with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = { tenantId }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contractorCode: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
        },
      }).catch(() => []),
      prisma.contractor.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      contractors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/contractors
 * Create a new contractor
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      startDate,
      endDate,
      monthlyRate,
      tdsApplicable,
      tdsRate,
      panNumber,
      departmentId,
      project,
      address,
      city,
      state,
      pincode,
    } = body

    // Generate contractor code
    const count = await prisma.contractor.count({ where: { tenantId } }).catch(() => 0)
    const contractorCode = `CNT${String(count + 1).padStart(4, '0')}`

    const contractor = await prisma.contractor.create({
      data: {
        tenantId,
        contractorCode,
        firstName,
        lastName,
        email,
        phone,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        monthlyRate,
        tdsApplicable: tdsApplicable ?? true,
        tdsRate: tdsApplicable ? (tdsRate || 10) : null,
        panNumber: tdsApplicable ? panNumber : null,
        departmentId: departmentId || null,
        project: project || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: 'ACTIVE',
        createdBy: userId,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(contractor, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
