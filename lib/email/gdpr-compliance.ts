/**
 * GDPR Compliance for Email Sync
 * Handles permission-based email syncing and data retention
 */

import { prisma } from '@/lib/db/prisma'

export interface GDPRConsent {
  contactId: string
  emailSyncEnabled: boolean
  emailTrackingEnabled: boolean
  consentDate: Date
  consentMethod: 'explicit' | 'implicit' | 'opt-in'
}

/**
 * Check if email sync is allowed for a contact
 */
export async function isEmailSyncAllowed(
  tenantId: string,
  contactEmail: string
): Promise<boolean> {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        email: contactEmail,
      },
      select: {
        id: true,
        emailSyncConsent: true,
        emailTrackingConsent: true,
      },
    })

    if (!contact) {
      // New contact - default to allowed (implicit consent)
      return true
    }

    // Check if explicit opt-out exists
    if (contact.emailSyncConsent === false) {
      return false
    }

    // Default to allowed (implicit consent)
    return true
  } catch (error) {
    console.error('Error checking email sync permission:', error)
    // Default to allowed on error
    return true
  }
}

/**
 * Record GDPR consent for a contact
 */
export async function recordGDPRConsent(
  tenantId: string,
  contactId: string,
  consent: {
    emailSyncEnabled: boolean
    emailTrackingEnabled: boolean
    consentMethod: 'explicit' | 'implicit' | 'opt-in'
  }
): Promise<void> {
  try {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        emailSyncConsent: consent.emailSyncEnabled,
        emailTrackingConsent: consent.emailTrackingEnabled,
        emailConsentDate: new Date(),
        emailConsentMethod: consent.consentMethod,
      },
    })
  } catch (error) {
    console.error('Error recording GDPR consent:', error)
    throw error
  }
}

/**
 * Remove email data for a contact (right to be forgotten)
 */
export async function removeContactEmailData(
  tenantId: string,
  contactId: string
): Promise<void> {
  try {
    // Delete email messages linked to contact
    await prisma.emailMessage.updateMany({
      where: {
        contactId,
        account: {
          tenantId,
        },
      },
      data: {
        contactId: null, // Unlink instead of delete (preserve email history)
        body: '[REDACTED - GDPR Request]',
        htmlBody: '[REDACTED - GDPR Request]',
      },
    })

    // Delete interactions
    await prisma.interaction.deleteMany({
      where: {
        contactId,
        tenantId,
        type: 'email',
      },
    })

    // Update contact consent
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        emailSyncConsent: false,
        emailTrackingConsent: false,
        emailConsentDate: null,
      },
    })
  } catch (error) {
    console.error('Error removing contact email data:', error)
    throw error
  }
}

/**
 * Get contacts that need consent renewal (older than 2 years)
 */
export async function getContactsNeedingConsentRenewal(
  tenantId: string
): Promise<Array<{ id: string; email: string; name: string; consentDate: Date | null }>> {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      emailSyncConsent: true,
      OR: [
        { emailConsentDate: null },
        { emailConsentDate: { lt: twoYearsAgo } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailConsentDate: true,
    },
    take: 100, // Limit to prevent large queries
  })

  return contacts
}

/**
 * Check if email tracking is allowed for a contact
 */
export async function isEmailTrackingAllowed(
  tenantId: string,
  contactEmail: string
): Promise<boolean> {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        email: contactEmail,
      },
      select: {
        emailTrackingConsent: true,
      },
    })

    if (!contact) {
      // New contact - default to allowed (implicit consent)
      return true
    }

    // Check if explicit opt-out exists
    if (contact.emailTrackingConsent === false) {
      return false
    }

    // Default to allowed (implicit consent)
    return true
  } catch (error) {
    console.error('Error checking email tracking permission:', error)
    // Default to allowed on error
    return true
  }
}
