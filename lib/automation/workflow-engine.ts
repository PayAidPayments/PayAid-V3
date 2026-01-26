/**
 * Sales Automation Workflow Engine
 * Executes conditional workflows with IF/AND/THEN logic
 */

import { prisma } from '@/lib/db/prisma'
import { qualifyLead } from '@/lib/crm/lead-qualification'
import { autoAllocateLead, assignLeadToRep } from '@/lib/sales-automation/lead-allocation'
import { enrollLeadInSequence } from '@/lib/marketing/nurture-sequences'

export interface WorkflowTrigger {
  type: 'contact.created' | 'contact.updated' | 'deal.created' | 'deal.updated' | 
        'email.opened' | 'email.clicked' | 'task.completed' | 'interaction.created' |
        'schedule' | 'manual'
  conditions?: {
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
    value: any
  }[]
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'update_contact' | 
        'assign_to_rep' | 'enroll_nurture' | 'notify' | 'webhook'
  config: Record<string, any>
}

export interface WorkflowStep {
  id: string
  condition?: {
    field: string
    operator: string
    value: any
    logic?: 'AND' | 'OR'
  }
  actions: WorkflowAction[]
  nextStepId?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  isActive: boolean
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflowId: string,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<{ success: boolean; executedActions: number; errors: string[] }> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow || workflow.tenantId !== tenantId || !workflow.isActive) {
    throw new Error('Workflow not found or inactive')
  }

  const steps = workflow.steps as WorkflowStep[]
  const errors: string[] = []
  let executedActions = 0

  // Execute each step
  for (const step of steps) {
    // Check condition if present
    if (step.condition) {
      const conditionMet = evaluateCondition(step.condition, triggerData)
      if (!conditionMet) {
        continue // Skip this step
      }
    }

    // Execute actions
    for (const action of step.actions) {
      try {
        await executeAction(action, triggerData, tenantId)
        executedActions++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Action ${action.type} failed: ${errorMsg}`)
        console.error(`Workflow action failed:`, error)
      }
    }
  }

  // Log execution
  await prisma.workflowExecution.create({
    data: {
      workflowId,
      tenantId,
      status: errors.length === 0 ? 'COMPLETED' : 'FAILED',
      triggerData: triggerData as any,
      result: { executedActions, errors } as any,
      error: errors.length > 0 ? errors.join('; ') : null,
    },
  })

  return {
    success: errors.length === 0,
    executedActions,
    errors,
  }
}

/**
 * Evaluate a condition
 */
function evaluateCondition(
  condition: WorkflowStep['condition'],
  data: Record<string, any>
): boolean {
  if (!condition) return true

  const fieldValue = getNestedValue(data, condition.field)
  const conditionValue = condition.value

  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())
    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue)
    case 'less_than':
      return Number(fieldValue) < Number(conditionValue)
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
    default:
      return false
  }
}

/**
 * Execute a workflow action
 */
async function executeAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  switch (action.type) {
    case 'send_email':
      await sendEmailAction(action, triggerData, tenantId)
      break
    case 'send_sms':
      await sendSMSAction(action, triggerData, tenantId)
      break
    case 'create_task':
      await createTaskAction(action, triggerData, tenantId)
      break
    case 'update_contact':
      await updateContactAction(action, triggerData, tenantId)
      break
    case 'assign_to_rep':
      await assignToRepAction(action, triggerData, tenantId)
      break
    case 'enroll_nurture':
      await enrollNurtureAction(action, triggerData, tenantId)
      break
    case 'notify':
      await notifyAction(action, triggerData, tenantId)
      break
    case 'webhook':
      await webhookAction(action, triggerData, tenantId)
      break
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

/**
 * Send email action
 */
async function sendEmailAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const contactId = triggerData.contactId || triggerData.contact?.id
  if (!contactId) throw new Error('Contact ID required for email action')

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  })

  if (!contact || !contact.email) {
    throw new Error('Contact not found or no email')
  }

  // Use email template or custom content
  const subject = action.config.subject || 'Welcome to PayAid'
  const body = action.config.body || action.config.templateId
    ? await getTemplateContent(action.config.templateId, tenantId)
    : 'Thank you for your interest!'

  // Send email via API
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: contact.email,
      subject,
      html: body,
      contactId,
    }),
  })
}

/**
 * Send SMS action
 */
async function sendSMSAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  // SMS implementation would go here
  console.log('SMS action:', action.config)
}

/**
 * Create task action
 */
async function createTaskAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const contactId = triggerData.contactId || triggerData.contact?.id
  if (!contactId) throw new Error('Contact ID required for task action')

  await prisma.task.create({
    data: {
      contactId,
      tenantId,
      title: action.config.title || 'Follow up',
      description: action.config.description || '',
      dueDate: action.config.dueDate
        ? new Date(action.config.dueDate)
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'pending',
      priority: action.config.priority || 'medium',
    },
  })
}

/**
 * Update contact action
 */
async function updateContactAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const contactId = triggerData.contactId || triggerData.contact?.id
  if (!contactId) throw new Error('Contact ID required for update action')

  await prisma.contact.update({
    where: { id: contactId },
    data: action.config.updates || {},
  })
}

/**
 * Assign to rep action
 */
async function assignToRepAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const contactId = triggerData.contactId || triggerData.contact?.id
  if (!contactId) throw new Error('Contact ID required for assign action')

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  })

  if (!contact) throw new Error('Contact not found')

  if (action.config.repId) {
    // Manual assignment
    await assignLeadToRep(contactId, action.config.repId, tenantId)
  } else {
    // Auto-assignment
    const allocation = await autoAllocateLead(contact, tenantId)
    await assignLeadToRep(contactId, allocation.bestRep.rep.id, tenantId)
  }
}

/**
 * Enroll in nurture action
 */
async function enrollNurtureAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const contactId = triggerData.contactId || triggerData.contact?.id
  if (!contactId) throw new Error('Contact ID required for nurture action')

  const templateId = action.config.templateId
  if (!templateId) throw new Error('Template ID required for nurture action')

  await enrollLeadInSequence(contactId, templateId, tenantId)
}

/**
 * Notify action
 */
async function notifyAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  // Create notification
  await prisma.alert.create({
    data: {
      tenantId,
      type: action.config.type || 'info',
      title: action.config.title || 'Workflow Notification',
      message: action.config.message || '',
      userId: action.config.userId,
      isRead: false,
    },
  })
}

/**
 * Webhook action
 */
async function webhookAction(
  action: WorkflowAction,
  triggerData: Record<string, any>,
  tenantId: string
): Promise<void> {
  const url = action.config.url
  if (!url) throw new Error('Webhook URL required')

  await fetch(url, {
    method: action.config.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(action.config.headers || {}),
    },
    body: JSON.stringify({
      event: 'workflow.triggered',
      tenantId,
      data: triggerData,
    }),
  })
}

/**
 * Helper: Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

/**
 * Helper: Get template content
 */
async function getTemplateContent(templateId: string, tenantId: string): Promise<string> {
  const template = await prisma.emailTemplate.findFirst({
    where: { id: templateId, tenantId },
  })
  return template?.htmlContent || ''
}

/**
 * Trigger workflow by event
 */
export async function triggerWorkflowByEvent(
  eventType: string,
  data: Record<string, any>,
  tenantId: string
): Promise<void> {
  // Find active workflows for this event
  const workflows = await prisma.workflow.findMany({
    where: {
      tenantId,
      isActive: true,
      triggerType: 'EVENT',
      triggerEvent: eventType,
    },
  })

  // Execute each workflow
  for (const workflow of workflows) {
    try {
      await executeWorkflow(workflow.id, data, tenantId)
    } catch (error) {
      console.error(`Error executing workflow ${workflow.id}:`, error)
    }
  }
}
