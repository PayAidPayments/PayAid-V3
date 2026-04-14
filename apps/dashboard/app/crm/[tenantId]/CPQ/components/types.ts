export type QuoteLineItem = {
  id?: string
  productName?: string
  description?: string
  quantity: number
  unit_price?: number
  unitPrice?: number
  discount?: number
  total?: number
}

export type Quote = {
  id: string
  quoteNumber?: string
  dealId?: string
  deal?: { id: string; name: string; stage?: string; value?: number }
  contact?: { id: string; name: string; email: string }
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  validUntil?: string | null
  notes?: string | null
  lineItems: QuoteLineItem[]
  approver?: { name: string } | null
  approvedAt?: string | null
  approvalNote?: string | null
  invoiceId?: string | null
  createdAt: string
}

export type QuotesApiPayload = {
  quotes?: Array<Record<string, unknown>>
}

export type DraftLineItem = {
  id: string
  item: string
  description: string
  qty: number
  unitPrice: number
  discountRate: number
  taxRate: number
  badge?: 'recommended' | 'required' | 'incompatible'
}

export type WorkspaceTab = 'builder' | 'pricing' | 'approvals' | 'document' | 'history'
