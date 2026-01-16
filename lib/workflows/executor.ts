/**
 * Workflow Execution Engine
 * Executes workflow steps based on triggers
 * Includes error handling and retry logic
 */

import { prisma } from '@/lib/db/prisma'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

export interface WorkflowStep {
  id: string
  type: string // 'condition', 'action', 'delay', 'webhook', 'email', 'sms', etc.
  config: any
  retryConfig?: {
    maxRetries?: number
    retryDelay?: number // in milliseconds
    retryable?: boolean // whether this step can be retried
  }
}

interface StepExecutionResult {
  stepId: string
  success: boolean
  result?: any
  error?: string
  retries?: number
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds

/**
 * Calculate exponential backoff delay
 */
function calculateRetryDelay(attempt: number, baseDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, MAX_RETRY_DELAY)
}

/**
 * Execute a workflow with error handling and retry logic
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
    const result = await executeStepsWithRetry(
      workflow.tenantId,
      execution.id,
      steps,
      triggerData || {}
    )

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
    
    // Log error for monitoring
    console.error(`Workflow execution failed: ${execution.id}`, {
      workflowId,
      error: error.message,
      stack: error.stack,
    })
    
    // Don't throw - allow workflow to fail gracefully
    // Callers can check execution status
  }
}

/**
 * Execute workflow steps with retry logic
 */
async function executeStepsWithRetry(
  tenantId: string,
  executionId: string,
  steps: WorkflowStep[],
  context: any
): Promise<StepExecutionResult[]> {
  const results: StepExecutionResult[] = []

  for (const step of steps) {
    const stepResult = await executeStepWithRetry(tenantId, executionId, step, context)
    results.push(stepResult)

    // If step failed and is not retryable, stop execution
    if (!stepResult.success && !step.retryConfig?.retryable) {
      throw new Error(`Step ${step.id} failed: ${stepResult.error}`)
    }

    // Update context with step result (only if successful)
    if (stepResult.success && stepResult.result) {
      context[step.id] = stepResult.result
    }

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
 * Execute a single step with retry logic
 */
async function executeStepWithRetry(
  tenantId: string,
  executionId: string,
  step: WorkflowStep,
  context: any
): Promise<StepExecutionResult> {
  const maxRetries = step.retryConfig?.maxRetries ?? DEFAULT_MAX_RETRIES
  const baseDelay = step.retryConfig?.retryDelay ?? DEFAULT_RETRY_DELAY
  const isRetryable = step.retryConfig?.retryable ?? true

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const result = await executeStep(tenantId, step, context)
      
      return {
        stepId: step.id,
        success: true,
        result,
        retries: attempt,
      }
    } catch (error: any) {
      lastError = error
      attempt++

      // If not retryable or max retries reached, fail
      if (!isRetryable || attempt > maxRetries) {
        console.error(`Step ${step.id} failed after ${attempt} attempts:`, error)
        
        // Log step failure to execution
        try {
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              error: `Step ${step.id} failed: ${error.message}`,
            },
          })
        } catch (dbError) {
          console.error('Failed to update execution error:', dbError)
        }

        return {
          stepId: step.id,
          success: false,
          error: error.message || 'Unknown error',
          retries: attempt - 1,
        }
      }

      // Calculate delay with exponential backoff
      const delay = calculateRetryDelay(attempt, baseDelay)
      console.log(`Step ${step.id} failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    stepId: step.id,
    success: false,
    error: lastError?.message || 'Unknown error',
    retries: attempt - 1,
  }
}

/**
 * Execute workflow steps (legacy - kept for backward compatibility)
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
 * Throws error on failure to enable retry logic
 */
async function executeStep(
  tenantId: string,
  step: WorkflowStep,
  context: any
): Promise<any> {
  try {
    switch (step.type) {
      case 'delay':
        await new Promise((resolve) => setTimeout(resolve, step.config.duration || 0))
        return { type: 'delay', completed: true }

      case 'webhook':
        try {
          await dispatchWebhook(tenantId, step.config.event || 'workflow.triggered', {
            step: step.id,
            data: context,
          })
          return { type: 'webhook', completed: true }
        } catch (error) {
          throw new Error(`Webhook dispatch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

      case 'email':
        // TODO: Implement email sending
        // For now, simulate success
        if (step.config.simulateError) {
          throw new Error('Simulated email error')
        }
        return { type: 'email', completed: true }

      case 'sms':
        // TODO: Implement SMS sending
        if (step.config.simulateError) {
          throw new Error('Simulated SMS error')
        }
        return { type: 'sms', completed: true }

      case 'create_contact':
        // TODO: Implement contact creation
        if (step.config.simulateError) {
          throw new Error('Simulated contact creation error')
        }
        return { type: 'create_contact', completed: true }

      case 'update_contact':
        // TODO: Implement contact update
        if (step.config.simulateError) {
          throw new Error('Simulated contact update error')
        }
        return { type: 'update_contact', completed: true }

      case 'create_task':
        // TODO: Implement task creation
        if (step.config.simulateError) {
          throw new Error('Simulated task creation error')
        }
        return { type: 'create_task', completed: true }

      default:
        return { type: step.type, completed: true, message: 'Step type not implemented' }
    }
  } catch (error) {
    // Re-throw to allow retry logic to handle it
    throw error
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

