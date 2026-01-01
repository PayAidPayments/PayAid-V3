/**
 * Restaurant-Specific Staff Scheduling
 */

import { prisma } from '@/lib/db/prisma'

export type RestaurantShiftType = 'breakfast' | 'lunch' | 'dinner' | 'night'
export type RestaurantRole = 'waiter' | 'chef' | 'manager' | 'cashier' | 'host' | 'bartender'

export interface RestaurantShift {
  id: string
  employeeId: string
  shiftType: RestaurantShiftType
  role: RestaurantRole
  startTime: Date
  endTime: Date
  tableAssignments?: string[] // Table IDs assigned to waiter
  kitchenSection?: string // For chefs
}

export interface ShiftRequirement {
  shiftType: RestaurantShiftType
  role: RestaurantRole
  requiredCount: number
  date: Date
}

/**
 * Create restaurant-specific shift
 */
export async function createRestaurantShift(
  tenantId: string,
  employeeId: string,
  shiftType: RestaurantShiftType,
  role: RestaurantRole,
  date: Date,
  tableAssignments?: string[],
  kitchenSection?: string
): Promise<RestaurantShift> {
  // Determine shift times based on type
  const shiftTimes = getShiftTimes(shiftType, date)

  // Create shift assignment (using existing HR shift system)
  const shift = await prisma.shift.findFirst({
    where: {
      tenantId,
      name: `${shiftType}-${role}`,
    },
  })

  // Create employee shift assignment
  // Note: This would need an EmployeeShift model or extend existing attendance system
  // For now, we'll create a record in a JSON field or extend the schema

  return {
    id: '', // Would be from created record
    employeeId,
    shiftType,
    role,
    startTime: shiftTimes.start,
    endTime: shiftTimes.end,
    tableAssignments,
    kitchenSection,
  }
}

/**
 * Get shift times based on type
 */
function getShiftTimes(shiftType: RestaurantShiftType, date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  const end = new Date(date)

  switch (shiftType) {
    case 'breakfast':
      start.setHours(6, 0, 0, 0)
      end.setHours(12, 0, 0, 0)
      break
    case 'lunch':
      start.setHours(11, 0, 0, 0)
      end.setHours(16, 0, 0, 0)
      break
    case 'dinner':
      start.setHours(17, 0, 0, 0)
      end.setHours(23, 0, 0, 0)
      break
    case 'night':
      start.setHours(22, 0, 0, 0)
      end.setHours(6, 0, 0, 0)
      end.setDate(end.getDate() + 1) // Next day
      break
  }

  return { start, end }
}

/**
 * Optimize staff scheduling for peak hours
 */
export async function optimizeRestaurantScheduling(
  tenantId: string,
  date: Date,
  requirements: ShiftRequirement[]
): Promise<RestaurantShift[]> {
  // Get available employees
  const employees = await prisma.employee.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  const shifts: RestaurantShift[] = []

  // Simple optimization: Assign employees based on role and availability
  for (const req of requirements) {
    const availableEmployees = employees.filter((emp) => {
      // Check if employee has the required role (would need role field in Employee model)
      // For now, assume all employees can be assigned
      return true
    })

    // Assign required number of employees
    for (let i = 0; i < Math.min(req.requiredCount, availableEmployees.length); i++) {
      const employee = availableEmployees[i]
      const shiftTimes = getShiftTimes(req.shiftType, date)

      shifts.push({
        id: `temp-${Date.now()}-${i}`,
        employeeId: employee.id,
        shiftType: req.shiftType,
        role: req.role,
        startTime: shiftTimes.start,
        endTime: shiftTimes.end,
      })
    }
  }

  return shifts
}

/**
 * Assign tables to waiters
 */
export async function assignTablesToWaiter(
  tenantId: string,
  waiterId: string,
  tableIds: string[]
): Promise<void> {
  // Update restaurant orders to assign waiter
  await prisma.restaurantOrder.updateMany({
    where: {
      tenantId,
      tableId: { in: tableIds },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    data: {
      // Would need waiterId field in RestaurantOrder model
      // For now, we can use notes or extend schema
    },
  })
}

