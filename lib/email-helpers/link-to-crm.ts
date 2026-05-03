/**
 * Email to CRM Integration
 * Automatically links emails to contacts in CRM
 */

import { prisma } from '@/lib/db/prisma'

export interface EmailReceivedEvent {
  accountId: string
  fromEmail: string
  fromName?: string
  subject: string
  body?: string
  htmlBody?: string
  receivedAt: Date
  messageId: string
}

/**
 * Link received email to CRM contact
 * Creates contact if doesn't exist
 */
export async function linkEmailToCRM(
  tenantId: string,
  emailEvent: EmailReceivedEvent
): Promise<{ contactId: string | null; created: boolean }> {
  try {
    // Extract email domain
    const emailDomain = emailEvent.fromEmail.split('@')[1]

    // Try to find existing contact by email
    let contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        email: emailEvent.fromEmail,
      },
    })

    // If not found, try to find by domain (company)
    if (!contact && emailDomain) {
      const contactsWithDomain = await prisma.contact.findMany({
        where: {
          tenantId,
          email: {
            contains: `@${emailDomain}`,
          },
        },
        take: 1,
      })

      if (contactsWithDomain.length > 0) {
        contact = contactsWithDomain[0]
      }
    }

    // Create contact if not found
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId,
          name: emailEvent.fromName || emailEvent.fromEmail.split('@')[0],
          email: emailEvent.fromEmail,
          type: 'lead',
          status: 'active',
          source: 'email',
          lastContactedAt: emailEvent.receivedAt,
        },
      })

      return { contactId: contact.id, created: true }
    }

    // Update last contacted date
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        lastContactedAt: emailEvent.receivedAt,
      },
    })

    return { contactId: contact.id, created: false }
  } catch (error) {
    console.error('Link email to CRM error:', error)
    return { contactId: null, created: false }
  }
}

/**
 * Update email message with contact link
 */
export async function updateEmailMessageWithContact(
  messageId: string,
  contactId: string
): Promise<void> {
  try {
    await prisma.emailMessage.update({
      where: { id: messageId },
      data: { contactId },
    })
  } catch (error) {
    console.error('Update email message with contact error:', error)
  }
}

/**
 * Extract company name from email domain
 */
export function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1]
  if (!domain) return 'Unknown Company'

  // Remove common TLDs and format
  const companyName = domain
    .replace(/\.(com|in|co|io|org|net)$/i, '')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return companyName || domain
}
