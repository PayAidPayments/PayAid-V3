/**
 * Phase 11: GST e-invoicing (ClearTax / GSTN) – IRN generation for mandatory e-invoicing.
 * Optional: integrate ClearTax API or GSTN; queue invoices for IRN.
 *
 * Env: CLEARTAX_API_KEY, CLEARTAX_GST_CLIENT_ID (or GSTN credentials).
 * Flow: invoice created → queue job → call IRN API → store irn/ack_no on invoice.
 */

export const GST_CLEARTAX_ENABLED = !!(process.env.CLEARTAX_API_KEY || process.env.GSTN_CLIENT_ID)

export interface EInvoicePayload {
  invoiceId: string
  tenantId: string
  gstin: string
  supplyType: 'B2B' | 'B2C' | 'SEZ' | 'EXPORT'
  docType: 'INV' | 'CRDN'
  docNumber: string
  docDate: string // YYYY-MM-DD
  totalValue: number
  taxableValue: number
  cgst?: number
  sgst?: number
  igst?: number
  items: { description: string; quantity: number; rate: number; amount: number; hsn: string }[]
}

export interface IRNResponse {
  irn: string
  ackNo: string
  ackDate: string
}

/**
 * Generate IRN for e-invoice (stub). Implement with ClearTax/GSTN API call.
 */
export async function generateIRN(payload: EInvoicePayload): Promise<IRNResponse | null> {
  if (!GST_CLEARTAX_ENABLED) return null
  // TODO: POST to ClearTax/GSTN e-invoice API; return irn, ack_no, ack_date
  void payload
  return null
}

/**
 * Queue invoice for IRN (Bull job). Call from invoice create/update.
 */
export async function queueInvoiceForIRN(invoiceId: string, tenantId: string): Promise<{ queued: boolean }> {
  if (!GST_CLEARTAX_ENABLED) return { queued: false }
  // TODO: add to Bull queue 'gst-irn'; worker loads invoice, builds EInvoicePayload, calls generateIRN, updates invoice
  void invoiceId
  void tenantId
  return { queued: false }
}
