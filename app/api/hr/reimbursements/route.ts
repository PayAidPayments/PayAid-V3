import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/reimbursements
 * List reimbursements with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const employeeId = searchParams.get('employeeId') || ''

    const where: any = { tenantId }
    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }
    if (employeeId) {
      where.employeeId = employeeId
    } else {
      // If no employeeId filter, show only current user's reimbursements (unless admin)
      // For now, show all - can be filtered by role later
    }

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }).catch(() => []),
      prisma.reimbursement.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      reimbursements,
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
 * POST /api/hr/reimbursements
 * Create a new reimbursement request
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    // Get employee ID from user
    const employee = await prisma.employee.findFirst({
      where: { userId, tenantId },
    }).catch(() => null)

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 400 })
    }

    const formData = await request.formData()
    const expenseDate = formData.get('expenseDate') as string
    const category = formData.get('category') as string
    const amount = parseFloat(formData.get('amount') as string)
    const description = formData.get('description') as string
    const vendor = formData.get('vendor') as string || null
    const paymentMethod = formData.get('paymentMethod') as string || 'CASH'

    // Handle file uploads (simplified - in production, upload to S3/storage)
    const attachments: string[] = []
    // Process attachments if needed

    const reimbursement = await prisma.reimbursement.create({
      data: {
        tenantId,
        employeeId: employee.id,
        expenseDate: new Date(expenseDate),
        category,
        amount,
        description,
        vendor,
        paymentMethod,
        attachments,
        status: 'PENDING',
        createdBy: userId,
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

    return NextResponse.json(reimbursement, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
