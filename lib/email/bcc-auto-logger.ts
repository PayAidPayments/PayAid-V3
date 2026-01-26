/**
 * BCC Auto-Logging Service
 * Automatically logs emails sent to crm@payaid.store (or configured BCC email)
 * This allows users to BCC the CRM email to auto-log emails to contact activity
 */

import { prisma } from '@/lib/db/prisma'
import { linkEmailToCRM, updateEmailMessageWithContact } from '@/lib/email-helpers/link-to-crm'
import { logEmailActivity } from '@/lib/email/sync-service'

const BCC_EMAIL = process.env.CRM_BCC_EMAIL || 'crm@payaid.store'

/**
 * Check if email should be auto-logged via BCC
 */
export function shouldAutoLogEmail(toEmails: string[], ccEmails: string[], bccEmails: string[]): boolean {
  const allRecipients = [...toEmails, ...ccEmails, ...bccEmails]
  return allRecipients.some((email) => email.toLowerCase() === BCC_EMAIL.toLowerCase())
}

/**
 * Process BCC auto-logging for an email
 * This is called when an email is received in the BCC inbox
 */
export async function processBCCAutoLog(
  tenantId: string,
  emailData: {
    fromEmail: string
    fromName?: string
    toEmails: string[]
    ccEmails?: string[]
    bccEmails?: string[]
    subject: string
    body: string
    htmlBody?: string
    receivedAt: Date
    messageId: string
  }
): Promise<{ contactId: string | null; logged: boolean }> {
  try {
    // Remove BCC email from recipient lists (it's just for logging)
    const filteredTo = emailData.toEmails.filter((e) => e.toLowerCase() !== BCC_EMAIL.toLowerCase())
    const filteredCc = (emailData.ccEmails || []).filter((e) => e.toLowerCase() !== BCC_EMAIL.toLowerCase())
    const filteredBcc = (emailData.bccEmails || []).filter((e) => e.toLowerCase() !== BCC_EMAIL.toLowerCase())

    // Link email to contact
    const linkResult = await linkEmailToCRM(tenantId, {
      accountId: '', // Not needed for BCC logging
      fromEmail: emailData.fromEmail,
      fromName: emailData.fromName,
      subject: emailData.subject,
      body: emailData.body,
      htmlBody: emailData.htmlBody,
      receivedAt: emailData.receivedAt,
      messageId: emailData.messageId,
    })

    if (linkResult.contactId) {
      // Log as outbound email activity (since it was sent by the user)
      const parsedEmail = {
        fromEmail: emailData.fromEmail,
        fromName: emailData.fromName,
        toEmails: filteredTo,
        subject: emailData.subject,
        body: emailData.body,
        receivedAt: emailData.receivedAt,
        messageId: emailData.messageId,
      }

      await logEmailActivity(tenantId, linkResult.contactId, parsedEmail, 'outbound')

      return { contactId: linkResult.contactId, logged: true }
    }

    return { contactId: null, logged: false }
  } catch (error) {
    console.error('BCC auto-logging error:', error)
    return { contactId: null, logged: false }
  }
}

/**
 * Generate BCC email address for a tenant/user
 * Format: crm+{tenantId}@payaid.store or use configured email
 */
export function generateBCCEmail(tenantId?: string): string {
  if (tenantId) {
    // Use tenant-specific BCC if configured
    return `crm+${tenantId}@payaid.store`
  }
  return BCC_EMAIL
}

/**
 * Extract tenant ID from BCC email address
 */
export function extractTenantIdFromBCCEmail(email: string): string | null {
  const match = email.match(/crm\+([^@]+)@/)
  return match ? match[1] : null
}
