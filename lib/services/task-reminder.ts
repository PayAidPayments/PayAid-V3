/**
 * Task reminder delivery — WhatsApp / Email wiring point.
 * Called by POST /api/tasks/remind/[id] after updating reminderSentAt.
 * When WhatsApp Business API or email provider is configured, call them here.
 */

export interface TaskReminderPayload {
  taskId: string
  title: string
  dueDate: Date | null
  contactPhone?: string | null
  contactEmail?: string | null
  assigneeEmail?: string | null
}

export async function sendTaskReminder(payload: TaskReminderPayload): Promise<{
  whatsappSent?: boolean
  emailSent?: boolean
}> {
  const result: { whatsappSent?: boolean; emailSent?: boolean } = {}

  // TODO: Wire to WhatsApp Business API when available
  // if (payload.contactPhone && process.env.WHATSAPP_ENABLED === 'true') {
  //   await sendWhatsAppTaskReminder(payload.contactPhone, payload.title, payload.dueDate)
  //   result.whatsappSent = true
  // }

  // TODO: Wire to Resend / SendGrid / nodemailer when available
  // if (payload.assigneeEmail || payload.contactEmail) {
  //   const to = payload.assigneeEmail || payload.contactEmail
  //   await sendEmailTaskReminder(to, payload.title, payload.dueDate)
  //   result.emailSent = true
  // }

  return result
}
