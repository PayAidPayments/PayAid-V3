import { randomUUID } from 'node:crypto'
import {
  evaluateCustomerSpecialistEntitlement,
  type CustomerSpecialistCatalog,
} from '@/lib/ai/customer-specialists'
import { createCustomerFlowDraftId, persistCustomerFlowAudit } from './audit'
import type {
  CustomerFlowAuth,
  CustomerFlowDraftBundle,
  CustomerFlowResult,
  CustomerFlowStepResult,
} from './types'

export interface GstInvoiceLineItemInput {
  description: string
  hsn?: string
  quantity: number
  unitPriceInr: number
  gstRatePercent: number
}

export interface GstInvoiceDraftInput {
  customerName: string
  customerGstin?: string
  supplierStateCode?: string
  placeOfSupplyStateCode?: string
  lineItems: GstInvoiceLineItemInput[]
  customerId?: string
  notes?: string
  sessionId?: string
  /** When false, skip DB audit writes (unit/smoke). Default true. */
  persistAudit?: boolean
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function computeGst(params: {
  supplierStateCode: string
  placeOfSupplyStateCode: string
  lineItems: GstInvoiceLineItemInput[]
}) {
  const lines = params.lineItems.map((item, index) => {
    const qty = Number(item.quantity)
    const unit = Number(item.unitPriceInr)
    const rate = Number(item.gstRatePercent)
    const taxable = round2(qty * unit)
    const tax = round2((taxable * rate) / 100)
    return {
      lineNo: index + 1,
      description: item.description.trim(),
      hsn: item.hsn?.trim() || null,
      quantity: qty,
      unitPriceInr: unit,
      gstRatePercent: rate,
      taxableValueInr: taxable,
      taxAmountInr: tax,
    }
  })

  const taxableTotal = round2(lines.reduce((sum, line) => sum + line.taxableValueInr, 0))
  const taxTotal = round2(lines.reduce((sum, line) => sum + line.taxAmountInr, 0))
  const intraState =
    params.supplierStateCode.trim().toUpperCase() ===
    params.placeOfSupplyStateCode.trim().toUpperCase()

  const taxBreakup = intraState
    ? {
        supplyType: 'intra_state' as const,
        cgstInr: round2(taxTotal / 2),
        sgstInr: round2(taxTotal / 2),
        igstInr: 0,
      }
    : {
        supplyType: 'inter_state' as const,
        cgstInr: 0,
        sgstInr: 0,
        igstInr: taxTotal,
      }

  return {
    lines,
    taxableTotalInr: taxableTotal,
    taxTotalInr: taxTotal,
    grandTotalInr: round2(taxableTotal + taxTotal),
    ...taxBreakup,
  }
}

export async function runGstInvoiceDraftFlow(params: {
  catalog: CustomerSpecialistCatalog
  auth: CustomerFlowAuth
  input: GstInvoiceDraftInput
}): Promise<CustomerFlowResult> {
  const sessionId = params.input.sessionId?.trim() || `gst-invoice-draft-${randomUUID()}`
  const customerName = params.input.customerName.trim()
  if (!customerName) {
    return {
      allowed: false,
      reasonCode: 'VALIDATION_ERROR',
      reason: 'customerName is required',
      sessionId,
      auditIds: [],
      bundle: null,
    }
  }
  if (!Array.isArray(params.input.lineItems) || params.input.lineItems.length === 0) {
    return {
      allowed: false,
      reasonCode: 'VALIDATION_ERROR',
      reason: 'At least one line item is required',
      sessionId,
      auditIds: [],
      bundle: null,
    }
  }

  const decision = evaluateCustomerSpecialistEntitlement({
    catalog: params.catalog,
    agentSlug: 'finance-bookkeeper',
    context: {
      tenantId: params.auth.tenantId,
      userId: params.auth.userId,
      roles: params.auth.roles,
      licensedModules: params.auth.licensedModules,
      requestedCapability: 'draft',
      draftType: 'invoice_draft',
    },
  })

  const step: CustomerFlowStepResult = {
    agentSlug: 'finance-bookkeeper',
    decision,
    draftType: 'invoice_draft',
  }

  if (!decision.allowed) {
    const deniedBundle: CustomerFlowDraftBundle = {
      draftId: createCustomerFlowDraftId('gst-invoice-draft'),
      flow: 'gst-invoice-draft',
      status: 'draft',
      approvalStatus: 'denied',
      executable: false,
      createdAt: new Date().toISOString(),
      steps: [step],
      draft: {},
    }
    const denied: CustomerFlowResult = {
      allowed: false,
      reasonCode: decision.reasonCode,
      reason: decision.reason,
      sessionId,
      auditIds: [],
      bundle: deniedBundle,
    }
    if (params.input.persistAudit !== false) {
      denied.auditIds = await persistCustomerFlowAudit({
        auth: params.auth,
        sessionId,
        flow: 'gst-invoice-draft',
        allowed: false,
        reasonCode: denied.reasonCode,
        reason: denied.reason,
        bundle: deniedBundle,
      })
    }
    return denied
  }

  const supplierStateCode = (params.input.supplierStateCode || 'KA').trim().toUpperCase()
  const placeOfSupplyStateCode = (
    params.input.placeOfSupplyStateCode ||
    supplierStateCode
  )
    .trim()
    .toUpperCase()

  const gst = computeGst({
    supplierStateCode,
    placeOfSupplyStateCode,
    lineItems: params.input.lineItems,
  })

  const invoiceDraft = {
    title: `GST invoice draft for ${customerName}`,
    status: 'draft',
    approvalStatus: 'pending_approval',
    executable: false,
    filingStatus: 'not_filed',
    paymentStatus: 'not_paid',
    customerName,
    customerGstin: params.input.customerGstin?.trim() || null,
    customerId: params.input.customerId || null,
    supplierStateCode,
    placeOfSupplyStateCode,
    currency: 'INR',
    lineItems: gst.lines,
    taxableTotalInr: gst.taxableTotalInr,
    taxBreakup: {
      supplyType: gst.supplyType,
      cgstInr: gst.cgstInr,
      sgstInr: gst.sgstInr,
      igstInr: gst.igstInr,
      taxTotalInr: gst.taxTotalInr,
    },
    grandTotalInr: gst.grandTotalInr,
    notes: params.input.notes?.trim() || null,
    checklistBeforeIssue: [
      'Verify customer GSTIN format if provided',
      'Confirm place of supply state code',
      'Confirm HSN/SAC codes on each line',
      'Human finance approver must accept before issue/send',
    ],
  }

  step.draft = invoiceDraft

  const bundle: CustomerFlowDraftBundle = {
    draftId: createCustomerFlowDraftId('gst-invoice-draft'),
    flow: 'gst-invoice-draft',
    status: 'draft',
    approvalStatus: 'pending_approval',
    executable: false,
    createdAt: new Date().toISOString(),
    steps: [step],
    draft: invoiceDraft,
  }

  const result: CustomerFlowResult = {
    allowed: true,
    reasonCode: 'ALLOW',
    reason: 'GST invoice draft created; pending finance approval (not issued, not paid, not filed)',
    sessionId,
    auditIds: [],
    bundle,
  }

  if (params.input.persistAudit !== false) {
    result.auditIds = await persistCustomerFlowAudit({
      auth: params.auth,
      sessionId,
      flow: 'gst-invoice-draft',
      allowed: true,
      reasonCode: 'ALLOW',
      reason: result.reason,
      bundle,
    })
  }

  return result
}
