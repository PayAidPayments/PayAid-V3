import { DraftLineItem, Quote } from './types'

export function formatINR(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function normalizeQuote(raw: Record<string, unknown>): Quote {
  return {
    id: String(raw.id ?? ''),
    quoteNumber: (raw.quoteNumber as string) ?? (raw.quote_number as string),
    dealId: (raw.dealId as string) ?? (raw.deal_id as string),
    deal: raw.deal as Quote['deal'],
    contact: raw.contact as Quote['contact'],
    status: (raw.status as string) ?? 'draft',
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discount ?? 0),
    tax: Number(raw.tax ?? 0),
    total: Number(raw.total ?? 0),
    validUntil: (raw.validUntil as string | null) ?? (raw.valid_until as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    lineItems: Array.isArray(raw.lineItems)
      ? (raw.lineItems as Quote['lineItems'])
      : Array.isArray(raw.line_items)
        ? (raw.line_items as Quote['lineItems'])
        : [],
    approver: (raw.approver as Quote['approver']) ?? null,
    approvedAt: (raw.approvedAt as string | null) ?? (raw.approved_at as string | null) ?? null,
    approvalNote: (raw.approvalNote as string | null) ?? (raw.approver_note as string | null) ?? null,
    invoiceId: (raw.invoiceId as string | null) ?? (raw.invoice_id as string | null) ?? null,
    createdAt: (raw.createdAt as string) ?? (raw.created_at as string) ?? new Date().toISOString(),
  }
}

export function quoteToDraftItems(quote: Quote | null): DraftLineItem[] {
  if (!quote) return []
  return quote.lineItems.map((li, index) => {
    const unitPrice = Number(li.unitPrice ?? li.unit_price ?? 0)
    const qty = Number(li.quantity ?? 1)
    const base = unitPrice * qty
    const discountRate = base > 0 ? Math.min(0.9, Number(li.discount ?? 0) / base) : 0
    return {
      id: li.id ?? `${quote.id}-${index}`,
      item: li.productName ?? li.description ?? `Line Item ${index + 1}`,
      description: li.description ?? li.productName ?? 'Configured service',
      qty,
      unitPrice,
      discountRate,
      taxRate: 0.18,
      badge: index === 0 ? 'required' : index === 1 ? 'recommended' : undefined,
    }
  })
}
