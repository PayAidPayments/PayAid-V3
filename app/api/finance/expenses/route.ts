/**
 * Finance Expenses API Route
 * POST /api/finance/expenses - Create expense
 * GET /api/finance/expenses - List expenses
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/types/base-modules'
import type { Expense } from '@/types/base-modules'
import { CreateExpenseSchema } from '@/modules/shared/finance/types'
import { formatINR } from '@/lib/currency'
import { z } from 'zod'

/**
 * Create a new expense
 * POST /api/finance/expenses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateExpenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        tenantId: validatedData.organizationId,
        description: validatedData.description,
        amount: validatedData.amountINR,
        category: validatedData.category,
        vendor: validatedData.vendor || null,
        receiptUrl: validatedData.receiptAttachment || null,
        isRecurring: validatedData.isRecurring,
        status: 'pending',
        date: new Date(),
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
        paymentMethod: validatedData.paymentMethod === 'payaid' ? 'other' : validatedData.paymentMethod === 'cheque' ? 'other' : validatedData.paymentMethod as Expense['paymentMethod'], // Map payaid/cheque to other since not in base type
        vendor: expense.vendor || undefined,
        receiptAttachment: expense.receiptUrl || undefined,
        isRecurring: expense.isRecurring,
        allocationToInvoice: validatedData.allocationToInvoice, // Use from request since not stored in DB
        date: expense.date,
        status: expense.status as Expense['status'],
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST expenses route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Get expenses list
 * GET /api/finance/expenses?organizationId=xxx&category=travel&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
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
      paymentMethod: 'other' as Expense['paymentMethod'], // Default since not stored in DB
      vendor: expense.vendor || undefined,
      receiptAttachment: expense.receiptUrl || undefined,
      isRecurring: expense.isRecurring,
      allocationToInvoice: undefined, // Not stored in DB
      date: expense.date,
      status: expense.status as Expense['status'],
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
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
  } catch (error) {
    console.error('Error in GET expenses route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
