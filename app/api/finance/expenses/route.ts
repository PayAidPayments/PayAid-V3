/**
 * Finance Expenses API Route
 * POST /api/finance/expenses - Create expense
 * GET /api/finance/expenses - List expenses
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, Expense } from '@/types/base-modules'
import { CreateExpenseSchema } from '@/modules/shared/finance/types'
import { formatINR } from '@/lib/currency'

/**
 * Create a new expense
 * POST /api/finance/expenses
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateExpenseSchema.parse(body)

  const expense = await prisma.expense.create({
    data: {
      tenantId: validatedData.organizationId,
      description: validatedData.description,
      amount: validatedData.amountINR,
      category: validatedData.category,
      paymentMethod: validatedData.paymentMethod,
      vendor: validatedData.vendor,
      receiptUrl: validatedData.receiptAttachment,
      isRecurring: validatedData.isRecurring,
      invoiceId: validatedData.allocationToInvoice,
      status: 'pending',
    },
  })

  const response: ApiResponse<Expense> = {
    success: true,
    statusCode: 201,
    data: {
      id: expense.id,
      organizationId: expense.tenantId,
      description: expense.description,
      amountINR: Number(expense.amount),
      category: expense.category as Expense['category'],
      paymentMethod: expense.paymentMethod as Expense['paymentMethod'],
      vendor: expense.vendor || undefined,
      receiptAttachment: expense.receiptUrl || undefined,
      isRecurring: expense.isRecurring,
      allocationToInvoice: expense.invoiceId || undefined,
      approvalStatus: expense.status as Expense['approvalStatus'],
      createdAt: expense.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * Get expenses list
 * GET /api/finance/expenses?organizationId=xxx&category=travel&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const category = searchParams.get('category')
  const approvalStatus = searchParams.get('approvalStatus')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (category) {
    where.category = category
  }

  if (approvalStatus) {
    where.status = approvalStatus
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.expense.count({ where }),
  ])

  const formattedExpenses: Expense[] = expenses.map((expense) => ({
    id: expense.id,
    organizationId: expense.tenantId,
    description: expense.description,
    amountINR: Number(expense.amount),
    category: expense.category as Expense['category'],
    paymentMethod: expense.paymentMethod as Expense['paymentMethod'],
    vendor: expense.vendor || undefined,
    receiptAttachment: expense.receiptUrl || undefined,
    isRecurring: expense.isRecurring,
    allocationToInvoice: expense.invoiceId || undefined,
    approvalStatus: expense.status as Expense['approvalStatus'],
    createdAt: expense.createdAt,
  }))

  const response: ApiResponse<{
    expenses: Expense[]
    total: number
    page: number
    pageSize: number
    totalAmount: string
  }> = {
    success: true,
    statusCode: 200,
    data: {
      expenses: formattedExpenses,
      total,
      page,
      pageSize,
      totalAmount: formatINR(formattedExpenses.reduce((sum, e) => sum + e.amountINR, 0)),
    },
    meta: {
      pagination: {
        page,
        pageSize,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
