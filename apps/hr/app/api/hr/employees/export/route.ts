import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/employees/export?format=csv - Export employees for Excel/Print
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const format = request.nextUrl.searchParams.get('format') || 'csv'

    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    })

    if (format === 'csv') {
      const header = 'Employee Code,First Name,Last Name,Email,Department,Designation,Status,Joining Date,CTC\n'
      const rows = employees.map(
        (e) =>
          `${e.employeeCode},${e.firstName},${e.lastName},${e.officialEmail || ''},${e.department?.name || ''},${e.designation?.name || ''},${e.status},${e.joiningDate ? new Date(e.joiningDate).toISOString().slice(0, 10) : ''},${e.ctcAnnualInr ?? ''}`
      )
      const csv = header + rows.join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    return NextResponse.json({ employees })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
