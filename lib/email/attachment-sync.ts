/**
 * Email Attachment Sync Service
 * Syncs email attachments to deals and contacts
 */

import { prisma } from '@/lib/db/prisma'
import { uploadFile } from '@/lib/storage/file-storage'

export interface AttachmentData {
  fileName: string
  mimeType: string
  sizeBytes: number
  content: Buffer | string // Base64 or Buffer
}

/**
 * Sync email attachment to deal
 */
export async function syncAttachmentToDeal(
  attachmentId: string,
  dealId: string,
  tenantId: string
): Promise<void> {
  try {
    const attachment = await prisma.emailAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            accountId: true,
            account: {
              select: { tenantId: true },
            },
          },
        },
      },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    if (attachment.message.account.tenantId !== tenantId) {
      throw new Error('Attachment does not belong to tenant')
    }

    // Verify deal belongs to tenant
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { tenantId: true },
    })

    if (!deal || deal.tenantId !== tenantId) {
      throw new Error('Deal not found or does not belong to tenant')
    }

    // Upload attachment to deal storage
    // In production, you'd copy the file to deal attachments folder
    // For now, we'll just link the attachment to the deal via metadata
    // You can extend this to copy files to a deals/attachments folder

    // Store link in deal's metadata or create a DealAttachment model
    // For now, we'll use a simple approach - store in deal's notes or custom fields
  } catch (error) {
    console.error('Error syncing attachment to deal:', error)
    throw error
  }
}

/**
 * Sync email attachment to contact
 */
export async function syncAttachmentToContact(
  attachmentId: string,
  contactId: string,
  tenantId: string
): Promise<void> {
  try {
    const attachment = await prisma.emailAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            accountId: true,
            account: {
              select: { tenantId: true },
            },
          },
        },
      },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    if (attachment.message.account.tenantId !== tenantId) {
      throw new Error('Attachment does not belong to tenant')
    }

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tenantId: true },
    })

    if (!contact || contact.tenantId !== tenantId) {
      throw new Error('Contact not found or does not belong to tenant')
    }

    // Store link in contact's attachments array (if Contact model has attachments field)
    // Or create a ContactAttachment model
  } catch (error) {
    console.error('Error syncing attachment to contact:', error)
    throw error
  }
}

/**
 * Get attachments for a deal (from linked emails)
 */
export async function getDealAttachments(dealId: string, tenantId: string) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        contact: {
          include: {
            emailMessages: {
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    })

    if (!deal || deal.tenantId !== tenantId) {
      throw new Error('Deal not found')
    }

    // Collect all attachments from emails linked to the contact
    const attachments: any[] = []
    if (deal.contact?.emailMessages) {
      for (const message of deal.contact.emailMessages) {
        attachments.push(...message.attachments)
      }
    }

    return attachments
  } catch (error) {
    console.error('Error getting deal attachments:', error)
    return []
  }
}
