import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/accounting/expenses/reports/summary - Get expense summary report
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const employeeId = searchParams.get('employeeId')

    // Build where clause
    const where: any = {
      tenantId: tenantId,
      status: { in: ['approved', 'reimbursed'] }, // Only count approved/reimbursed expenses
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

    if (category) {
      where.category = category
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Calculate summary by category
    const categorySummary: Record<string, { count: number; total: number; gstTotal: number }> = {}
    let grandTotal = 0
    let grandGstTotal = 0

    expenses.forEach((expense) => {
      const amount = Number(expense.amount)
      const gstAmount = expense.gstAmount ? Number(expense.gstAmount) : 0
      
      if (!categorySummary[expense.category]) {
        categorySummary[expense.category] = { count: 0, total: 0, gstTotal: 0 }
      }
      
      categorySummary[expense.category].count++
      categorySummary[expense.category].total += amount
      categorySummary[expense.category].gstTotal += gstAmount
      
      grandTotal += amount
      grandGstTotal += gstAmount
    })

    // Calculate summary by employee (if employeeId filter not applied)
    const employeeSummary: Record<string, { name: string; count: number; total: number }> = {}
    
    if (!employeeId) {
      expenses.forEach((expense) => {
        if (expense.employee) {
          const key = expense.employee.id
          const name = `${expense.employee.firstName} ${expense.employee.lastName}`
          const amount = Number(expense.amount)
          
          if (!employeeSummary[key]) {
            employeeSummary[key] = { name, count: 0, total: 0 }
          }
          
          employeeSummary[key].count++
          employeeSummary[key].total += amount
        }
      })
    }

    return NextResponse.json({
      summary: {
        totalExpenses: expenses.length,
        grandTotal,
        grandGstTotal,
        grandTotalWithGst: grandTotal + grandGstTotal,
      },
      byCategory: Object.entries(categorySummary).map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
        gstTotal: data.gstTotal,
        totalWithGst: data.total + data.gstTotal,
      })),
      byEmployee: Object.entries(employeeSummary).map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        count: data.count,
        total: data.total,
      })),
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get expense summary error:', error)
    return NextResponse.json(
      { error: 'Failed to get expense summary' },
      { status: 500 }
    )
  }
}

