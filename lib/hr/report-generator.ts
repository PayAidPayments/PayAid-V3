import { prisma } from '@/lib/db/prisma'

export interface GenerateReportResult {
  data: any[]
  summary: any
  reportName: string
}

export async function generateReportData(
  reportId: string,
  tenantId: string
): Promise<GenerateReportResult | null> {
  const report = await prisma.customReport.findFirst({
    where: { id: reportId, tenantId },
  })
  if (!report) return null

  const config = {
    dataSource: report.reportType,
    filters: (report.filters as Record<string, unknown>) || {},
    columns: (report.columns as string[]) || [],
    groupBy: (report.grouping as string[] | undefined),
    sortBy: (report.sorting as Array<{ field: string; direction: 'ASC' | 'DESC' }> | undefined),
  }

  let data: any[] = []
  let summary: any = {}

  switch (config.dataSource) {
    case 'EMPLOYEES': {
      const employeeWhere: any = { tenantId }
      if (config.filters?.departmentId) employeeWhere.departmentId = config.filters.departmentId
      if (config.filters?.status) employeeWhere.status = config.filters.status
      const cols = config.columns.length ? config.columns : ['id', 'employeeCode', 'firstName', 'lastName', 'status', 'departmentId']
      const select = cols.reduce((acc: any, col: string) => {
        acc[col] = true
        return acc
      }, {})
      const employees = await prisma.employee.findMany({
        where: employeeWhere,
        select,
      })
      data = employees.map((emp: any) => {
        const row: any = {}
        cols.forEach((col: string) => {
          row[col] = emp[col] ?? null
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
    }

    case 'PAYROLL': {
      const payrollWhere: any = { tenantId }
      if (config.filters?.cycleId) payrollWhere.cycleId = config.filters.cycleId
      if (config.filters?.month != null && config.filters?.year != null) {
        const cycle = await prisma.payrollCycle.findFirst({
          where: { tenantId, month: Number(config.filters.month), year: Number(config.filters.year) },
        })
        if (cycle) payrollWhere.cycleId = cycle.id
      }
      const payrollRuns = await prisma.payrollRun.findMany({
        where: payrollWhere,
        include: { employee: true, cycle: true },
      })
      const runColumns = ['grossEarningsInr', 'grossDeductionsInr', 'tdsInr', 'pfEmployeeInr', 'esiEmployeeInr', 'ptInr', 'lopDays', 'lopAmountInr', 'netPayInr', 'daysPaid', 'payoutStatus']
      const allowedCols = config.columns.filter((c: string) => runColumns.includes(c) || c.startsWith('employee.') || c.startsWith('cycle.'))
      data = payrollRuns.map((run: any) => {
        const row: any = {}
        allowedCols.forEach((col: string) => {
          if (col.startsWith('employee.')) {
            row[col] = run.employee?.[col.replace('employee.', '')] ?? null
          } else if (col.startsWith('cycle.')) {
            row[col] = run.cycle?.[col.replace('cycle.', '')] ?? null
          } else {
            row[col] = run[col] != null ? Number(run[col]) : null
          }
        })
        return row
      })
      summary = {
        totalRuns: payrollRuns.length,
        totalAmount: payrollRuns.reduce((sum: number, run: any) => sum + Number(run.netPayInr || 0), 0),
      }
      break
    }

    case 'ATTENDANCE': {
      const attendanceWhere: any = { tenantId }
      if (config.filters?.dateFrom) attendanceWhere.date = { gte: new Date(config.filters.dateFrom as string) }
      if (config.filters?.dateTo) attendanceWhere.date = { ...(attendanceWhere.date as object), lte: new Date(config.filters.dateTo as string) }
      const select = config.columns.reduce((acc: any, col: string) => {
        acc[col] = true
        return acc
      }, {})
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: attendanceWhere,
        select: Object.keys(select).length ? select : undefined,
      })
      data = attendanceRecords as any[]
      summary = {
        totalRecords: attendanceRecords.length,
        presentCount: attendanceRecords.filter((r: any) => r.status === 'PRESENT').length,
        absentCount: attendanceRecords.filter((r: any) => r.status === 'ABSENT').length,
      }
      break
    }

    case 'LEAVES': {
      const leaveWhere: any = { tenantId }
      if (config.filters?.status) leaveWhere.status = config.filters.status
      const select = config.columns.reduce((acc: any, col: string) => {
        acc[col] = true
        return acc
      }, {})
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: leaveWhere,
        select: Object.keys(select).length ? select : undefined,
      })
      data = leaveRequests as any[]
      summary = {
        total: leaveRequests.length,
        pending: leaveRequests.filter((r: any) => r.status === 'PENDING').length,
        approved: leaveRequests.filter((r: any) => r.status === 'APPROVED').length,
      }
      break
    }

    case 'REIMBURSEMENTS': {
      const reimbWhere: any = { tenantId }
      if (config.filters?.status) reimbWhere.status = config.filters.status
      const expenses = await prisma.expense.findMany({
        where: reimbWhere,
        include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
      })
      data = expenses.map((r: any) => ({
        id: r.id,
        employeeId: r.employeeId,
        amount: r.amount,
        status: r.status,
        date: r.date,
        description: r.description,
        category: r.category,
        employeeCode: r.employee?.employeeCode,
        employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : null,
      }))
      summary = {
        total: expenses.length,
        totalAmount: expenses.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0),
        pending: expenses.filter((r: any) => (r.status || '').toLowerCase() === 'pending').length,
      }
      break
    }

    default:
      return null
  }

  if (config.groupBy && config.groupBy.length > 0) {
    const grouped: Record<string, any[]> = {}
    data.forEach((row) => {
      const key = config.groupBy!.map((field: string) => row[field]).join('|')
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(row)
    })
    data = Object.values(grouped).map((group) => ({
      group: group[0][config.groupBy![0]],
      count: group.length,
      data: group,
    }))
  }

  if (config.sortBy && config.sortBy.length > 0) {
    data.sort((a, b) => {
      for (const sort of config.sortBy!) {
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

  return { data, summary, reportName: report.name }
}
