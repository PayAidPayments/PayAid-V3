import type { Prisma } from '@prisma/client'

/** Used in `AuditLog.changedBy` when no user (payment gateway / webhook). */
export const AUDIT_ACTOR_INVOICE_TIME_SYNC_SYSTEM = 'system:invoice-time-sync'

function parseInvoiceItemsJson(items: unknown): Record<string, unknown> | null {
  if (items == null) return null
  if (typeof items === 'string') {
    try {
      return JSON.parse(items) as Record<string, unknown>
    } catch {
      return null
    }
  }
  if (typeof items === 'object' && !Array.isArray(items)) {
    return items as Record<string, unknown>
  }
  return null
}

/** Time entry IDs stored when creating a milestone handoff draft (`Invoice.items.projectsMilestoneHandoff`). */
export function extractHandoffTimeEntryIdsFromInvoiceItems(items: unknown): string[] {
  const o = parseInvoiceItemsJson(items)
  if (!o) return []
  const handoff = o.projectsMilestoneHandoff as { timeEntryIds?: unknown } | undefined
  if (!handoff || !Array.isArray(handoff.timeEntryIds)) return []
  return handoff.timeEntryIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

const APPROVAL_OK = ['APPROVED', 'approved', 'Approved']

/**
 * When an invoice leaves draft (sent / paid / overdue), attach approved billable time rows that were rolled into the handoff draft.
 */
export async function markHandoffTimeEntriesInvoicedForInvoice(
  tx: Prisma.TransactionClient,
  opts: {
    tenantId: string
    invoiceId: string
    itemsJson: unknown
    at: Date
    changedBy: string
  }
): Promise<number> {
  const ids = extractHandoffTimeEntryIdsFromInvoiceItems(opts.itemsJson)
  if (ids.length === 0) return 0

  const res = await tx.timeEntry.updateMany({
    where: {
      id: { in: ids },
      billable: true,
      project: { tenantId: opts.tenantId },
      invoicedAt: null,
      invoiceId: null,
      approvalStatus: { in: APPROVAL_OK },
    },
    data: {
      invoiceId: opts.invoiceId,
      invoicedAt: opts.at,
    },
  })

  if (res.count > 0) {
    await tx.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        entityType: 'invoice_time_entry_link',
        entityId: opts.invoiceId,
        changedBy: opts.changedBy,
        changeSummary: `Invoice issued: marked ${res.count} milestone handoff time entr${res.count === 1 ? 'y' : 'ies'} as invoiced`,
        afterSnapshot: {
          invoiceId: opts.invoiceId,
          timeEntryCount: res.count,
          timeEntryIdsSample: ids.slice(0, 40),
        },
      },
    })
  }

  return res.count
}

/** When an invoice is cancelled or returned to draft after being issued, clear time-entry links for this invoice. */
export async function clearTimeEntriesInvoiceLinkForInvoice(
  tx: Prisma.TransactionClient,
  opts: { tenantId: string; invoiceId: string }
): Promise<number> {
  const res = await tx.timeEntry.updateMany({
    where: {
      invoiceId: opts.invoiceId,
      project: { tenantId: opts.tenantId },
    },
    data: { invoiceId: null, invoicedAt: null },
  })
  return res.count
}

export function invoiceStatusRecognizesTimeBilling(status: string): boolean {
  return status === 'sent' || status === 'paid' || status === 'overdue'
}

/**
 * Call inside a transaction after persisting the new invoice `status`.
 * Uses `itemsJson` from **before** this request’s item edits when marking (handoff ids live on the prior snapshot).
 */
export async function syncHandoffTimeEntriesAfterInvoiceStatusChange(
  tx: Prisma.TransactionClient,
  opts: {
    tenantId: string
    invoiceId: string
    previousStatus: string
    nextStatus: string
    /** Invoice `items` JSON used to read `projectsMilestoneHandoff.timeEntryIds` (typically the row before update). */
    itemsJson: unknown
    /** Audit trail; omit or null to use {@link AUDIT_ACTOR_INVOICE_TIME_SYNC_SYSTEM}. */
    actorUserId?: string | null
  }
): Promise<void> {
  const changedBy = opts.actorUserId?.trim() || AUDIT_ACTOR_INVOICE_TIME_SYNC_SYSTEM
  const wasIssued = invoiceStatusRecognizesTimeBilling(opts.previousStatus)
  const nowIssued = invoiceStatusRecognizesTimeBilling(opts.nextStatus)

  if (!wasIssued && nowIssued) {
    await markHandoffTimeEntriesInvoicedForInvoice(tx, {
      tenantId: opts.tenantId,
      invoiceId: opts.invoiceId,
      itemsJson: opts.itemsJson,
      at: new Date(),
      changedBy,
    })
  }

  if (
    wasIssued &&
    !nowIssued &&
    (opts.nextStatus === 'draft' || opts.nextStatus === 'cancelled')
  ) {
    await clearTimeEntriesInvoiceLinkForInvoice(tx, {
      tenantId: opts.tenantId,
      invoiceId: opts.invoiceId,
      changedBy,
    })
  }
}
