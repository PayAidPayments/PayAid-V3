import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const rejectExpenseSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
})

// PUT /api/accounting/expenses/[id]/reject - Reject an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

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
        { error: `Expense cannot be rejected. Current status: ${expense.status}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = rejectExpenseSchema.parse(body)

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: expense.id },
      data: {
        status: 'rejected',
        approverId: userId,
        rejectedAt: new Date(),
        rejectionReason: validated.rejectionReason,
      },
    })

    // Get user details for approver name
    const userDetails = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    // Create approval record
    await prisma.expenseApproval.create({
      data: {
        expenseId: expense.id,
        approverId: userId,
        approverName: userDetails?.name || 'Unknown',
        status: 'rejected',
        comments: validated.rejectionReason,
        tenantId: tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense rejected',
      expense: {
        id: updatedExpense.id,
        status: updatedExpense.status,
        rejectedAt: updatedExpense.rejectedAt?.toISOString(),
        rejectionReason: updatedExpense.rejectionReason,
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

    console.error('Reject expense error:', error)
    return NextResponse.json(
      { error: 'Failed to reject expense' },
      { status: 500 }
    )
  }
}

