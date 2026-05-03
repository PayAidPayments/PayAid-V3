/**
 * Workflow builder types: triggers and actions.
 * Used by UI and API; engine uses these to execute steps.
 */

export const TRIGGER_TYPES = ['EVENT', 'SCHEDULE', 'MANUAL'] as const
export type TriggerType = (typeof TRIGGER_TYPES)[number]

/** Event-based triggers: when something happens in the app */
export const WORKFLOW_EVENTS = [
  { value: 'contact.created', label: 'New contact created' },
  { value: 'contact.updated', label: 'Contact updated' },
  { value: 'deal.created', label: 'New deal created' },
  { value: 'deal.stage_changed', label: 'Deal stage changed' },
  { value: 'lead.created', label: 'New lead created' },
  { value: 'form.submitted', label: 'Form submitted' },
  { value: 'invoice.created', label: 'Invoice created' },
  { value: 'invoice.overdue', label: 'Invoice overdue' },
  { value: 'task.created', label: 'Task created' },
  { value: 'order.created', label: 'Order created' },
] as const

export type WorkflowEventValue = (typeof WORKFLOW_EVENTS)[number]['value']

/** Action step types the engine can execute */
export const ACTION_TYPES = [
  { value: 'send_email', label: 'Send email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'create_task', label: 'Create task' },
  { value: 'update_contact', label: 'Update contact' },
  { value: 'add_note', label: 'Add note to contact/deal' },
  { value: 'webhook', label: 'Call webhook' },
] as const

export type ActionTypeValue = (typeof ACTION_TYPES)[number]['value']

export interface WorkflowStep {
  id: string
  type: ActionTypeValue
  name?: string
  config: Record<string, unknown>
  order: number
}

export interface WorkflowTriggerConfig {
  type: TriggerType
  event?: WorkflowEventValue
  schedule?: string // cron expression, e.g. "0 9 * * 1-5" for 9 AM weekdays
}

export interface WorkflowPayload {
  name: string
  description?: string
  triggerType: TriggerType
  triggerEvent?: string
  triggerSchedule?: string
  isActive?: boolean
  steps: WorkflowStep[]
}

export interface WorkflowRecord {
  id: string
  tenantId: string
  name: string
  description: string | null
  triggerType: string
  triggerEvent: string | null
  triggerSchedule: string | null
  isActive: boolean
  steps: WorkflowStep[]
  createdAt: Date
  updatedAt: Date
}
