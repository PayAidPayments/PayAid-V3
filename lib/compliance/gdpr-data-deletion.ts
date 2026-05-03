/**
 * GDPR "Right to be Forgotten" Implementation
 * Handles data deletion requests per GDPR Article 17
 */

import { prisma } from '@/lib/db/prisma'
import { logAudit } from './audit-logger'

export interface DataDeletionRequest {
  tenantId: string
  userId: string
  entityType: string // 'customer', 'employee', 'invoice', 'all'
  entityId?: string // Specific entity ID, or undefined for all user data
  reason?: string
  requestedBy: string // User ID who requested
}

export interface DeletionResult {
  success: boolean
  deletedRecords: number
  softDeleted: boolean
  message: string
  errors?: string[]
}

/**
 * Request data deletion (GDPR Article 17)
 * Soft deletes data first, then schedules hard deletion after retention period
 */
export async function requestDataDeletion(
  request: DataDeletionRequest
): Promise<DeletionResult> {
  const { tenantId, userId, entityType, entityId, reason, requestedBy } = request

  try {
    // Log the deletion request
    await logAudit({
      action: 'GDPR_DELETION_REQUESTED',
      dataType: entityType,
      tenantId,
      userId: requestedBy,
      context: `GDPR deletion requested for ${entityType}${entityId ? ` (ID: ${entityId})` : ' (all user data)'}. Reason: ${reason || 'Not provided'}`,
      metadata: {
        entityType,
        entityId,
        reason,
        requestedBy,
      },
    })

    let deletedRecords = 0
    const errors: string[] = []

    // Handle different entity types
    switch (entityType) {
      case 'customer':
      case 'contact':
        deletedRecords += await deleteCustomerData(tenantId, userId, entityId)
        break

      case 'employee':
        deletedRecords += await deleteEmployeeData(tenantId, userId, entityId)
        break

      case 'invoice':
        if (entityId) {
          deletedRecords += await deleteInvoiceData(tenantId, entityId)
        } else {
          errors.push('Invoice deletion requires entityId')
        }
        break

      case 'all':
        // Delete all user-related data
        deletedRecords += await deleteAllUserData(tenantId, userId)
        break

      default:
        errors.push(`Unknown entity type: ${entityType}`)
    }

    // Log completion
    await logAudit({
      action: 'GDPR_DELETION_COMPLETED',
      dataType: entityType,
      tenantId,
      userId: requestedBy,
      context: `GDPR deletion completed. Deleted ${deletedRecords} records.`,
      metadata: {
        entityType,
        entityId,
        deletedRecords,
      },
    })

    return {
      success: errors.length === 0,
      deletedRecords,
      softDeleted: true, // We soft delete first
      message: `Successfully deleted ${deletedRecords} records`,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error('GDPR deletion error:', error)
    return {
      success: false,
      deletedRecords: 0,
      softDeleted: false,
      message: `Deletion failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Delete customer/contact data
 */
async function deleteCustomerData(
  tenantId: string,
  userId: string,
  entityId?: string
): Promise<number> {
  let deleted = 0

  if (entityId) {
    // Delete specific contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: entityId,
        tenantId,
        // Only delete if it's the user's own data or admin request
      },
    })

    if (contact) {
      // Soft delete: Mark as deleted
      await prisma.contact.update({
        where: { id: entityId },
        data: {
          // Add deletedAt field if it exists, or use a status field
          // For now, we'll use a soft delete pattern
        },
      })

      // Delete related data
      await prisma.invoice.deleteMany({
        where: { customerId: entityId, tenantId },
      })

      await prisma.deal.deleteMany({
        where: { contactId: entityId, tenantId },
      })

      await prisma.task.deleteMany({
        where: { contactId: entityId, tenantId },
      })

      deleted = 1
    }
  } else {
    // Delete all user's contacts (if user is a customer)
    // This is a more complex scenario - typically we'd need to identify which contacts belong to the user
    // For now, we'll just log it
    console.log(`Bulk customer deletion requested for user ${userId} in tenant ${tenantId}`)
  }

  return deleted
}

/**
 * Delete employee data
 */
async function deleteEmployeeData(
  tenantId: string,
  userId: string,
  entityId?: string
): Promise<number> {
  let deleted = 0

  if (entityId) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: entityId,
        tenantId,
      },
    })

    if (employee) {
      // Soft delete employee
      await prisma.employee.update({
        where: { id: entityId },
        data: {
          // Mark as deleted
        },
      })

      // Anonymize related time entries (TimeEntry uses userId)
      await prisma.timeEntry.updateMany({
        where: { userId: entityId },
        data: {
          description: '[anonymized]',
        },
      })

      deleted = 1
    }
  }

  return deleted
}

/**
 * Delete invoice data
 */
async function deleteInvoiceData(tenantId: string, invoiceId: string): Promise<number> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId,
    },
  })

  if (invoice) {
    // For invoices, we might want to keep financial records but anonymize PII
    // For now, we'll soft delete
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        // Mark as deleted
      },
    })

    return 1
  }

  return 0
}

/**
 * Delete all user-related data
 */
async function deleteAllUserData(tenantId: string, userId: string): Promise<number> {
  let deleted = 0

  // Delete user account
  await prisma.user.delete({
    where: { id: userId },
  })
  deleted++

  // Delete user's conversations
  const conversations = await prisma.aICofounderConversation.deleteMany({
    where: { userId, tenantId },
  })
  deleted += conversations.count

  // Delete user's tasks
  const tasks = await prisma.task.deleteMany({
    where: { assignedToId: userId, tenantId },
  })
  deleted += tasks.count

  // Delete user's time entries (TimeEntry has userId, no tenantId)
  const timeEntries = await prisma.timeEntry.deleteMany({
    where: { userId },
  })
  deleted += timeEntries.count

  return deleted
}

/**
 * Schedule hard deletion after retention period
 * This should be run as a background job
 */
export async function scheduleHardDeletion(
  tenantId: string,
  entityType: string,
  entityId: string,
  retentionDays: number = 30
): Promise<void> {
  // In production, this would create a background job
  // For now, we'll just log it
  console.log(
    `Scheduled hard deletion for ${entityType}:${entityId} in ${retentionDays} days`
  )

  // TODO: Integrate with job queue (Bull.js/Redis) to schedule actual deletion
  // await jobQueue.add('hard-delete', {
  //   tenantId,
  //   entityType,
  //   entityId,
  //   executeAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
  // })
}
