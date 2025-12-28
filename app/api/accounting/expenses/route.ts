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

