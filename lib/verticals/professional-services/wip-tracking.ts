/**
 * Professional Services: Work in Progress (WIP) Tracking
 * Tracks unbilled work and revenue recognition
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface WIPEntry {
  projectId: string
  projectName: string
  hours: number
  rate: number
  unbilledAmount: number
  status: 'in_progress' | 'completed_unbilled' | 'billed'
}

/**
 * Calculate WIP for a tenant
 */
export async function calculateWIP(tenantId: string): Promise<{
  totalWIP: number
  entries: WIPEntry[]
}> {
  // Get unbilled time entries
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      tenantId,
      isBillable: true,
      invoiceId: null, // Unbilled
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const entries: WIPEntry[] = []
  let totalWIP = 0

  for (const entry of timeEntries) {
    const rate = Number((entry as any).rate || 0)
    const hours = Number(entry.hours || 0)
    const unbilledAmount = rate * hours

    entries.push({
      projectId: entry.projectId,
      projectName: entry.project?.name || 'Unknown',
      hours,
      rate,
      unbilledAmount,
      status: 'in_progress',
    })

    totalWIP += unbilledAmount
  }

  return { totalWIP, entries }
}

/**
 * Revenue recognition (percentage of completion method)
 */
export async function calculateRevenueRecognition(
  tenantId: string,
  projectId: string
): Promise<{
  totalContractValue: number
  recognizedRevenue: number
  deferredRevenue: number
  completionPercentage: number
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, tenantId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const contractValue = Number((project as any).contractValue || 0)
  
  // Calculate completion percentage
  const tasks = await prisma.projectTask.findMany({
    where: { projectId },
  })
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const completionPercentage = tasks.length > 0
    ? (completedTasks / tasks.length) * 100
    : 0

  const recognizedRevenue = (contractValue * completionPercentage) / 100
  const deferredRevenue = contractValue - recognizedRevenue

  return {
    totalContractValue: contractValue,
    recognizedRevenue,
    deferredRevenue,
    completionPercentage,
  }
}
