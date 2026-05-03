/**
 * Recurring Expenses API Route
 * GET /api/expenses/recurring - List recurring expenses
 * POST /api/expenses/recurring - Create recurring expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { calculateNextGeneration, type RecurringExpenseConfig } from '@/lib/automation/recurring-expenses'

const createRecurringExpenseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
  category: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  projectId: z.string().optional(),
  customerId: z.string().optional(),
  billable: z.boolean().default(false),
  vendorId: z.string().optional(),
  autoApprove: z.boolean().default(false),
})

// GET /api/expenses/recurring - List recurring expenses
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const recurringExpenses = await prisma.expense.findMany({
      where: {
        tenantId,
        isRecurring: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: recurringExpenses,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list recurring expenses', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/expenses/recurring - Create recurring expense
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const validated = createRecurringExpenseSchema.parse(body)

    const startDate = new Date(validated.startDate)
    const nextGeneration = calculateNextGeneration(
      startDate,
      validated.frequency,
      validated.dayOfMonth,
      validated.dayOfWeek
    )

    const recurringConfig: RecurringExpenseConfig = {
      name: validated.name,
      description: validated.description,
      amount: validated.amount,
      category: validated.category,
      frequency: validated.frequency,
      startDate,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      dayOfMonth: validated.dayOfMonth,
      dayOfWeek: validated.dayOfWeek,
      projectId: validated.projectId,
      customerId: validated.customerId,
      billable: validated.billable,
      vendorId: validated.vendorId,
      autoApprove: validated.autoApprove,
      tenantId,
      createdById: userId,
    }

    // Create expense with recurring flag
    const expense = await prisma.expense.create({
      data: {
        tenantId,
        description: validated.description || validated.name,
        amount: validated.amount,
        category: validated.category,
        vendor: validated.vendorId,
        date: startDate,
        status: 'pending',
        isRecurring: true,
        recurringFrequency: validated.frequency,
        nextRecurrenceDate: nextGeneration,
        employeeId: userId,
        metadata: {
          recurringConfig: recurringConfig as any,
          lastGenerated: null,
          nextGeneration: nextGeneration.toISOString(),
          totalGenerated: 0,
        } as any,
      },
    })

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Recurring expense created',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create recurring expense', message: error.message },
      { status: 500 }
    )
  }
}
