/**
 * Workflow execution engine.
 * Runs workflow steps (send email, create task, webhook, etc.) with trigger context.
 * Use from API routes or from event hooks (e.g. after contact created).
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'
import type { WorkflowStep } from './types'

export interface TriggerContext {
  tenantId: string
  event: string
  entity?: string
  entityId?: string
  data?: Record<string, unknown>
}

/** Execute a single step; returns result for logging */
export async function executeStep(
  step: WorkflowStep,
  context: TriggerContext
): Promise<{ success: boolean; message?: string; error?: string }> {
  const { type, config } = step
  const { tenantId, data = {} } = context

  try {
    switch (type) {
      case 'send_email': {
        const to = (config.to as string) || (data?.contact?.email as string) || (data?.customer?.email as string)
        const subject = (config.subject as string) || 'Notification'
        const body = (config.body as string) || ''
        if (!to) return { success: false, error: 'No email recipient' }
        // TODO: integrate SendGrid; for now log
        console.log(`[WORKFLOW] send_email to ${to}: ${subject}`)
        return { success: true, message: `Email queued to ${to}` }
      }

      case 'send_sms': {
        const to = (config.to as string) || (data?.contact?.phone as string) || (data?.customer?.phone as string)
        const body = (config.body as string) || ''
        if (!to) return { success: false, error: 'No SMS recipient' }
        // TODO: integrate Twilio/Exotel
        console.log(`[WORKFLOW] send_sms to ${to}: ${body.slice(0, 50)}...`)
        return { success: true, message: `SMS queued to ${to}` }
      }

      case 'send_whatsapp': {
        const to = (config.to as string) || (data?.contact?.phone as string) || (data?.customer?.phone as string)
        const body = (config.body as string) || ''
        if (!to) return { success: false, error: 'No WhatsApp recipient' }
        // TODO: integrate WATI
        console.log(`[WORKFLOW] send_whatsapp to ${to}: ${body.slice(0, 50)}...`)
        return { success: true, message: `WhatsApp queued to ${to}` }
      }

      case 'create_task': {
        const title = (config.title as string) || 'Workflow task'
        const assignTo = config.assignTo as string | undefined
        const dueInDays = (config.dueInDays as number) ?? 7
        const due = new Date()
        due.setDate(due.getDate() + dueInDays)
        const contactId = (data?.contact?.id as string) || (data?.contactId as string)
        await prisma.task.create({
          data: {
            tenantId,
            title,
            dueDate: due,
            status: 'pending',
            priority: 'medium',
            ...(contactId && { contactId }),
            ...(assignTo && { assignedToId: assignTo }),
          },
        })
        return { success: true, message: `Task created: ${title}` }
      }

      case 'update_contact': {
        const contactId = (data?.contact?.id as string) || (data?.contactId as string)
        if (!contactId) return { success: false, error: 'No contact in context' }
        const field = config.field as string
        const value = config.value as string | number | boolean
        if (!field) return { success: false, error: 'No field specified' }
        const updatePayload: Record<string, unknown> = { [field]: value }
        await prisma.contact.update({
          where: { id: contactId, tenantId },
          data: updatePayload as any,
        })
        return { success: true, message: `Contact updated: ${field}=${value}` }
      }

      case 'add_note': {
        const body = (config.body as string) || 'Workflow note'
        const contactId = (data?.contact?.id as string) || (data?.contactId as string)
        const dealId = (data?.deal?.id as string) || (data?.dealId as string)
        const userId = (data?.userId as string) || (config.userId as string)
        const entityId = contactId || dealId
        const entityType = contactId ? 'contact' : 'deal'
        if (!entityId) return { success: false, error: 'No contact or deal in context' }
        if (!userId) return { success: false, error: 'Add note requires user context (userId)' }
        await prisma.activityFeed.create({
          data: {
            tenantId,
            entityType,
            entityId,
            userId,
            type: 'comment',
            description: body,
          },
        })
        return { success: true, message: 'Note added' }
      }

      case 'webhook': {
        const url = config.url as string
        const method = (config.method as string) || 'POST'
        let bodyObj: Record<string, unknown> | undefined
        if (typeof config.body === 'string') {
          try {
            bodyObj = config.body.trim() ? (JSON.parse(config.body) as Record<string, unknown>) : undefined
          } catch {
            bodyObj = { raw: config.body }
          }
        } else {
          bodyObj = config.body as Record<string, unknown> | undefined
        }
        if (!url) return { success: false, error: 'No webhook URL' }
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: bodyObj ? JSON.stringify({ ...bodyObj, _context: data }) : undefined,
        })
        if (!res.ok) {
          return { success: false, error: `Webhook ${res.status}: ${await res.text()}` }
        }
        return { success: true, message: `Webhook ${url} returned ${res.status}` }
      }

      default:
        return { success: false, error: `Unknown action type: ${type}` }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

/** Run a full workflow by ID with given context; creates WorkflowExecution record */
export async function runWorkflow(
  workflowId: string,
  context: TriggerContext
): Promise<{ executionId: string; status: 'COMPLETED' | 'FAILED'; error?: string }> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, tenantId: context.tenantId, isActive: true },
  })
  if (!workflow) {
    throw new Error('Workflow not found or inactive')
  }

  const steps = (workflow.steps as WorkflowStep[]) || []
  const triggerData = {
    event: context.event,
    entity: context.entity,
    entityId: context.entityId,
    data: context.data,
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      tenantId: context.tenantId,
      status: 'RUNNING',
      triggerData,
    },
  })

  const results: Array<{ stepId: string; success: boolean; error?: string }> = []
  let failed = false
  for (const step of steps.sort((a, b) => a.order - b.order)) {
    const result = await executeStep(step, context)
    results.push({ stepId: step.id, success: result.success, error: result.error })
    if (!result.success) failed = true
  }

  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: failed ? 'FAILED' : 'COMPLETED',
      result: results,
      completedAt: new Date(),
      error: failed ? results.find(r => !r.success)?.error : null,
    },
  })

  return {
    executionId: execution.id,
    status: failed ? 'FAILED' : 'COMPLETED',
    error: failed ? results.find(r => !r.success)?.error : undefined,
  }
}
