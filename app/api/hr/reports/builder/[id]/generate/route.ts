import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/reports/builder/[id]/generate
 * Generate report data based on saved configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const report = await prisma.customReport.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const config = {
      dataSource: report.reportType,
      filters: report.filters as any,
      columns: report.columns as string[],
      groupBy: report.grouping as string[] | undefined,
      sortBy: report.sorting as Array<{ field: string; direction: 'ASC' | 'DESC' }> | undefined,
    }
    let data: any[] = []
    let summary: any = {}

    // Generate data based on dataSource
    switch (config.dataSource) {
      case 'EMPLOYEES':
        const employeeWhere: any = { tenantId }
        if (config.filters?.departmentId) employeeWhere.departmentId = config.filters.departmentId
        if (config.filters?.status) employeeWhere.status = config.filters.status

        const employees = await prisma.employee.findMany({
          where: employeeWhere,
          select: config.columns.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}),
        })

        data = employees.map((emp: any) => {
          const row: any = {}
          config.columns.forEach((col: string) => {
            row[col] = emp[col] || null
          })
          return row
        })

        summary = {
          total: employees.length,
          byDepartment: await prisma.employee.groupBy({
            by: ['departmentId'],
            where: employeeWhere,
            _count: true,
          }),
        }
        break

      case 'PAYROLL':
        const payrollWhere: any = { tenantId }
        if (config.filters?.payrollMonth) payrollWhere.payrollMonth = config.filters.payrollMonth

        const payrollRuns = await prisma.payrollRun.findMany({
          where: payrollWhere,
          include: {
            payslips: {
              select: config.columns.reduce((acc: any, col: string) => {
                acc[col] = true
                return acc
              }, {}),
            },
          },
        })

        data = payrollRuns.flatMap((run) =>
          run.payslips.map((payslip: any) => {
            const row: any = {}
            config.columns.forEach((col: string) => {
              row[col] = payslip[col] || null
            })
            return row
          })
        )

        summary = {
          totalRuns: payrollRuns.length,
          totalAmount: payrollRuns.reduce((sum, run) => sum + (run.totalAmount || 0), 0),
        }
        break

      case 'ATTENDANCE':
        const attendanceWhere: any = { tenantId }
        if (config.filters?.dateFrom) attendanceWhere.date = { gte: new Date(config.filters.dateFrom) }
        if (config.filters?.dateTo) attendanceWhere.date = { ...attendanceWhere.date, lte: new Date(config.filters.dateTo) }

        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: attendanceWhere,
          select: config.columns.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}),
        })

        data = attendanceRecords

        summary = {
          totalRecords: attendanceRecords.length,
          presentCount: attendanceRecords.filter((r: any) => r.status === 'PRESENT').length,
          absentCount: attendanceRecords.filter((r: any) => r.status === 'ABSENT').length,
        }
        break

      case 'LEAVES':
        const leaveWhere: any = { tenantId }
        if (config.filters?.status) leaveWhere.status = config.filters.status

        const leaveRequests = await prisma.leaveRequest.findMany({
          where: leaveWhere,
          select: config.columns.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}),
        })

        data = leaveRequests

        summary = {
          total: leaveRequests.length,
          pending: leaveRequests.filter((r: any) => r.status === 'PENDING').length,
          approved: leaveRequests.filter((r: any) => r.status === 'APPROVED').length,
        }
        break

      case 'REIMBURSEMENTS':
        const reimbWhere: any = { tenantId }
        if (config.filters?.status) reimbWhere.status = config.filters.status

        const reimbursements = await prisma.reimbursement.findMany({
          where: reimbWhere,
          select: config.columns.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}),
        })

        data = reimbursements

        summary = {
          total: reimbursements.length,
          totalAmount: reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0),
          pending: reimbursements.filter((r: any) => r.status === 'PENDING').length,
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported data source' },
          { status: 400 }
        )
    }

    // Apply calculations if specified
    if (config.calculations) {
      data = data.map((row) => {
        const calculatedRow = { ...row }
        config.calculations.forEach((calc: any) => {
          // Simple formula evaluation (would need a proper formula parser in production)
          try {
            // Placeholder - would use a formula parser
            calculatedRow[calc.field] = `Calculated: ${calc.formula}`
          } catch (e) {
            calculatedRow[calc.field] = null
          }
        })
        return calculatedRow
      })
    }

    // Apply grouping if specified
    if (config.groupBy && config.groupBy.length > 0) {
      const grouped: Record<string, any[]> = {}
      data.forEach((row) => {
        const key = config.groupBy.map((field: string) => row[field]).join('|')
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      })
      data = Object.values(grouped).map((group) => ({
        group: group[0][config.groupBy[0]],
        count: group.length,
        data: group,
      }))
    }

    // Apply sorting if specified
    if (config.sortBy && config.sortBy.length > 0) {
      data.sort((a, b) => {
        for (const sort of config.sortBy) {
          const aVal = a[sort.field]
          const bVal = b[sort.field]
          if (aVal !== bVal) {
            const comparison = aVal > bVal ? 1 : -1
            return sort.direction === 'ASC' ? comparison : -comparison
          }
        }
        return 0
      })
    }

    return NextResponse.json({
      reportId: params.id,
      reportName: report.name,
      data,
      summary,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
