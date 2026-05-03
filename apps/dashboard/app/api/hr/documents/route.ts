import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { DOCUMENT_CHECKLIST_TYPES } from './document-checklist-types'

/**
 * GET /api/hr/documents
 * List employee documents for the tenant (document vault).
 * Query: employeeId (optional), limit (default 100).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 200)

    const where: { tenantId: string; employeeId?: string } = { tenantId }
    if (employeeId) where.employeeId = employeeId

    const documents = await prisma.employeeDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    // Checklist summary: for each employee that has docs (or all active if no filter), compute expected vs present
    const employeeIds = employeeId
      ? [employeeId]
      : [...new Set(documents.map((d) => d.employeeId))]
    const allEmployeeIds =
      employeeIds.length > 0
        ? employeeIds
        : (
            await prisma.employee.findMany({
              where: { tenantId, status: 'ACTIVE' },
              select: { id: true },
              take: 500,
            })
          ).map((e) => e.id)

    const docsByEmployee = documents.reduce(
      (acc, d) => {
        if (!acc[d.employeeId]) acc[d.employeeId] = []
        acc[d.employeeId].push(d.documentType)
        return acc
      },
      {} as Record<string, string[]>
    )

    const checklist = allEmployeeIds.slice(0, 100).map((eid) => {
      const present = docsByEmployee[eid] || []
      const expected = [...DOCUMENT_CHECKLIST_TYPES]
      const missing = expected.filter((t) => !present.includes(t))
      return {
        employeeId: eid,
        presentCount: present.length,
        expectedCount: expected.length,
        missingTypes: missing,
      }
    })

    const employees = await prisma.employee.findMany({
      where: { id: { in: allEmployeeIds.slice(0, 100) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
      },
    })
    const empMap = Object.fromEntries(employees.map((e) => [e.id, e]))

    const checklistWithNames = checklist.map((c) => ({
      ...c,
      employee: empMap[c.employeeId],
    }))

    return NextResponse.json({
      documents: documents.map((d) => ({
        id: d.id,
        employeeId: d.employeeId,
        documentType: d.documentType,
        fileUrl: d.fileUrl,
        generatedAt: d.generatedAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
        employee: d.employee,
      })),
      checklist: checklistWithNames,
      expectedTypes: DOCUMENT_CHECKLIST_TYPES,
    })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}
