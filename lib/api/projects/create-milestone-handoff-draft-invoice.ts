import type { Prisma } from '@prisma/client'
import { calculateGST } from '@/lib/invoicing/gst'
import { resolveMilestoneHandoffGstOpts } from '@/lib/api/projects/milestone-handoff-gst-resolve'

type DraftDb = Pick<Prisma.TransactionClient, 'invoice' | 'timeEntry' | 'tenant'>

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

type LineItem = {
  description: string
  quantity: number
  rate: number
  amount: number
  gstRate: number
  category: string
}

/**
 * Approved billable time on tasks linked to this milestone, not yet on an invoice.
 */
async function loadMilestoneTimeRollup(
  db: DraftDb,
  projectId: string,
  milestoneId: string,
  lineGstRate: number
): Promise<{
  lineItems: LineItem[]
  subtotal: number
  timeEntryIds: string[]
  totalHours: number
}> {
  const entries = await db.timeEntry.findMany({
    where: {
      projectId,
      billable: true,
      invoicedAt: null,
      invoiceId: null,
      task: { milestoneId },
    },
    select: {
      id: true,
      hours: true,
      billingRate: true,
      description: true,
      taskId: true,
      task: { select: { name: true } },
      user: { select: { name: true } },
      approvalStatus: true,
    },
  })

  const approved = entries.filter((e) => (e.approvalStatus || '').toUpperCase() === 'APPROVED')

  type Bucket = { taskLabel: string; hours: number; rate: number; entryIds: string[] }
  const buckets = new Map<string, Bucket>()

  for (const e of approved) {
    const h = Number(e.hours)
    if (!Number.isFinite(h) || h <= 0) continue
    const rate = Number(e.billingRate ?? 0)
    if (!Number.isFinite(rate) || rate < 0) continue

    const taskLabel = e.task?.name?.trim() || 'Time (no task)'
    const key = `${e.taskId ?? 'none'}::${rate.toFixed(4)}`
    const prev = buckets.get(key)
    if (prev) {
      prev.hours = round2(prev.hours + h)
      prev.entryIds.push(e.id)
    } else {
      buckets.set(key, { taskLabel, hours: round2(h), rate, entryIds: [e.id] })
    }
  }

  const lineItems: LineItem[] = []
  let subtotal = 0
  const timeEntryIds: string[] = []
  let totalHours = 0

  for (const b of buckets.values()) {
    const amount = round2(b.hours * b.rate)
    subtotal = round2(subtotal + amount)
    totalHours = round2(totalHours + b.hours)
    timeEntryIds.push(...b.entryIds)
    const rateLabel = b.rate > 0 ? ` @ ${b.rate}` : ''
    lineItems.push({
      description: `${b.taskLabel} — ${b.hours}h${rateLabel} (milestone time)`,
      quantity: b.hours,
      rate: b.rate,
      amount,
      gstRate: lineGstRate,
      category: 'standard',
    })
  }

  return { lineItems, subtotal, timeEntryIds, totalHours }
}

/** Draft invoice for Projects → milestone handoff; line items from milestone-scoped approved time when possible. */
export async function createMilestoneHandoffDraftInvoice(
  db: DraftDb,
  input: {
    tenantId: string
    milestoneId: string
    milestoneName: string
    projectId: string
    projectName: string
    trigger: 'ON_COMPLETE' | 'ON_APPROVE'
    project: {
      currency?: string | null
      clientId?: string | null
      billingIsInterState?: boolean | null
      client?: {
        id: string
        name: string | null
        email: string | null
        phone?: string | null
      } | null
    }
  }
): Promise<{ id: string; invoiceNumber: string }> {
  const tenantRow = await db.tenant.findUnique({
    where: { id: input.tenantId },
    select: { invoiceSettings: true },
  })
  const gstOpts = resolveMilestoneHandoffGstOpts(tenantRow?.invoiceSettings, input.project.billingIsInterState)

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const invoiceNumber = `INV-PMS-${suffix}`

  const rollup = await loadMilestoneTimeRollup(db, input.projectId, input.milestoneId, gstOpts.gstRatePercent)

  let lineItems: LineItem[]
  let subtotal: number
  let notesExtra: string

  if (rollup.lineItems.length > 0) {
    lineItems = rollup.lineItems
    subtotal = rollup.subtotal
    notesExtra = ` Rolled up ${rollup.totalHours}h from ${rollup.timeEntryIds.length} approved billable entr${rollup.timeEntryIds.length === 1 ? 'y' : 'ies'} on tasks linked to this milestone.`
  } else {
    lineItems = [
      {
        description: `${input.milestoneName} — ${input.projectName} (${input.trigger.replace(/_/g, ' ').toLowerCase()})`,
        quantity: 1,
        rate: 0,
        amount: 0,
        gstRate: 0,
        category: 'standard',
      },
    ]
    subtotal = 0
    notesExtra =
      ' No milestone-scoped approved billable time with billing rates — placeholder line; add lines in Finance or link tasks to this milestone and set time billing rates.'
  }

  const client = input.project.client
  const isInterState = gstOpts.isInterState

  let tax = 0
  let total = subtotal
  let gstRateHeader: number | undefined
  let gstAmount: number | undefined
  let cgst: number | undefined
  let sgst: number | undefined
  let igst: number | undefined
  let taxBreakdownJson: {
    breakdownByRate: Record<string, number>
    cgst?: number
    sgst?: number
    igst?: number
    totalTax: number
  } = { breakdownByRate: {}, totalTax: 0 }

  if (subtotal > 0) {
    const gst = calculateGST(subtotal, gstOpts.gstRatePercent, isInterState)
    tax = round2(gst.totalGST)
    total = round2(gst.totalAmount)
    gstRateHeader = gstOpts.gstRatePercent
    gstAmount = tax
    cgst = round2(gst.cgst)
    sgst = round2(gst.sgst)
    igst = round2(gst.igst)
    taxBreakdownJson = {
      breakdownByRate: { [String(gstOpts.gstRatePercent)]: tax },
      cgst,
      sgst,
      igst,
      totalTax: tax,
    }
  }

  const inv = await db.invoice.create({
    data: {
      invoiceNumber,
      tenantId: input.tenantId,
      status: 'draft',
      subtotal,
      tax,
      total,
      ...(gstRateHeader != null && { gstRate: gstRateHeader }),
      ...(gstAmount != null && { gstAmount }),
      ...(cgst != null && { cgst }),
      ...(sgst != null && { sgst }),
      ...(igst != null && { igst }),
      isInterState,
      customerId: input.project.clientId ?? null,
      customerName: client?.name ?? null,
      customerEmail: client?.email ?? null,
      customerPhone: client?.phone ?? null,
      notes: `Draft from Projects milestone (${input.trigger}). Milestone ${input.milestoneId}. Project ${input.projectId}.${notesExtra}`,
      currency: input.project.currency || 'INR',
      invoiceDate: new Date(),
      items: {
        lineItems,
        taxBreakdown: taxBreakdownJson,
        projectsMilestoneHandoff: {
          milestoneId: input.milestoneId,
          projectId: input.projectId,
          trigger: input.trigger,
          timeEntryIds: rollup.timeEntryIds,
          hoursRollup: rollup.totalHours,
          gstRatePercent: gstOpts.gstRatePercent,
          isInterState: gstOpts.isInterState,
        },
      } as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, invoiceNumber: true },
  })

  return inv
}
