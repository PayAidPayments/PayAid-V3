/**
 * Recurring Expenses Automation Service
 * Auto-generates expenses at specified intervals
 * Better than Perfex CRM: More flexible scheduling, project/customer linking
 */

import { prisma } from '@/lib/db/prisma'

export interface RecurringExpenseConfig {
  name: string
  description?: string
  amount: number
  category: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate?: Date // Optional end date
  dayOfMonth?: number // For monthly: day of month (1-31)
  dayOfWeek?: number // For weekly: day of week (0-6, Sunday = 0)
  projectId?: string
  customerId?: string
  billable: boolean // Can be billed to customer
  vendorId?: string
  autoApprove: boolean // Auto-approve generated expenses
  tenantId: string
  createdById: string
}

export interface RecurringExpense {
  id: string
  config: RecurringExpenseConfig
  lastGenerated: Date | null
  nextGeneration: Date
  totalGenerated: number
  isActive: boolean
}

/**
 * Calculate next generation date based on frequency
 */
export function calculateNextGeneration(
  lastDate: Date,
  frequency: RecurringExpenseConfig['frequency'],
  dayOfMonth?: number,
  dayOfWeek?: number
): Date {
  const next = new Date(lastDate)

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      if (dayOfWeek !== undefined) {
        const daysUntil = (dayOfWeek - next.getDay() + 7) % 7 || 7
        next.setDate(next.getDate() + daysUntil)
      } else {
        next.setDate(next.getDate() + 7)
      }
      break
    case 'monthly':
      if (dayOfMonth !== undefined) {
        next.setMonth(next.getMonth() + 1)
        next.setDate(dayOfMonth)
      } else {
        next.setMonth(next.getMonth() + 1)
      }
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth)
      }
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth)
      }
      break
  }

  return next
}

/**
 * Generate expense from recurring config
 */
export async function generateRecurringExpense(
  recurringExpenseId: string,
  tenantId: string
): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  try {
    // Get recurring expense (using isRecurring flag)
    const expense = await prisma.expense.findFirst({
      where: {
        id: recurringExpenseId,
        tenantId,
        isRecurring: true,
      },
    })

    if (!expense) {
      return { success: false, error: 'Recurring expense not found' }
    }

    // Get config from metadata or use expense fields
    const metadata = (expense.metadata as any) || {}
    const config: RecurringExpenseConfig = metadata.recurringConfig || {
      name: expense.description,
      amount: Number(expense.amount),
      category: expense.category,
      frequency: (expense.recurringFrequency || 'monthly') as any,
      startDate: expense.date,
      tenantId,
      createdById: expense.employeeId || '',
      billable: false,
    }

    // Check if we should generate (not past end date, next generation date reached)
    const now = new Date()
    const lastGenerated = (expense.metadata as any)?.lastGenerated
      ? new Date((expense.metadata as any).lastGenerated)
      : config.startDate

    const nextGeneration = calculateNextGeneration(
      lastGenerated,
      config.frequency,
      config.dayOfMonth,
      config.dayOfWeek
    )

    if (now < nextGeneration) {
      return { success: false, error: 'Not yet time to generate expense' }
    }

    if (config.endDate && now > config.endDate) {
      return { success: false, error: 'Recurring expense has ended' }
    }

    // Create new expense
    const newExpense = await prisma.expense.create({
      data: {
        tenantId: config.tenantId,
        description: config.description || `Recurring: ${config.name}`,
        amount: config.amount,
        category: config.category,
        vendor: config.vendorId || expense.vendor,
        date: now,
        status: config.autoApprove ? 'approved' : 'pending',
        employeeId: config.createdById,
        isRecurring: false, // Generated expense is not recurring
        metadata: {
          recurringSourceId: recurringExpenseId,
          generatedAt: now.toISOString(),
        },
      },
    })

    // Update recurring expense with next generation date
    const totalGenerated = ((expense.metadata as any)?.totalGenerated || 0) + 1
    await prisma.expense.update({
      where: { id: recurringExpenseId },
      data: {
        nextRecurrenceDate: nextGeneration,
        metadata: {
          ...metadata,
          lastGenerated: now.toISOString(),
          nextGeneration: nextGeneration.toISOString(),
          totalGenerated,
        },
      },
    })

    return { success: true, expenseId: newExpense.id }
  } catch (error: any) {
    console.error('Generate recurring expense error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Process all recurring expenses and generate new ones
 */
export async function processRecurringExpenses(
  tenantId: string
): Promise<{
  processed: number
  generated: number
  errors: number
}> {
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      tenantId,
      isRecurring: true,
    },
  })

  let generated = 0
  let errors = 0

  for (const expense of recurringExpenses) {
    const result = await generateRecurringExpense(expense.id, tenantId)
    if (result.success) {
      generated++
    } else {
      errors++
    }
  }

  return {
    processed: recurringExpenses.length,
    generated,
    errors,
  }
}
