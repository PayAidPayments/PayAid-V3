/**
 * Draft-first CRM follow-up tasks from voice post-call objection tags.
 */

import type { PrismaClient } from '@prisma/client'

export type FollowUpTaskDraft = {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueInDays: number
}

const OBJECTION_TASK_MAP: Record<string, FollowUpTaskDraft> = {
  escalation_request: {
    title: 'Voice escalation follow-up',
    description: 'Caller requested supervisor or manager during voice session.',
    priority: 'high',
    dueInDays: 1,
  },
  callback_requested: {
    title: 'Voice callback requested',
    description: 'Caller asked for a callback during voice session.',
    priority: 'medium',
    dueInDays: 1,
  },
  price_objection: {
    title: 'Address pricing objection',
    description: 'Caller raised price or cost concerns on voice call.',
    priority: 'medium',
    dueInDays: 2,
  },
  payment_objection: {
    title: 'Payment objection follow-up',
    description: 'Caller indicated payment difficulty on voice call.',
    priority: 'high',
    dueInDays: 1,
  },
  not_interested: {
    title: 'Review not-interested voice call',
    description: 'Caller expressed disinterest — verify DND and nurture path.',
    priority: 'low',
    dueInDays: 7,
  },
  wrong_number: {
    title: 'Verify wrong-number voice lead',
    description: 'Caller reported wrong number — clean up contact record.',
    priority: 'low',
    dueInDays: 3,
  },
}

export function buildFollowUpTaskDrafts(objectionTags: string[]): FollowUpTaskDraft[] {
  const seen = new Set<string>()
  const drafts: FollowUpTaskDraft[] = []
  for (const tag of objectionTags) {
    if (seen.has(tag)) continue
    const draft = OBJECTION_TASK_MAP[tag]
    if (draft) {
      seen.add(tag)
      drafts.push(draft)
    }
  }
  return drafts
}

export async function createVoiceFollowUpTasks(input: {
  prisma: PrismaClient
  tenantId: string
  contactId: string
  objectionTags: string[]
  agentName?: string | null
  sessionId?: string
  callId?: string
}): Promise<{ taskIds: string[]; titles: string[] }> {
  const drafts = buildFollowUpTaskDrafts(input.objectionTags)
  if (!drafts.length) return { taskIds: [], titles: [] }

  const context = [
    input.agentName ? `Agent: ${input.agentName}` : null,
    input.sessionId ? `Session: ${input.sessionId}` : null,
    input.callId ? `Call: ${input.callId}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const taskIds: string[] = []
  const titles: string[] = []

  for (const draft of drafts) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + draft.dueInDays)
    const description = context ? `${draft.description} (${context})` : draft.description

    const task = await input.prisma.task.create({
      data: {
        tenantId: input.tenantId,
        contactId: input.contactId,
        title: draft.title.slice(0, 200),
        description: description.slice(0, 2000),
        priority: draft.priority,
        status: 'pending',
        dueDate,
        module: 'crm',
      },
    })
    taskIds.push(task.id)
    titles.push(task.title)
  }

  return { taskIds, titles }
}
