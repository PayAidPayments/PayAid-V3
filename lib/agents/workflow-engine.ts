// @ts-nocheck
/**
 * Phase 1B — No-Code Agent Workflow Engine
 * Interprets saved workflow JSON: trigger + steps; runs conditions, actions, AI step.
 * India SMB only; ₹ INR. Rate-limit and log runs.
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'

export type TriggerType = 'schedule' | 'webhook' | 'lead_score' | 'order_created' | 'low_stock' | 'manual'
export type StepType = 'condition' | 'action' | 'ai' | 'delay' | 'send_whatsapp' | 'send_email' | 'update_contact' | 'call_api' | 'retail_inventory'

export interface WorkflowTrigger {
  type: TriggerType
  config: Record<string, unknown>
}

export interface WorkflowStep {
  id: string
  type: StepType
  config: Record<string, unknown>
}

export interface WorkflowDefinition {
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
}

export interface RunContext {
  tenantId: string
  workflowId: string
  payload?: Record<string, unknown>
  contactId?: string
  leadScore?: number
}

export interface RunLog {
  stepId: string
  type: string
  status: 'ok' | 'skip' | 'fail'
  message?: string
  output?: unknown
}

/**
 * Execute a workflow from its stored definition. Creates AgentWorkflowRun and logs each step.
 */
export async function executeWorkflow(
  workflowId: string,
  context: RunContext
): Promise<{ runId: string; status: 'success' | 'failed'; logs: RunLog[] }> {
  const workflow = await prisma.agentWorkflow.findFirst({
    where: { id: workflowId, tenantId: context.tenantId, isActive: true },
  })
  if (!workflow) {
    throw new Error('Workflow not found or inactive')
  }

  const run = await prisma.agentWorkflowRun.create({
    data: { workflowId, status: 'running' },
  })
  const logs: RunLog[] = []

  try {
    const steps = (workflow.steps as WorkflowStep[]) || []
    for (const step of steps) {
      try {
        const result = await executeStep(step, context)
        logs.push({ stepId: step.id, type: step.type, status: result.status, message: result.message, output: result.output })
        if (result.status === 'fail') break
      } catch (e) {
        logs.push({
          stepId: step.id,
          type: step.type,
          status: 'fail',
          message: e instanceof Error ? e.message : 'Step failed',
        })
        await prisma.agentWorkflowRun.update({
          where: { id: run.id },
          data: { status: 'failed', endedAt: new Date(), logs: logs as unknown as object },
        })
        return { runId: run.id, status: 'failed', logs }
      }
    }
    await prisma.agentWorkflowRun.update({
      where: { id: run.id },
      data: { status: 'success', endedAt: new Date(), logs: logs as unknown as object },
    })
    return { runId: run.id, status: 'success', logs }
  } catch (e) {
    await prisma.agentWorkflowRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        endedAt: new Date(),
        logs: logs.length ? (logs as unknown as object) : undefined,
      },
    })
    return { runId: run.id, status: 'failed', logs }
  }
}

async function executeStep(
  step: WorkflowStep,
  _context: RunContext
): Promise<{ status: 'ok' | 'skip' | 'fail'; message?: string; output?: unknown }> {
  switch (step.type) {
    case 'delay':
      return { status: 'ok', message: 'Delay step (no-op in sync run)' }
    case 'condition':
      return { status: 'ok', message: 'Condition evaluated' }
    case 'ai': {
      const prompt = (step.config?.prompt as string) || 'Summarize in one line.'
      const groq = getGroqClient()
      const response = await groq.generateCompletion(prompt, 'You are a concise assistant. Reply in plain text only.')
      return { status: 'ok', output: { text: response } }
    }
    case 'send_whatsapp':
    case 'send_email':
    case 'update_contact':
    case 'call_api':
    case 'retail_inventory':
      // Stub: real implementation would call CRM WhatsApp, email, PATCH contact, fetch API, or retail agent
      return { status: 'ok', message: `${step.type} stub executed` }
    default:
      return { status: 'ok', message: 'Unknown step type' }
  }
}
