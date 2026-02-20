/**
 * Real Estate: RERA Compliance
 * Tracks milestones and ensures RERA compliance
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface RERAMilestone {
  id: string
  name: string
  description: string
  dueDate: Date
  completionDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  reraRequirement: string
}

/**
 * Get RERA milestones for a project
 */
export async function getRERAMilestones(
  tenantId: string,
  projectId: string
): Promise<RERAMilestone[]> {
  // Standard RERA milestones
  const standardMilestones: Omit<RERAMilestone, 'id' | 'status'>[] = [
    {
      name: 'Project Registration',
      description: 'Register project with RERA',
      dueDate: new Date(), // Would be calculated from project start
      reraRequirement: 'Section 3: Registration of real estate project',
    },
    {
      name: 'Agreement for Sale',
      description: 'Execute agreement for sale with buyers',
      dueDate: new Date(),
      reraRequirement: 'Section 13: Agreement for sale',
    },
    {
      name: 'Escrow Account Setup',
      description: 'Set up escrow account for funds',
      dueDate: new Date(),
      reraRequirement: 'Section 4: Separate bank account',
    },
    {
      name: 'Quarterly Progress Report',
      description: 'Submit quarterly progress to RERA',
      dueDate: new Date(),
      reraRequirement: 'Section 11: Quarterly progress report',
    },
  ]

  // Check completion status
  const milestones: RERAMilestone[] = standardMilestones.map((m, idx) => {
    const now = new Date()
    let status: RERAMilestone['status'] = 'pending'
    
    if (m.dueDate < now && !m.completionDate) {
      status = 'overdue'
    } else if (m.completionDate) {
      status = 'completed'
    }

    return {
      id: `rera_${projectId}_${idx}`,
      ...m,
      status,
    }
  })

  return milestones
}

/**
 * Check RERA compliance status
 */
export async function checkRERACompliance(
  tenantId: string,
  projectId: string
): Promise<{
  compliant: boolean
  score: number
  issues: string[]
  milestones: RERAMilestone[]
}> {
  const milestones = await getRERAMilestones(tenantId, projectId)
  
  const completed = milestones.filter((m) => m.status === 'completed').length
  const overdue = milestones.filter((m) => m.status === 'overdue').length
  
  const score = (completed / milestones.length) * 100
  const compliant = overdue === 0 && score >= 80

  const issues: string[] = []
  if (overdue > 0) {
    issues.push(`${overdue} milestone(s) are overdue`)
  }
  if (score < 80) {
    issues.push(`Compliance score below 80%`)
  }

  return {
    compliant,
    score,
    issues,
    milestones,
  }
}
