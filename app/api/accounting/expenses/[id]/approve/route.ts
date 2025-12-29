import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError, authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const approveExpenseSchema = z.object({
  comments: z.string().optional(),
})

// PUT /api/accounting/expenses/[id]/approve - Approve an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')
    const user = await authenticateRequest(request)

    // Get expense
    const expense = await prisma.expense.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.status !== 'pending') {
      return NextResponse.json(
        { error: `Expense cannot be approved. Current status: ${expense.status}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = approveExpenseSchema.parse(body)

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: expense.id },
      data: {
        status: 'approved',
        approverId: userId,
        approvedAt: new Date(),
      },
    })

    // Create approval record
    await prisma.expenseApproval.create({
      data: {
        expenseId: expense.id,
        approverId: userId,
        approverName: user?.name || 'Unknown',
        status: 'approved',
        comments: validated.comments,
        tenantId: tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense approved',
      expense: {
        id: updatedExpense.id,
        status: updatedExpense.status,
        approvedAt: updatedExpense.approvedAt?.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Approve expense error:', error)
    return NextResponse.json(
      { error: 'Failed to approve expense' },
      { status: 500 }
    )
  }
}

