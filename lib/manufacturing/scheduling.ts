/**
 * Advanced Production Scheduling Algorithms
 * Includes capacity planning, machine allocation, and optimization
 */

import { prisma } from '@/lib/db/prisma'

export interface MachineCapacity {
  machineId: string
  machineName: string
  availableHours: number
  utilizationRate: number
  scheduledHours: number
}

export interface ScheduleOptimization {
  orderId: string
  recommendedStartDate: Date
  recommendedEndDate: Date
  recommendedMachineId?: string
  estimatedDuration: number // hours
  conflicts: string[]
  warnings: string[]
}

/**
 * Calculate machine capacity for a date range
 */
export async function calculateMachineCapacity(
  tenantId: string,
  machineId: string,
  startDate: Date,
  endDate: Date
): Promise<MachineCapacity> {
  // Get machine details
  const machine = await prisma.machine.findFirst({
    where: {
      id: machineId,
      tenantId,
    },
  })

  if (!machine) {
    throw new Error('Machine not found')
  }

  // Get existing schedules for this machine in the date range
  const existingSchedules = await prisma.productionSchedule.findMany({
    where: {
      tenantId,
      machineId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      OR: [
        {
          scheduledStartDate: { lte: endDate },
          scheduledEndDate: { gte: startDate },
        },
      ],
    },
  })

  // Calculate total hours in range
  const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  
  // Calculate scheduled hours
  const scheduledHours = existingSchedules.reduce((total, schedule) => {
    const scheduleStart = Math.max(schedule.scheduledStartDate.getTime(), startDate.getTime())
    const scheduleEnd = Math.min(schedule.scheduledEndDate.getTime(), endDate.getTime())
    const hours = (scheduleEnd - scheduleStart) / (1000 * 60 * 60)
    return total + Math.max(0, hours)
  }, 0)

  // Calculate available hours (considering machine capacity)
  const machineCapacity = Number(machine.capacityHoursPerDay || 8) * (totalHours / 24)
  const availableHours = Math.max(0, machineCapacity - scheduledHours)
  const utilizationRate = machineCapacity > 0 ? (scheduledHours / machineCapacity) * 100 : 0

  return {
    machineId: machine.id,
    machineName: machine.name,
    availableHours,
    utilizationRate,
    scheduledHours,
  }
}

/**
 * Find best machine for an order based on capacity and availability
 */
export async function findBestMachine(
  tenantId: string,
  orderId: string,
  requiredHours: number,
  preferredStartDate: Date
): Promise<{ machineId: string; startDate: Date; endDate: Date } | null> {
  // Get all available machines
  const machines = await prisma.machine.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
    },
  })

  if (machines.length === 0) {
    return null
  }

  // Calculate capacity for each machine
  const machineCapacities = await Promise.all(
    machines.map(async (machine) => {
      const endDate = new Date(preferredStartDate)
      endDate.setHours(endDate.getHours() + requiredHours)

      const capacity = await calculateMachineCapacity(
        tenantId,
        machine.id,
        preferredStartDate,
        endDate
      )

      return {
        machine,
        capacity,
        score: capacity.availableHours >= requiredHours
          ? capacity.availableHours - capacity.utilizationRate
          : -1, // Not available
      }
    })
  )

  // Find machine with best score
  const availableMachines = machineCapacities.filter((mc) => mc.score >= 0)
  if (availableMachines.length === 0) {
    return null
  }

  const bestMachine = availableMachines.reduce((best, current) =>
    current.score > best.score ? current : best
  )

  const endDate = new Date(preferredStartDate)
  endDate.setHours(endDate.getHours() + requiredHours)

  return {
    machineId: bestMachine.machine.id,
    startDate: preferredStartDate,
    endDate,
  }
}

/**
 * Optimize production schedule for multiple orders
 */
export async function optimizeSchedule(
  tenantId: string,
  orderIds: string[]
): Promise<ScheduleOptimization[]> {
  const orders = await prisma.manufacturingOrder.findMany({
    where: {
      id: { in: orderIds },
      tenantId,
    },
    })

  const optimizations: ScheduleOptimization[] = []

  for (const order of orders) {
    // Estimate production time (simplified - could use BOM complexity)
    const estimatedHours = order.quantity * 0.5 // 0.5 hours per unit (example)
    const preferredStartDate = order.startDate || new Date()

    // Find best machine
    const machineAllocation = await findBestMachine(
      tenantId,
      order.id,
      estimatedHours,
      preferredStartDate
    )

    if (machineAllocation) {
      optimizations.push({
        orderId: order.id,
        recommendedStartDate: machineAllocation.startDate,
        recommendedEndDate: machineAllocation.endDate,
        recommendedMachineId: machineAllocation.machineId,
        estimatedDuration: estimatedHours,
        conflicts: [],
        warnings: [],
      })
    } else {
      optimizations.push({
        orderId: order.id,
        recommendedStartDate: preferredStartDate,
        recommendedEndDate: new Date(preferredStartDate.getTime() + estimatedHours * 60 * 60 * 1000),
        estimatedDuration: estimatedHours,
        conflicts: ['No available machine found'],
        warnings: ['Schedule may need manual adjustment'],
      })
    }
  }

  return optimizations
}

/**
 * Check for scheduling conflicts
 */
export async function checkSchedulingConflicts(
  tenantId: string,
  machineId: string,
  startDate: Date,
  endDate: Date,
  excludeScheduleId?: string
): Promise<string[]> {
  const conflicts: string[] = []

  const overlappingSchedules = await prisma.productionSchedule.findMany({
    where: {
      tenantId,
      machineId,
      id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      OR: [
        {
          scheduledStartDate: { lte: endDate },
          scheduledEndDate: { gte: startDate },
        },
      ],
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          productName: true,
        },
      },
    },
  })

  for (const schedule of overlappingSchedules) {
    conflicts.push(
      `Conflicts with ${schedule.order.orderNumber} (${schedule.order.productName}) scheduled from ${schedule.scheduledStartDate.toISOString()} to ${schedule.scheduledEndDate.toISOString()}`
    )
  }

  return conflicts
}

