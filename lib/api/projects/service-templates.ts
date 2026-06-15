import type { Prisma } from '@prisma/client'
import { ensureMilestoneApprovalChecklistTask } from '@/lib/api/projects/milestone-approval-scripting'

/**
 * §6 Service templates — catalogs delivery + billing presets and optionally seeds phases + starter tasks on create.
 * IDs stable for API/UI; extend without renaming existing ids.
 */

export const SERVICE_TEMPLATE_IDS = [
  'software_product',
  'website_agency',
  'marketing_retainer',
  'outsourcing_msp',
  'support_package',
] as const

export type ServiceTemplateId = (typeof SERVICE_TEMPLATE_IDS)[number]

type DeliveryTypeApi = 'software_delivery' | 'agency' | 'outsourcing' | 'internal'

type TemplateShape = {
  label: string
  phaseNames: readonly string[]
  milestones: readonly {
    name: string
    billingTrigger: 'NONE' | 'ON_COMPLETE' | 'ON_APPROVE'
    approvalRequired: boolean
  }[]
  deliveryTypeDefault: Exclude<DeliveryTypeApi, 'internal'>
  billingModelDefault: string
  serviceCategoryHint: string | null
}

/** Phase names mirror **PROJECTS_SERVICE_MODULE_SPEC.md** §6. */
const SERVICE_TEMPLATES_META: Record<ServiceTemplateId, TemplateShape> = {
  software_product: {
    label: 'Software delivery',
    phaseNames: ['Discovery', 'Build', 'QA', 'Release', 'Hypercare'],
    milestones: [
      { name: 'Scope sign-off', billingTrigger: 'NONE', approvalRequired: true },
      { name: 'UAT sign-off', billingTrigger: 'ON_APPROVE', approvalRequired: true },
      { name: 'Go-live readiness', billingTrigger: 'ON_COMPLETE', approvalRequired: false },
    ],
    deliveryTypeDefault: 'software_delivery',
    billingModelDefault: 'HYBRID',
    serviceCategoryHint: 'software_delivery',
  },
  website_agency: {
    label: 'Website / agency',
    phaseNames: ['Kickoff', 'Design', 'Dev', 'UAT', 'Launch'],
    milestones: [
      { name: 'Design approval', billingTrigger: 'ON_APPROVE', approvalRequired: true },
      { name: 'UAT approval', billingTrigger: 'ON_APPROVE', approvalRequired: true },
      { name: 'Launch sign-off', billingTrigger: 'ON_COMPLETE', approvalRequired: false },
    ],
    deliveryTypeDefault: 'agency',
    billingModelDefault: 'FIXED_FEE',
    serviceCategoryHint: 'agency',
  },
  marketing_retainer: {
    label: 'Marketing retainer',
    phaseNames: ['Strategy', 'Production', 'Reporting'],
    milestones: [
      { name: 'Campaign plan approved', billingTrigger: 'NONE', approvalRequired: true },
      { name: 'Monthly report reviewed', billingTrigger: 'NONE', approvalRequired: false },
    ],
    deliveryTypeDefault: 'agency',
    billingModelDefault: 'RETAINER',
    serviceCategoryHint: 'marketing',
  },
  outsourcing_msp: {
    label: 'Outsourcing / MSP',
    phaseNames: ['Onboard', 'Run', 'Review', 'Renew'],
    milestones: [
      { name: 'Transition complete', billingTrigger: 'ON_COMPLETE', approvalRequired: false },
      { name: 'Quarterly service review', billingTrigger: 'NONE', approvalRequired: true },
    ],
    deliveryTypeDefault: 'outsourcing',
    billingModelDefault: 'RETAINER',
    serviceCategoryHint: 'managed_services',
  },
  support_package: {
    label: 'Support package',
    phaseNames: ['Intake', 'Triage', 'Resolve', 'Close'],
    milestones: [
      { name: 'SLA baseline agreed', billingTrigger: 'NONE', approvalRequired: true },
      { name: 'Service closure review', billingTrigger: 'ON_COMPLETE', approvalRequired: false },
    ],
    deliveryTypeDefault: 'agency',
    billingModelDefault: 'TIME_AND_MATERIALS',
    serviceCategoryHint: 'support',
  },
}

