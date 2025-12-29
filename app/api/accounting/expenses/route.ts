import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  vendor: z.string().optional(),
  date: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
  gstAmount: z.number().optional(),
  hsnCode: z.string().optional(),
  employeeId: z.string().optional(), // For employee reimbursement
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
})

// GET /api/accounting/expenses - List all expenses
export async function GET(request: NextRequest) {
  try {
    // Check Accounting module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      tenantId: tenantId,
    }

    if (category) {
      where.category = category
    }

    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    const employeeId = searchParams.get('employeeId')
    if (employeeId) {
      where.employeeId = employeeId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.expense.count({ where })

    // Get expenses with pagination
    const expenses = await prisma.expense.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        approvals: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest approval
        },
      },
    })

    return NextResponse.json({
      expenses: expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        category: expense.category,
        vendor: expense.vendor,
        date: expense.date.toISOString(),
        receiptUrl: expense.receiptUrl,
        gstAmount: expense.gstAmount ? Number(expense.gstAmount) : null,
        hsnCode: expense.hsnCode,
        employeeId: expense.employeeId,
        employee: expense.employee ? {
          id: expense.employee.id,
          employeeCode: expense.employee.employeeCode,
          name: `${expense.employee.firstName} ${expense.employee.lastName}`,
        } : null,
        status: expense.status,
        approverId: expense.approverId,
        approvedAt: expense.approvedAt?.toISOString(),
        rejectedAt: expense.rejectedAt?.toISOString(),
        rejectionReason: expense.rejectionReason,
        reimbursedAt: expense.reimbursedAt?.toISOString(),
        isRecurring: expense.isRecurring,
        recurringFrequency: expense.recurringFrequency,
        latestApproval: expense.approvals[0] ? {
          status: expense.approvals[0].status,
          approverName: expense.approvals[0].approverName,
          comments: expense.approvals[0].comments,
          createdAt: expense.approvals[0].createdAt.toISOString(),
        } : null,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: 'Failed to get expenses' },
      { status: 500 }
    )
  }
}

// POST /api/accounting/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    // Check Accounting module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const validated = createExpenseSchema.parse(body)

    // Calculate next recurrence date if recurring
    let nextRecurrenceDate: Date | null = null
    if (validated.isRecurring && validated.recurringFrequency) {
      const baseDate = validated.date ? new Date(validated.date) : new Date()
      nextRecurrenceDate = new Date(baseDate)
      
      switch (validated.recurringFrequency) {
        case 'monthly':
          nextRecurrenceDate.setMonth(nextRecurrenceDate.getMonth() + 1)
          break
        case 'quarterly':
          nextRecurrenceDate.setMonth(nextRecurrenceDate.getMonth() + 3)
          break
        case 'yearly':
          nextRecurrenceDate.setFullYear(nextRecurrenceDate.getFullYear() + 1)
          break
      }
    }

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        tenantId: tenantId,
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        vendor: validated.vendor,
        date: validated.date ? new Date(validated.date) : new Date(),
        receiptUrl: validated.receiptUrl,
        gstAmount: validated.gstAmount,
        hsnCode: validated.hsnCode,
        employeeId: validated.employeeId,
        isRecurring: validated.isRecurring || false,
        recurringFrequency: validated.recurringFrequency,
        nextRecurrenceDate: nextRecurrenceDate,
        status: 'pending', // Default to pending for approval
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense recorded',
      expense: {
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        category: expense.category,
        vendor: expense.vendor,
        date: expense.date.toISOString(),
        receiptUrl: expense.receiptUrl,
        gstAmount: expense.gstAmount ? Number(expense.gstAmount) : null,
        hsnCode: expense.hsnCode,
        employeeId: expense.employeeId,
        status: expense.status,
        isRecurring: expense.isRecurring,
        recurringFrequency: expense.recurringFrequency,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

