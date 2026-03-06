export type PaymentTermValue =
  | 'Due on receipt'
  | 'Net 7'
  | 'Net 15'
  | 'Net 30'
  | 'Custom'

export const PAYMENT_TERMS: { value: PaymentTermValue; label: string; days?: number }[] = [
  { value: 'Due on receipt', label: 'Due on receipt', days: 0 },
  { value: 'Net 7', label: 'Net 7', days: 7 },
  { value: 'Net 15', label: 'Net 15', days: 15 },
  { value: 'Net 30', label: 'Net 30', days: 30 },
  { value: 'Custom', label: 'Custom' },
]

export function normalizePaymentTerm(input: string | null | undefined): PaymentTermValue | '' {
  const v = (input ?? '').trim()
  if (!v) return ''
  // Backward-compat with older labels
  if (v.toLowerCase() === 'due on receipt') return 'Due on receipt'
  if (v.toLowerCase() === 'due on receipt ') return 'Due on receipt'
  if (v.toLowerCase() === 'custom') return 'Custom'
  if (v.toLowerCase() === 'net 7') return 'Net 7'
  if (v.toLowerCase() === 'net 15') return 'Net 15'
  if (v.toLowerCase() === 'net 30') return 'Net 30'
  return '' // unknown
}

export function calculateDueDateFromTerms(terms: PaymentTermValue | '' , invoiceDateIso: string): string {
  if (!terms || !invoiceDateIso || terms === 'Custom') return ''
  const invoiceDateObj = new Date(invoiceDateIso)
  if (isNaN(invoiceDateObj.getTime())) return ''
  const term = PAYMENT_TERMS.find((t) => t.value === terms)
  const daysToAdd = term?.days
  if (daysToAdd == null) return ''
  const due = new Date(invoiceDateObj)
  due.setDate(due.getDate() + daysToAdd)
  return due.toISOString().split('T')[0]
}