export function listServiceTemplatesPublic() {
  return SERVICE_TEMPLATE_IDS.map((id) => {
    const m = SERVICE_TEMPLATES_META[id]
    return {
      id,
      label: m.label,
      phaseCount: m.phaseNames.length,
      milestoneCount: m.milestones.length,
      phaseNames: [...m.phaseNames],
      milestoneNames: m.milestones.map((ms) => ms.name),
      milestoneDefaults: m.milestones.map((ms) => ({
        name: ms.name,
        billingTrigger: ms.billingTrigger,
        approvalRequired: ms.approvalRequired,
      })),
      deliveryTypeDefault: m.deliveryTypeDefault,
      billingModelDefault: m.billingModelDefault,
      serviceCategoryHint: m.serviceCategoryHint,
    }
  })
}

export function getServiceTemplateDeliveryDefault(
  id: ServiceTemplateId
): Exclude<DeliveryTypeApi, 'internal'> {
  return SERVICE_TEMPLATES_META[id].deliveryTypeDefault
}

export function getServiceTemplateBillingDefault(id: ServiceTemplateId): string {
  return SERVICE_TEMPLATES_META[id].billingModelDefault
}

export function getServiceCategoryHint(id: ServiceTemplateId): string | null {
  return SERVICE_TEMPLATES_META[id].serviceCategoryHint
}

/**
 * Seeds `ProjectPhase` + one starter `ProjectTask` per phase (linked via `phaseId`).
 * Caller runs inside **`$transaction`**.
 */
export async function seedServiceTemplatePlan(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string
    templateId: ServiceTemplateId
    assigneeUserId: string | null
  }
): Promise<{ phasesCreated: number; milestonesCreated: number; tasksCreated: number }> {
  const meta = SERVICE_TEMPLATES_META[input.templateId]
  let tasksCreated = 0
  let milestonesCreated = 0
  const tag = ['service_template_seed', input.templateId]

  let sortOrder = 0
  for (const name of meta.phaseNames) {
    const phase = await tx.projectPhase.create({
      data: {
        projectId: input.projectId,
        name,
        sortOrder,
        status: 'PLANNED',
      },
    })
    sortOrder += 1

    await tx.projectTask.create({
      data: {
        projectId: input.projectId,
        phaseId: phase.id,
        name: `${name}: starter work`,
        description: 'Populate detailed tasks from your plan checklist (§6 checklist step).',
        priority: sortOrder <= 2 ? 'HIGH' : 'MEDIUM',
        status: 'TODO',
        tags: tag,
        ...(input.assigneeUserId ? { assignedToId: input.assigneeUserId } : {}),
      },
    })
    tasksCreated += 1
  }

  for (let i = 0; i < meta.milestones.length; i += 1) {
    const ms = meta.milestones[i]
    // Keep seeded due dates deterministic and minimally useful for early planning views.
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (i + 1) * 14)
    const milestone = await tx.projectMilestone.create({
      data: {
        projectId: input.projectId,
        name: ms.name,
        dueDate,
        status: 'PENDING',
        billingTrigger: ms.billingTrigger,
        approvalRequired: ms.approvalRequired,
        sortOrder: i,
      },
    })
    milestonesCreated += 1

    const approvalChecklist = await ensureMilestoneApprovalChecklistTask(tx, {
      projectId: input.projectId,
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      dueDate: milestone.dueDate,
      billingTrigger: milestone.billingTrigger,
      approvalRequired: milestone.approvalRequired,
      assigneeUserId: input.assigneeUserId,
    })
    if (approvalChecklist.created) tasksCreated += 1
  }

  return { phasesCreated: meta.phaseNames.length, milestonesCreated, tasksCreated }
}
