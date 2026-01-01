/**
 * Workflow Execution Engine
 * Executes workflow steps based on triggers
 */

import { prisma } from '@/lib/db/prisma'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

export interface WorkflowStep {
  id: string
  type: string // 'condition', 'action', 'delay', 'webhook', 'email', 'sms', etc.
  config: any
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflowId: string,
  triggerData?: any
): Promise<void> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow || !workflow.isActive) {
    throw new Error('Workflow not found or inactive')
  }

  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      tenantId: workflow.tenantId,
      status: 'RUNNING',
      triggerData: triggerData || {},
    },
  })

  try {
    const steps = (workflow.steps as unknown) as WorkflowStep[]
    const result = await executeSteps(workflow.tenantId, steps, triggerData || {})

    // Update execution as completed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        result,
        completedAt: new Date(),
      },
    })
  } catch (error: any) {
    // Update execution as failed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: error.message || 'Unknown error',
        completedAt: new Date(),
      },
    })
    throw error
  }
}

/**
 * Execute workflow steps
 */
async function executeSteps(
  tenantId: string,
  steps: WorkflowStep[],
  context: any
): Promise<any> {
  const results: any[] = []

  for (const step of steps) {
    const result = await executeStep(tenantId, step, context)
    results.push(result)

    // Update context with step result
    context[step.id] = result

    // Handle conditional steps
    if (step.type === 'condition') {
      const conditionResult = evaluateCondition(step.config, context)
      if (!conditionResult) {
        // Skip remaining steps if condition is false
        break
      }
    }
  }

  return results
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  tenantId: string,
  step: WorkflowStep,
  context: any
): Promise<any> {
  switch (step.type) {
    case 'delay':
      await new Promise((resolve) => setTimeout(resolve, step.config.duration || 0))
      return { type: 'delay', completed: true }

    case 'webhook':
      await dispatchWebhook(tenantId, step.config.event || 'workflow.triggered', {
        step: step.id,
        data: context,
      })
      return { type: 'webhook', completed: true }

    case 'email':
      // TODO: Implement email sending
      return { type: 'email', completed: true }

    case 'sms':
      // TODO: Implement SMS sending
      return { type: 'sms', completed: true }

    case 'create_contact':
      // TODO: Implement contact creation
      return { type: 'create_contact', completed: true }

    case 'update_contact':
      // TODO: Implement contact update
      return { type: 'update_contact', completed: true }

    case 'create_task':
      // TODO: Implement task creation
      return { type: 'create_task', completed: true }

    default:
      return { type: step.type, completed: true, message: 'Step type not implemented' }
  }
}

/**
 * Evaluate condition
 */
function evaluateCondition(config: any, context: any): boolean {
  const { field, operator, value } = config

  const fieldValue = getNestedValue(context, field)

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'not_equals':
      return fieldValue !== value
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'contains':
      return String(fieldValue).includes(String(value))
    case 'not_contains':
      return !String(fieldValue).includes(String(value))
    default:
      return false
  }
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Trigger workflows for an event
 */
export async function triggerWorkflows(
  tenantId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: {
      tenantId,
      isActive: true,
      triggerType: 'EVENT',
      triggerEvent: eventType,
    },
  })

  // Execute all matching workflows
  await Promise.allSettled(
    workflows.map((workflow) => executeWorkflow(workflow.id, eventData))
  )
}

