/**
 * Phase 2: Resolve current user to employee for ESS (Employee Self-Service) / Mobile APIs
 */
import { prisma } from '@/lib/db/prisma'

export async function getEmployeeForUser(tenantId: string, userId: string) {
  return prisma.employee.findFirst({
    where: { tenantId, userId },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      officialEmail: true,
      departmentId: true,
      designationId: true,
      managerId: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  })
}
