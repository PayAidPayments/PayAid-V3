/**
 * Task reminder hook — triggers WhatsApp/Email push for a task.
 * Currently calls POST /api/tasks/remind/[id] (updates reminderSentAt).
 * Future: wire to WhatsApp Business API / email provider for due-1d and overdue reminders.
 */
export { useRemindTask as useTaskReminder } from './use-api'
